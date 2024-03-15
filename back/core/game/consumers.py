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

connected_users = {}
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
                # TODO if user is in matchmaking, leave it, if user is in room, dont
                await self.channel_layer.group_discard(MATCHMAKING_C, self.channel_name)
                
        except Exception as e:
            logger.warning(f'Exception in disconnect: {e}')

    async def receive(self, text_data):
        try:
            user = self.scope["user"]
            if user.is_authenticated and not user.is_anonymous:
                data = json.loads(text_data)
                type = data["type"]

                if type == INITMATCHMAKING:
                    await self.enterMarchmaking()
                elif type == CANCELMATCHMAKING:
                    await self.leaveMatchmaking()
                elif type == DIRECTION:
                    await self.move_paddle(data["message"])

        except Exception as e:
            logger.warning(f'Exception in receive: {e}')
            await self.close(code=4003)
    
    ###########################
    ## MATCHMAKING FUNCTIONS ##
    ###########################
            
    async def directGame(self):
        pass
      
    async def enterMarchmaking(self):
        # Restore game
        game_id = self.get_game_id(self.scope["user"].username)
        if game_id is not None:
            await self.restoreGame(game_id)
            return
        
        # If queue have 0 users, join
        async with matchmaking_lock: # Block this section to prevent 2 or more users add self to queue
            if matchmaking_queue.get_queue_size() == 0:
                matchmaking_queue.add_user(self.channel_name, self.scope["user"].username)
                await send_to_me(self, INQUEUE, {'message': 'Waiting for another player...'})
                return
        # Get oponent
        async with matchmaking_lock: # Block this section to prevent 2 or more users pop user and only have 1
            rival = matchmaking_queue.pop_users()
            if rival is None: # Anyway, let's check to prevent fails
                self.enterMarchmaking()
                return
        
        # Generate unique room name
        room_name = self.generate_unique_room_name([rival['username'], self.scope["user"].username])
                
        # Add users to new group
        await self.channel_layer.group_add(room_name, rival['channel_name'])
        await self.channel_layer.group_add(room_name, self.channel_name)
                
        message = {'message': f'Pairing successful! United in the room {room_name}'}
        await send_to_group(self, room_name, INITMATCHMAKING, {'message': message})
        await self.start_game(self.channel_name, self.scope["user"].username, rival['channel_name'], rival['username'], room_name)

    async def leaveMatchmaking(self):
        matchmaking_queue.remove_user(self.channel_name)
    
    async def restoreGame(self, game_id):
        message = {'message': f'Game restored {game_id}'}
        await send_to_group(self, game_id, INITMATCHMAKING, {'message': message})
        await self.channel_layer.group_add(game_id, self.channel_name)
        await games[game_id].change_player(self.channel_name, self.scope["user"].username)
    
    ######################
    ## HELPER FUNCTIONS ##
    ######################
        
    def generate_unique_room_name(self, matched_channels):
        sorted_usernames = sorted(matched_channels)
        room_name = f'room_{hash("".join(sorted_usernames))}'
        return room_name
    
    async def get_user_groups(self):
        # Get all groups the socket is joined to
        groups = await self.channel_layer.groups.get(self.channel_name, set())
        return groups
    
    ####################
    ## GAME FUNCTIONS ##
    ####################

    async def start_game(self, player1_id, player1_name, player2_id, player2_name, game_id=None):
        game = PongGame(game_id, self, True)
        games[game_id] = game

        game.add_player(player1_id, player1_name, 1)
        game.add_player(player2_id, player2_name, 2)

        # Iniciar el juego en segundo plano si aún no ha comenzado
        if not game.running:
            asyncio.create_task(game.start_game())

    async def move_paddle(self, direction):
        game_id = self.get_game_id(self.scope["user"].username)
        if game_id:
            games[game_id].move_paddle(self.channel_name, direction)

    # async def leave_game(self):
    #     game_id = self.get_game_id(self.channel_name)
    #     if game_id:
    #         game = games[game_id]
    #         game.remove_player(self.channel_name)

    #         # Eliminar la instancia del juego si no hay jugadores
    #         if not game.players:
    #             del games[game_id]
    #             game.running = False

    def get_game_id(self, username):
        # Buscar el game_id asociado al player_id
        for game_id, game in games.items():
            if any(player['username'] == username for player in game.players.values()):
                if game.finished:
                    logger.warning(f"game.finished: {game.finished}")
                    del games[game_id]
                    return None
                return game_id
        return None
    # def get_game_id(self, username):
    #     # Buscar el game_id asociado al username
    #     for game_id, game in games.items():
    #         for _, player_info in game.players.items():
    #             if player_info['username'] == username:
    #                 return game_id
    #     return None
