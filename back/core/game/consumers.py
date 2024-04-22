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
from .pool.PoolGame import PoolGame
from .MatchmakingQueue import MatchmakingQueue
from .game_state import games, tournaments, available_games, matchmaking_queue

import logging
logger = logging.getLogger(__name__)

# tournaments = {}
# games = {} # Store games
# available_games = ["Pong", "Tournament"]
matchmaking_lock = asyncio.Lock()
join_tournament_lock = asyncio.Lock()
# matchmaking_queue = MatchmakingQueue()

# CHANNEL
MATCHMAKING_C = 'matchmaking_group'
GENERAL_GAME  = 'general_game'

# SOCKET CALLBACKS
MY_DATA             = 'my_data'
# matchmaking
INQUEUE             = 'queue_matchmaking'
INITMATCHMAKING     = 'init_matchmaking'
GAME_RESTORED       = 'game_restored'
CANCELMATCHMAKING   = 'cancel_matchmaking'
RESTORE_GAME        = 'restore_game'
USERS_PLAYING       = 'users_playing'
# ingame
ACTION              = 'action'
PLAYER_READY        = 'player_ready'
# games
LIST_GAMES          = 'list_games'
SPECTATE_GAME       = 'spectate_game'
LEAVE_SPECTATE_GAME = 'leave_spectate_game'
# tournament
TOURNAMENT_CREATED  = 'tournament_created'
CREATE_TOURNAMENT   = 'create_tournament'
JOIN_TOURNAMENT     = 'join_tournament'
LEAVE_TOURNAMENT    = 'leave_tournament'
LIST_TOURNAMENTS    = 'list_tournaments'
IN_TOURNAMENT       = 'in_tournament'
TOURNAMENT_TABLE    = 'tournament_table'
TOURNAMENT_PLAYERS  = 'tournament_players'


