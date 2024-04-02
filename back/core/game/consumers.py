import json
import time
import asyncio
import hashlib
import random
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.contrib.auth.models import User
from pong_auth.models import CustomUser
from .models import Game
from core.socket import *
from jwt import ExpiredSignatureError
from .PongGame import PongGame
from .MatchmakingQueue import MatchmakingQueue
from .game_state import games, tournaments, available_games

import logging
logger = logging.getLogger(__name__)

# tournaments = {}
# games = {} # Store games
# available_games = ["Pong", "Tournament"]
matchmaking_lock = asyncio.Lock()
join_tournament_lock = asyncio.Lock()
matchmaking_queue = MatchmakingQueue()

# CHANNEL
MATCHMAKING_C = 'matchmaking_group'
GENERAL_GAME  = 'general_game'

# SOCKET CALLBACKS
# matchmaking
INQUEUE             = 'queue_matchmaking'
INITMATCHMAKING     = 'init_matchmaking'
CANCELMATCHMAKING   = 'cancel_matchmaking'
RESTORE_GAME        = 'restore_game'
# ingame
ACTION              = 'action'
PLAYER_READY        = 'player_ready'
# games
LIST_GAMES          = 'list_games'
SPECTATE_GAME       = 'spectate_game'
LEAVE_SPECTATE_GAME = 'leave_spectate_game'
# tournament
CREATE_TOURNAMENT   = 'create_tournament'
JOIN_TOURNAMENT     = 'join_tournament'
LEAVE_TOURNAMENT    = 'leave_tournament'
LIST_TOURNAMENTS    = 'list_tournaments'


