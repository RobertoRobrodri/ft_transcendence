import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import User
from pong_auth.models import CustomUser
from .models import Game
from core.socket import *
from jwt import ExpiredSignatureError

import logging
logger = logging.getLogger(__name__)

connected_users = {}

# CHANNEL
MATCHMAKING_C = 'matchmaking_group'

# SOCKET CALLBACKS
INITMATCHMAKING =     'init_matchmaking'
CANCELMATCHMAKING = 'cancel_matchmaking'

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
                    await self.userWantPlay()
                elif type == CANCELMATCHMAKING:
                    await self.process_priv_msg(user, data)

        except Exception as e:
            logger.warning(f'Exception in receive: {e}')
            await self.close(code=4003)
            
    async def userWantPlay(self):
            await self.channel_layer.group_add("matchmaking_group", self.channel_name)
            logger.warning(f'connect: user.channel_name: {self.channel_name}')
            if len(self.channel_layer.groups["matchmaking_group"]) >= 2:
                await self.match_and_create_room()
            else:
                await self.send(text_data=json.dumps({'message': 'Waiting for another player...'}))

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

    def generate_unique_room_name(self, matched_channels):
        sorted_usernames = sorted(matched_channels)
        room_name = f'room_{hash("".join(sorted_usernames))}'
        return room_name
    
    async def get_user_groups(self):
        # Get all groups the socket is joined to
        groups = await self.channel_layer.groups.get(self.channel_name, set())
        return groups