class MultiplayerConsumer(AsyncWebsocketConsumer):
    connected_users = {}
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
                if user.id in self.connected_users:
                    await self.close(code=4001)
                    logger.debug('Already connected')
                    return
                logger.debug('Connect')
                self.connected_users[user.id] = self.channel_name
                await self.channel_layer.group_add(GENERAL_GAME, self.channel_name)
                await self.accept()
                await send_to_me(self, MY_DATA, {'id': user.id, 'username': user.username})
                
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
                if user.id in self.connected_users:
                    del self.connected_users[user.id]
                await self.channel_layer.group_discard(GENERAL_GAME, self.channel_name)
                # If the user leaves and is inside queue, remove it
                await self.leaveMatchmaking(user)
                # Notify to game if exist
                game_id = get_game_id(user.id)
                if game_id is not None:
                    await games[game_id]["instance"].userLeave(user.id)
                
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
                    await self.restoreTournament(user)
                    await self.restoreGame(user, data)
                # Ingame
                elif type == ACTION:
                    await self.execute_action(data, user)
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
                elif type == TOURNAMENT_TABLE:
                    await self.get_tournament_table(data)
                elif type == TOURNAMENT_PLAYERS:
                    await self.get_tournament_players(data)
                    
        except Exception as e:
            logger.warning(f'Exception in receive: {e}')
            await self.close(code=4003)
    
    ##########################
    ## TOURNAMENT FUNCTIONS ##
    ##########################
    
    # Expected imput
    # tournament_obj = {
    #     "tournamentId": 0,
    #     "players": ["Player1", "Player2"],
    #     "matches": [
    #         {"id": 1, "playerIds": [1, 2], "score": [0, 0], "date": 1638316800},
    #         {"id": 2, "playerIds": [3, 4], "score": [0, 0], "date": 1638403200}
    #     ]
    # }
    
    async def restoreTournament(self, user):
        userid = user.id
        for tournament_id, tournament_info in tournaments.items():
            participants = tournament_info.get('participants', [])
            for participant in participants:
                if participant['userid'] == userid:
                    participant['channel_name'] = self.channel_name
                    await send_to_me(self, IN_TOURNAMENT, {"game": tournament_info['game_request'], "data": self.getSingleTournament(tournament_id)})

    def getTournamentList(self, game_req):
        tournament_list = []
        for tournament_id, tournament_info in tournaments.items():
            if tournament_info['game_request'] == game_req and tournament_info['started'] == False:
                current_players = len(tournament_info['participants'])
                tournament_summary = {
                    'id': tournament_id,
                    'adminId': tournament_info['adminId'],
                    'admin': tournament_info['admin'],
                    'name': tournament_info['name'],
                    'size': tournament_info['size'],
                    'currentPlayers': current_players
                }
                tournament_list.append(tournament_summary)
        return {"game": game_req, "data": tournament_list}
    
    def getSingleTournament(self, tournament_id):
        if tournament_id not in tournaments:
            return
        current_players = len(tournaments[tournament_id]['participants'])
        tournament_summary = {
            'id': tournament_id,
            'adminId': tournaments[tournament_id]['adminId'],
            'admin': tournaments[tournament_id]['admin'],
            'name': tournaments[tournament_id]['name'],
            'size': tournaments[tournament_id]['size'],
            'currentPlayers': current_players
        }
        return tournament_summary
        
    async def listTournaments(self, data):
        game_req = data.get("message")
        if game_req is None:
            return
        await send_to_me(self, LIST_TOURNAMENTS, self.getTournamentList(game_req))
    
    async def leaveTournament(self, user, data):
        alldata = data.get("message")
        if alldata is None:
            return
        tournament_id = alldata.get("id")
        if tournament_id not in tournaments:
            return
        game_req = alldata.get("game")
        if alldata is None:
            return
        participants = tournaments[tournament_id].get('participants', [])
        user_exists = any(participant.get('userid') == user.id for participant in participants)
        if not user_exists:
            return
        async with join_tournament_lock:
            # If owner leave, tounrament are removed
            if tournaments[tournament_id]["adminId"] == user.id:
                del tournaments[tournament_id]
                await send_to_group(self, GENERAL_GAME, LIST_TOURNAMENTS, self.getTournamentList(game_req))
                return
            # Remove user from tournament participants
            for i, participant in enumerate(participants):
                if participant['userid'] == user.id:
                    participants.pop(i)
                    await send_to_group(self, GENERAL_GAME, LIST_TOURNAMENTS, self.getTournamentList(game_req))
                    return
    
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
        nickname        = alldata.get("nickname")
        size            = alldata.get("size")
        name            = alldata.get("tournament_name")
        try: #prevent crash on cast if it's not base 10 input
            size = int(size)
        except ValueError:
            return
        if size < 2: # Size cannot be less than 2
            return
        #if missing data, return
        if game_req is None or nickname is None or size is None or name is None:
            return
        tournament_info = {
            'id': tournament_name,
            'name': name,
            'adminId': user.id,
            'admin': user.username,
            'size': size,
            'started': False,
            'game_request': game_req,
            'participants': [{
                'channel_name': self.channel_name,
                'userid': user.id,
                'nickname': nickname,
                'winner': False,
                'points': 0
            }]
        }
        tournaments[tournament_name] = tournament_info
        # Send message to chat to anounce tournaments has created
        await send_to_group(self, "general", "general_chat", {
            "message": f'New {game_req} tournament created!\nMax players {size}',
            "sender_name": "Admin"
        })
        await send_to_me(self, TOURNAMENT_CREATED, {"game": game_req, "data": self.getSingleTournament(tournament_name)})
        await send_to_group_exclude_self(self, GENERAL_GAME, LIST_TOURNAMENTS, self.getTournamentList(game_req))

    async def joinTournament(self, user, data):
        alldata = data.get("message")
        if alldata is None:
            return
        tournament_id = alldata.get("id")
        nickname = alldata.get("nick")
        game_req = alldata.get("game")
        if tournament_id is None or nickname is None or game_req is None:
            return
        if tournament_id not in tournaments:
            return
        # Check if user are already on any torunament
        for _,tournament in tournaments.items():
            participants = tournament.get('participants', [])
            for participant in participants:
                if participant['userid'] == user.id:
                    return
        # participants = tournaments[tournament_id].get('participants', [])
        # user_exists = any(participant.get('userid') == user.id for participant in participants)
        # if user_exists:
        #     return
        async with join_tournament_lock:
            # Check if tournament are full
            current_players = len(tournaments[tournament_id]['participants'])
            if current_players < tournaments[tournament_id]['size']:
                tournaments[tournament_id]['participants'].append({
                    'channel_name': self.channel_name,
                    'userid': user.id,
                    'nickname': nickname,
                    'winner': False,
                    'points': 0
                })
                current_players += 1
                if current_players == tournaments[tournament_id]['size']:
                    tournaments[tournament_id]['started'] = True
                    await self.startTournament(tournament_id)
                    # We can replace to send only information of only 1 tournament instead entire list
                await send_to_group(self, GENERAL_GAME, LIST_TOURNAMENTS, self.getTournamentList(game_req))
                await send_to_me(self, IN_TOURNAMENT, {"game": "Pong", "data": self.getSingleTournament(tournament_id)})

    async def startTournament(self, tournament_id):
        tournament = tournaments[tournament_id]
        participants = tournament['participants']
        random.shuffle(participants)
        pairings = [participants[i:i+2] for i in range(0, len(participants), 2)]
        if 'rounds' not in tournament:
            tournament['rounds'] = []
        tournament['rounds'].append(pairings)
        
        # Send tournament table
        await send_to_group(self, GENERAL_GAME, TOURNAMENT_TABLE, {'game': tournament['game_request'], 'data': self.extract_player_info(tournament_id)})

        for pairing in pairings:
            if len(pairing) == 2:
                room_name = f'room_{hashlib.sha256(str(int(time.time())).encode()).hexdigest()}'
                for r in pairing:
                    await self.channel_layer.group_add(room_name, r['channel_name'])
                await self.start_game(pairing, room_name, tournament['game_request'], tournament_id)
            else:
                participants_index = participants.index(pairing[0])
                participants[participants_index]['winner'] = True

    
    async def start_next_round(self, tournament_id):
        tournament = tournaments[tournament_id]
        current_round = tournament['rounds'][-1]  # Get last round
        winners = []
        
        # Send tournament table
        await send_to_group(self, GENERAL_GAME, TOURNAMENT_TABLE, {'game': tournament['game_request'], 'data': self.extract_player_info(tournament_id)})

        # Verify that each pairing has at least one winner
        if all(any(player['winner'] for player in pairing) for pairing in current_round):
            # Get the winners of the last round
            for pairing in current_round:
                winner = [player for player in pairing if player['winner']][0]  # Get the first player with winner=True
                winners.append(winner)
            # If winner have only 1 element, player win!
            if len(winners) == 1:
                logger.warning(f'final round: {winners[0]}')
                #save data in blockchain
                
                #send winner to other players
                
                # Remove from tournament
                del tournaments[tournament_id]
                return
            
            # Set winner to False to next round
            for winner in winners:
                winner['winner'] = False
            # Reassign next round players
            participants = winners

            random.shuffle(participants)
            pairings = [participants[i:i+2] for i in range(0, len(participants), 2)]
            tournament['rounds'].append(pairings)
            for pairing in pairings:
                if len(pairing) == 2:
                    room_name = f'room_{hashlib.sha256(str(int(time.time())).encode()).hexdigest()}'
                    for r in pairing:
                        userchannel = self.get_tournament_channel(tournament_id, r['userid'])
                        await self.channel_layer.group_add(room_name, userchannel)
                    
                    await self.start_game(pairing, room_name, tournament['game_request'], tournament_id)
                else:
                    participants_index = participants.index(pairing[0])
                    participants[participants_index]['winner'] = True
        else:
            pass
    
    async def get_tournament_table(self, data):
        alldata = data.get("message")
        if alldata is None:
            return
        tournament_id = alldata.get("id")
        tournament = tournaments[tournament_id]
        await send_to_group(self, GENERAL_GAME, TOURNAMENT_TABLE, {'game': tournament['game_request'], 'data': self.extract_player_info(tournament_id)})
    
    async def get_tournament_players(self, data):
        tournament_id = data.get("message")
        if tournament_id is None:
            return
        await send_to_group(self, GENERAL_GAME, TOURNAMENT_PLAYERS, tournaments[tournament_id]['participants'])
        

    def extract_player_info(self, tournament_id):
        tournament = tournaments[tournament_id]
        extracted_info = []
        for rounds in tournament['rounds']:
            round_info = []
            for game in rounds:
                game_info = []
                for player_data in game:
                    player_info = {
                        'userid': player_data['userid'],
                        'nickname': player_data['nickname'],
                        'points': player_data['points']
                    }
                    game_info.append(player_info)
                round_info.append(game_info)
            extracted_info.append(round_info)
        return extracted_info

    def get_tournament_channel(self, tournament_id, userid):
        if tournament_id in tournaments:
            participants = tournaments[tournament_id]['participants']
            for participant in participants:
                if participant['userid'] == userid:
                    return participant['channel_name']
        return None
    
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
                await send_to_me(self, INQUEUE, {'game': game_request, 'message': 'Waiting for another player...'})
                return
            
        # Get oponent
        async with matchmaking_lock: # Block this section to prevent 2 or more users pop user and only have 1
            rival = matchmaking_queue.pop_users(game_request, room_size)
            if rival is None: # Anyway, let's check to prevent fails
                self.enterMarchmaking(user, data)
                return
            
        await send_to_me(self, INQUEUE, {'game': game_request, 'message': 'Waiting for another player...'})
        # Generate unique room name
        room_name = f'room_{hashlib.sha256(str(int(time.time())).encode()).hexdigest()}'
        
        # Add users to new group
        for r in rival:
            await self.channel_layer.group_add(room_name, r['channel_name'])
        await self.channel_layer.group_add(room_name, self.channel_name)
        
        # Add self to array
        rival.append({'channel_name': self.channel_name, 'userid': user.id, 'game': game_request})
        # Start game
        await self.start_game(rival, room_name, game_request)

    async def player_ready(self, user):
        game_id = get_game_id(user.id)
        logger.warning(f"user: {user.username}  game: {game_id}")
        if game_id is not None:
            await games[game_id]["instance"].player_ready(user.id)
    
    async def leaveMatchmaking(self, user):
        matchmaking_queue.remove_user(user.id)

    async def restoreGame(self, user, data):
        # Restore game
        game_id = get_game_id(user.id)
        if game_id is not None:
            game_req = data.get("message")
            if game_req is None:
                return
            if games[game_id]["game"] == game_req:
                if games[game_id]["instance"].consumer == None:
                    games[game_id]["instance"].consumer = self
                message = {'message': f'Game restored {game_id}'}
                await send_to_me(self, GAME_RESTORED, {'game': game_req, 'message': message})
                await self.channel_layer.group_add(game_id, self.channel_name)
                await games[game_id]["instance"].restore()
                await self.send_game_players(game_id, True)

    ####################
    ## GAME FUNCTIONS ##
    ####################
    
    async def send_game_players(self, game_id, singleSend = False):
        if singleSend:
            await send_to_me(self, USERS_PLAYING, {'game': games[game_id]["game"], 'users': games[game_id]["instance"].players})
        else:
            await send_to_group(self, game_id, USERS_PLAYING, {'game': games[game_id]["game"], 'users': games[game_id]["instance"].players})

    async def start_game(self, players, game_id, game_request = "Pong", tournament_id = None):
        game = None
        if game_request == "Pong":
            game = {
                "game": game_request,
                "instance": PongGame(game_id, self, tournament_id)
            }
        elif game_request == "Pool":
            game = {
                "game": game_request,
                "instance": PoolGame(game_id, self, tournament_id)
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
            await asyncio.sleep(1)  # Wait 1 seconds
            # Send info game start
            message = {'message': f'Pairing successful! United in the room {game_id}'}
            await send_to_group(self, game_id, INITMATCHMAKING, {'game': game_request, 'message': message})
            await self.send_game_players(game_id)
            await self.sendlistGamesToAll(game_request)

    # async def execute_action(self, data, user):
    #     game_id = get_game_id(user.id)
    #     action = data.get("message")
    #     if action is None:
    #         return
    #     if game_id is not None:
    #         await games[game_id]["instance"].execute_action(user.id, action)
    async def execute_action(self, data, user):
       game_id = get_game_id(user.id)
       if game_id is None:
           return
       all_data = data.get("message")
       if all_data is None:
           return
       game_req = all_data.get("game")
       action = all_data.get("action")
       if game_req is None or action is None:
           return
       if game_req == games[game_id]["game"]:
           await games[game_id]["instance"].execute_action(user.id, action)


    def getGamesList(self, game_req):
        game_list = []
        for game_id, game_info in games.items():
            if game_info['game'] == game_req:
                game_summary = {
                    'id': game_id
                }
                game_list.append(game_summary)
        return {'game': game_req, 'data': game_list}

    async def listGames(self, data):
        game_req = data.get("message")
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
        await games[room_req]["instance"].restore()
        await self.send_game_players(room_req, True)
            
def get_game_id(userid):
    # Find game_id asscociated with player_id
    for game_id, game in games.items():
        if any(player['userid'] == userid for player in game["instance"].players.values()):
            return game_id
    return None