class MultiplayerConsumer(AsyncWebsocketConsumer):
    
    # Base function to send message to all in group
    async def general_message(self, event):
        text = event["text"]
        await self.send(text_data=text)
    
    # Base function to send message to all in group except self
    async def general_message_exclude_self(self, event):
        if self.channel_name != event["channel"]:
            text = event["text"]
            await self.send(text_data=text)
            
    async def connect(self):
        try:
            user = self.scope["user"]
            if user.is_authenticated and not user.is_anonymous:
                await self.channel_layer.group_add(GENERAL_GAME, self.channel_name)
                await self.accept()
                
        except ExpiredSignatureError as e:
            logger.warning(f'ExpiredSignatureError: {e}')
            await self.close(code=4003)
        except Exception as e:
            logger.warning(f'Exception in connect: {e}')
            await self.close(code=4004)
        
    async def disconnect(self, close_code):
        try:
            user = self.scope["user"]
            if user.is_authenticated and not user.is_anonymous:
                await self.channel_layer.group_discard(GENERAL_GAME, self.channel_name)
                # If the user leaves and is inside queue, remove it
                await self.leaveMatchmaking(user)
                
        except Exception as e:
            logger.warning(f'Exception in disconnect: {e}')

    async def receive(self, text_data):
        try:
            user = self.scope["user"]
            if user.is_authenticated and not user.is_anonymous:
                data = json.loads(text_data)
                type = data["type"]
                
                # Normal matchmaking
                if type == INITMATCHMAKING:
                    await self.enterMarchmaking(user, data)
                elif type == CANCELMATCHMAKING:
                    await self.leaveMatchmaking(user)
                elif type == RESTORE_GAME:
                    await self.restoreGame(user)
                # Ingame
                elif type == ACTION:
                    await self.execute_action(data["message"], user)
                elif type == PLAYER_READY:
                    await self.player_ready(user)
                # Tournaments
                elif type == CREATE_TOURNAMENT:
                    await self.createTournament(user, data)
                elif type == JOIN_TOURNAMENT:
                    await self.joinTournament(user, data)
                elif type == LEAVE_TOURNAMENT:
                    await self.leaveTournament(user, data)
                elif type == LIST_TOURNAMENTS:
                    await self.listTournaments(data)
                # Game
                elif type == LIST_GAMES:
                    await self.listGames(data)
                elif type == SPECTATE_GAME:
                    await self.spectateGame(data)
                elif type == LEAVE_SPECTATE_GAME:
                    await self.leaveSpectateGame(data)
                    

        except Exception as e:
            logger.warning(f'Exception in receive: {e}')
            await self.close(code=4003)
    
    ##########################
    ## TOURNAMENT FUNCTIONS ##
    ##########################
            
    def getTournamentList(self, data):
        alldata = data.get("message")
        if alldata is None:
            return
        game_req = alldata.get("game")
        if game_req is None:
            return
        tournament_list = []
        for tournament_id, tournament_info in tournaments.items():
            if tournament_info['game_request'] == game_req:
                current_players = len(tournament_info['participants'])
                tournament_summary = {
                    'id': tournament_id,
                    'name': tournament_info['name'],
                    'size': tournament_info['size'],
                    'currentPlayers': current_players
                }
                tournament_list.append(tournament_summary)
        return tournament_list

    async def listTournaments(self, data):
        await send_to_me(self, LIST_TOURNAMENTS, self.getTournamentList(data))
    
    async def leaveTournament(self, user, data):
        alldata = data.get("message")
        if alldata is None:
            return
        tournament_id = alldata.get("id")
        if tournament_id not in tournaments:
            return
        participants = tournaments[tournament_id].get('participants', [])
        user_exists = any(participant.get('user_id') == user.id for participant in participants)
        if not user_exists:
            return
        async with join_tournament_lock:
            # If owner leave, tounrament are removed
            if tournaments[tournament_id]["owner"] == user.id:
                del tournaments[tournament_id]
                await send_to_group(self, GENERAL_GAME, LIST_TOURNAMENTS, self.getTournamentList(data))
                return
            # Remove user from tournament participants
            for i, participant in enumerate(participants):
                if participant['user_id'] == user.id:
                    participants.pop(i)
                    await send_to_group(self, GENERAL_GAME, LIST_TOURNAMENTS, self.getTournamentList(data))
                    return
    
    async def joinTournament(self, user, data):
        alldata = data.get("message")
        if alldata is None:
            return
        tournament_id = alldata.get("id")
        nickname = alldata.get("nick")
        if tournament_id is None or nickname is None:
            return
        if tournament_id not in tournaments:
            return
        # Check if user are already on torunament
        participants = tournaments[tournament_id].get('participants', [])
        user_exists = any(participant.get('user_id') == user.id for participant in participants)
        if user_exists:
            return
        async with join_tournament_lock:
            # Check if tournament are full
            current_players = len(tournaments[tournament_id]['participants'])
            if current_players < tournaments[tournament_id]['size']:
                tournaments[tournament_id]['participants'].append({
                    'user_id': user.id,
                    'nickname': nickname
                })
                # We can replace to send only information of only 1 tournament instead entire list
                await send_to_group(self, GENERAL_GAME, LIST_TOURNAMENTS, self.getTournamentList(data))
            else:
                self.startTournament(tournament_id)
                
    async def createTournament(self, user, data):
        alldata = data.get("message")
        if alldata is None:
            return
        # If user is already in queue (any game)
        if matchmaking_queue.is_user_in_queue(user.id):
            return
        # And prevent sockets if player is already in game
        game_id = get_game_id(user.id)
        if game_id is not None:
            return
        tournament_name = f'room_{hashlib.sha256(str(user.id).encode()).hexdigest()}'
        # Check if user have a tournament
        if tournament_name in tournaments:
            return
        # get rcv info
        game_req        = alldata.get("game")
        custom_nick     = alldata.get("nickname")
        size            = alldata.get("size")
        name            = alldata.get("tournament_name")
        #if missing data, return
        if game_req is None or custom_nick is None or size is None or name is None:
            return
        tournament_info = {
            'id': tournament_name,
            'name': name,
            'owner': user.id,
            'size': int(size),
            'started': False,
            'game_request': game_req,
            'participants': [{ 'userid': user.id, 'nickname': custom_nick }]
        }
        tournaments[tournament_name] = tournament_info
        # Send message to chat to anounce tournaments has created
        await send_to_group(self, "general", "general_chat", {
            "message": f'New {game_req} tournament created!\nMax players {size}',
            "sender": "Admin"
        })
        await send_to_group(self, GENERAL_GAME, LIST_TOURNAMENTS, self.getTournamentList(data))

    async def startTournament(tournament_id):
        tournament = tournaments[tournament_id]
        participants = tournament['participants']
        random.shuffle(participants)
        pairings = [participants[i:i+2] for i in range(0, len(participants), 2)]
        for pairing in pairings:
            if len(pairing) == 2:  # Verificar que haya dos participantes en el emparejamiento
                player1 = pairing[0]
                player2 = pairing[1]

                await self.start_game(player1, player2, tournament_id)

        return
            
    ###########################
    ## MATCHMAKING FUNCTIONS ##
    ###########################

    async def enterMarchmaking(self, user, data):
        # Check if game type exist
        game_request = data.get("message")
        if game_request is None or not any(game in game_request for game in available_games):
            return
        # If user is already in queue (any game)
        if matchmaking_queue.is_user_in_queue(user.id):
            return
        # And prevent sockets if player is already in game
        game_id = get_game_id(user.id)
        if game_id is not None:
            return
        
        room_size = 1 #5 if game_request == "Tournament" else 1 #If game it's tournament, then spect size is 5 to enter in match, (6 with self)
        # If queue have 0 users, join
        async with matchmaking_lock: # Block this section to prevent 2 or more users add self to queue
            if matchmaking_queue.get_queue_size(game_request) < room_size:
                matchmaking_queue.add_user(self.channel_name, user.id, game_request)
                await send_to_me(self, INQUEUE, {'message': 'Waiting for another player...'})
                return
            
        # Get oponent
        async with matchmaking_lock: # Block this section to prevent 2 or more users pop user and only have 1
            rival = matchmaking_queue.pop_users(game_request, room_size)
            if rival is None: # Anyway, let's check to prevent fails
                self.enterMarchmaking(user, data)
                return
    
        ids = [r['userid'] for r in rival]
        ids.append(user.id)
        # Generate unique room name
        room_name = f'room_{hashlib.sha256(str(int(time.time())).encode()).hexdigest()}'
        
        # Add users to new group
        for r in rival:
            await self.channel_layer.group_add(room_name, r['channel_name'])
        await self.channel_layer.group_add(room_name, self.channel_name)
        
        # rivalUser = await CustomUser.get_user_by_id(rival[0]['userid'])
        # Add self to array
        rival.append({'channel_name': self.channel_name, 'userid': user.id, 'game': game_request})
        # Start game
        await self.start_game(rival, room_name, game_request)
            
        # Send info game start
        message = {'message': f'Pairing successful! United in the room {room_name}'}
        await send_to_group(self, room_name, INITMATCHMAKING, {'message': message})
        # await send_to_group(self, GENERAL_GAME, LIST_GAMES, self.getGamesList(game_request))
        await self.sendlistGamesToAll(game_request)

    async def player_ready(self, user):
        game_id = get_game_id(user.id)
        if game_id is not None:
            await games[game_id]["instance"].player_ready(user.id)
    
    async def leaveMatchmaking(self, user):
        matchmaking_queue.remove_user(user.id)
    
    async def restoreGame(self, user):
        # Restore game
        game_id = get_game_id(user.id)
        if game_id is not None:
            message = {'message': f'Game restored {game_id}'}
            await send_to_group(self, game_id, INITMATCHMAKING, {'message': message})
            await self.channel_layer.group_add(game_id, self.channel_name)
            # await games[game_id].change_player(self.channel_name, user.id)

    ####################
    ## GAME FUNCTIONS ##
    ####################
            
    # async def start_game(self, player1_id, player1_name, player2_id, player2_name, game_id, game_request = "Pong"):
    async def start_game(self, players, game_id, game_request = "Pong"):
        game = None
        if game_request == "Pong":
            game = {
                "game": game_request,
                "instance": PongGame(game_id, self, True)
            }
        # Add players to game
        player_number = 1
        for player in players:
            rivalUser = await CustomUser.get_user_by_id(player['userid'])
            game["instance"].add_player(rivalUser.username, rivalUser.id, player_number)
            player_number += 1
        games[game_id] = game

        # Iniciar el juego en segundo plano si aún no ha comenzado
        if not game["instance"].running:
            asyncio.create_task(game["instance"].start_game())

    async def execute_action(self, action, user):
        game_id = get_game_id(user.id)
        if game_id is not None:
            games[game_id]["instance"].execute_action(user.id, action)

    def getGamesList(self, game_req):
        game_list = []
        for game_id, game_info in games.items():
            if game_info['game'] == game_req:
                game_summary = {
                    'id': game_id
                }
                game_list.append(game_summary)
        return game_list

    async def listGames(self, data):
        alldata = data.get("message")
        if alldata is None:
            return
        game_req = alldata.get("game")
        if game_req is None:
            return
        await send_to_me(self, LIST_GAMES, self.getGamesList(game_req))

    async def sendlistGamesToAll(self, game_req):
        await send_to_group(self, GENERAL_GAME, LIST_GAMES, self.getGamesList(game_req))

    async def leaveSpectateGame(self, data):
        alldata = data.get("message")
        if alldata is None:
            return
        room_req = alldata.get("id")
        if room_req is None:
            return
        await self.channel_layer.group_discard(room_req, self.channel_name)

    async def spectateGame(self, data):
        alldata = data.get("message")
        if alldata is None:
            return
        room_req = alldata.get("id")
        if room_req is None:
            return
        await self.channel_layer.group_add(room_req, self.channel_name)
            
    ######################
    ## HELPER FUNCTIONS ##
    ######################
    
    # async def get_user_groups(self):
    #     # Get all groups the socket is joined to
    #     groups = self.channel_layer.groups.get(self.channel_name, set())
    #     groups_list = list(groups)
    #     return groups_list
    
    # async def get_user_groups(self, channel_name):
    #     user_groups_key = f"user_groups:{channel_name}"
    #     redis_conn = self.channel_layer.connection(0)
    #     user_groups_json = await redis_conn.get(user_groups_key)
    #     if not user_groups_json:
    #         return []
    #     user_groups = json.loads(user_groups_json)
    #     return user_groups

    # async def join_group(self, group_name, channel_name):
    #     await self.channel_layer.group_add(group_name, channel_name)
    #     user_groups_key = f"user_groups:{channel_name}"
    #     redis_conn = self.channel_layer.connection(0)
    #     user_groups_json = await redis_conn.get(user_groups_key)
    #     user_groups = json.loads(user_groups_json) if user_groups_json else []
    #     user_groups.append(group_name)
    #     await redis_conn.set(user_groups_key, json.dumps(user_groups))

    # async def leave_group(self, group_name, channel_name):
    #     await self.channel_layer.group_discard(group_name, channel_name)
    #     user_groups_key = f"user_groups:{channel_name}"
    #     redis_conn = self.channel_layer.connection(0)
    #     user_groups_json = await redis_conn.get(user_groups_key)
    #     user_groups = json.loads(user_groups_json) if user_groups_json else []
    #     if group_name in user_groups:
    #         user_groups.remove(group_name)
    #     await redis_conn.set(user_groups_key, json.dumps(user_groups))
    
def get_game_id(userid):
    # Buscar el game_id asociado al player_id
    for game_id, game in games.items():
        if any(player['userid'] == userid for player in game["instance"].players.values()):
            return game_id
    return None

