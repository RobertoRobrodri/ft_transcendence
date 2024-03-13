import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import User
from pong_auth.models import CustomUser
from .models import Game
from core.socket import *
from jwt import ExpiredSignatureError
from .PongGame import PongGame
import asyncio

import logging
logger = logging.getLogger(__name__)

connected_users = {}

# CHANNEL
MATCHMAKING_C = 'matchmaking_group'

# SOCKET CALLBACKS
INQUEUE             = 'queue_matchmaking'
INITMATCHMAKING     = 'init_matchmaking'
CANCELMATCHMAKING   = 'cancel_matchmaking'
DIRECTION           = 'direction'

class MultiplayerConsumer(AsyncWebsocketConsumer):
    
    games = {}
      
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
            await self.channel_layer.group_add(MATCHMAKING_C, self.channel_name)
            logger.warning(f'connect: user.channel_name: {self.channel_name}')
            if len(self.channel_layer.groups[MATCHMAKING_C]) >= 2:
                await self.match_and_create_room()
            else:
                await send_to_me(self, INQUEUE, {'message': 'Waiting for another player...'})

    async def leaveMatchmaking(self):
            await self.channel_layer.group_discard(MATCHMAKING_C, self.channel_name)
                
    async def match_and_create_room(self):
        
        group_channels = list(self.channel_layer.groups.get(MATCHMAKING_C, set()))
        matched_channels = group_channels[:2]
        
        for channel_name in matched_channels:
            # Remove users from matchmaking group
            await self.channel_layer.group_discard(MATCHMAKING_C, channel_name)
            logger.warning(f'for: user.channel_name: {channel_name}')
            
        # Generate unique room name
        room_name = self.generate_unique_room_name(matched_channels)
        logger.warning(f'room_name: {room_name}')

        # Add users to new group
        for channel_name in matched_channels:
            await self.channel_layer.group_add(room_name, channel_name)

        # notify matchmaking
        message = {'message': f'Pairing successful! United in the room {room_name}'}
        await send_to_group(self, room_name, INITMATCHMAKING, {'message': message})
        # await self.channel_layer.group_send(room_name, {'message': message})
        await self.start_game(matched_channels[0], matched_channels[1], room_name)

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

    async def start_game(self, player1, player2, game_id=None):
        game = PongGame(game_id, self)
        self.games[game_id] = game

        game.add_player(player1, 1)
        game.add_player(player2, 2)

        # Iniciar el juego en segundo plano si aún no ha comenzado
        if not game.running:
            asyncio.create_task(game.start_game())

    async def move_paddle(self, direction):
        game_id = self.get_game_id(self.channel_name)
        if game_id:
            self.games[game_id].move_paddle(self.channel_name, direction)

    async def leave_game(self):
        game_id = self.get_game_id(self.channel_name)
        if game_id:
            game = self.games[game_id]
            game.remove_player(self.channel_name)

            # Eliminar la instancia del juego si no hay jugadores
            if not game.players:
                del self.games[game_id]
                game.running = False

    def get_game_id(self, player_id):
        # Buscar el game_id asociado al player_id
        for game_id, game in self.games.items():
            if any(player['id'] == player_id for player in game.players.values()):
                return game_id
        return None