import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .socket import *
from jwt import ExpiredSignatureError

import logging
logger = logging.getLogger(__name__)

connected_users = {}

GENERAL_CHAT = "general_chat"

class ChatConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        try:
            user = self.scope["user"]
            if user.is_authenticated and not user.is_anonymous:
                await self.accept()
                connected_users[self.channel_name] = user.username
                # Add user to `{general_chat}` room
                await self.channel_layer.group_add(GENERAL_CHAT,self.channel_name)
                # Send a user_connected message to the group (excluding the connected user)
                await send_to_group_exclude_self(GENERAL_CHAT, "user_connected", user.username)
                
        except ExpiredSignatureError as e:
            await self.close(code=4003)
        except Exception as e:
            await self.close(code=4003)

    async def disconnect(self, close_code):
        try:
            user = self.scope["user"]
            if user.is_authenticated and not user.is_anonymous:
                del connected_users[self.channel_name]
                await self.channel_layer.group_discard(GENERAL_CHAT,self.channel_name)
                await send_to_group(GENERAL_CHAT, "user_disconnected", user.username)
                
        except Exception as e:
            logger.warning(f'Exception: {e}')

    async def receive(self, text_data):
        try:
            user = self.scope["user"]
            if user.is_authenticated and not user.is_anonymous:
                data = json.loads(text_data)
                type = data["type"]

                if type == "message":
                    await self.send_message("message", data["message"])
                elif type == "private_message":
                    await self.send_private_message(data["recipient"], data["message"])
                elif type == "get_users":
                    await self.send_user_list()

        except Exception as e:
            await self.close(code=4003)
            
    

    ####################
    ## CHAT FUNCTIONS ##
    ####################

    async def send_user_list(self):
        connected_users_list = list(connected_users.values())
        # Exclude self user
        user = self.scope["user"]
        connected_users_list.remove(user.username)
        # Send to self
        await send_to_me('user_list', connected_users_list)

        
    
    
