import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import User
from pong_auth.models import CustomUser
from .models import Game
from core.socket import *
from jwt import ExpiredSignatureError
from .PongGame import PongGame
from .MatchmakingQueue import MatchmakingQueue

import logging
logger = logging.getLogger(__name__)

games = {}
matchmaking_lock = asyncio.Lock()
matchmaking_queue = MatchmakingQueue()

# CHANNEL
MATCHMAKING_C = 'matchmaking_group'

# SOCKET CALLBACKS
INQUEUE             = 'queue_matchmaking'
INITMATCHMAKING     = 'init_matchmaking'
CANCELMATCHMAKING   = 'cancel_matchmaking'
DIRECTION           = 'direction'
PLAYER_READY        = 'player_ready'
RESTORE_GAME        = 'restore_game'

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
                # If the user leaves and is inside queue, remove it
                await self.leaveMatchmaking()
                
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
                    await self.enterMarchmaking(user)
                elif type == CANCELMATCHMAKING:
                    await self.leaveMatchmaking(user)
                elif type == DIRECTION:
                    await self.move_paddle(data["message"], user)
                elif type == PLAYER_READY:
                    await self.player_ready(user)
                elif type == RESTORE_GAME:
                    await self.restoreGame(user)
                    
                # Tournament
                elif type == DIRECTION:
                    await self.move_paddle(data["message"])

        except Exception as e:
            logger.warning(f'Exception in receive: {e}')
            await self.close(code=4003)
    
    ###########################
    ## MATCHMAKING FUNCTIONS ##
    ###########################

    async def enterMarchmaking(self, user):
        # If user is already in queue
        if matchmaking_queue.is_user_in_queue(user.id):
            return
        # And prevent sockets if player is already in game
        game_id = get_game_id(user.id)
        if game_id is not None:
            return
        
        # If queue have 0 users, join
        async with matchmaking_lock: # Block this section to prevent 2 or more users add self to queue
            if matchmaking_queue.get_queue_size() == 0:
                matchmaking_queue.add_user(self.channel_name, user.id)
                await send_to_me(self, INQUEUE, {'message': 'Waiting for another player...'})
                return
        
        # Get oponent
        async with matchmaking_lock: # Block this section to prevent 2 or more users pop user and only have 1
            rival = matchmaking_queue.pop_users()
            if rival is None: # Anyway, let's check to prevent fails
                self.enterMarchmaking(user)
                return
        
        # Generate unique room name
        sorted_ids = sorted([rival["userid"], user.id])
        room_name = f'room_{hash("".join(map(str, sorted_ids)))}'
        
        # Add users to new group
        await self.channel_layer.group_add(room_name, rival['channel_name'])
        await self.channel_layer.group_add(room_name, self.channel_name)
        
		# Start game
        rivalUser = await CustomUser.get_user_by_id(rival['userid'])
        await self.start_game(user.id, user.username, rival['userid'], rivalUser.username, room_name)
        
		# Send info game start
        message = {'message': f'Pairing successful! United in the room {room_name}'}
        await send_to_group(self, room_name, INITMATCHMAKING, {'message': message})

    async def player_ready(self, user):
        game_id = get_game_id(user.id)
        if game_id:
            await games[game_id].player_ready(user.id)
    
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
    
    ######################
    ## HELPER FUNCTIONS ##
    ######################
    
    async def get_user_groups(self):
        # Get all groups the socket is joined to
        groups = await self.channel_layer.groups.get(self.channel_name, set())
        return groups
    
    ####################
    ## GAME FUNCTIONS ##
    ####################

    async def start_game(self, player1_id, player1_name, player2_id, player2_name, game_id):
        game = PongGame(game_id, self, True)
        game.add_player(player1_name, player1_id, 1)
        game.add_player(player2_name, player2_id, 2)
        games[game_id] = game

        # Iniciar el juego en segundo plano si aún no ha comenzado
        if not game.running:
            asyncio.create_task(game.start_game())

    async def move_paddle(self, direction, user):
        game_id = get_game_id(user.id)
        if game_id:
            games[game_id].move_paddle(user.id, direction)

def get_game_id(userid):
    # Buscar el game_id asociado al player_id
    for game_id, game in games.items():
        
        if any(player['userid'] == userid for player in game.players.values()):
            if game.finished:
                del games[game_id]
                return None
            return game_id
    return None
