import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from core.socket import *
from jwt import ExpiredSignatureError

import logging
logger = logging.getLogger(__name__)

connected_users = {}

GENERAL_CHAT = "general_chat"

class ChatConsumer(AsyncWebsocketConsumer):
    
    # Base function to send message to all in group
    async def general_message(self, event):
        text = event["text"]
        await self.send(text_data=text)
    
    # Base function to send message to all in group except self
    async def general_message_exclude_self(self, event):
        text = event["text"]
        if self.channel_name != event["channel"]:
            await self.send(text_data=text)
        
    async def connect(self):
        try:
            user = self.scope["user"]
            if user.is_authenticated and not user.is_anonymous:
                await self.accept()
                connected_users[self.channel_name] = user.username
                # Add user to `{general_chat}` room
                await self.channel_layer.group_add(GENERAL_CHAT,self.channel_name)
                # Send a user_connected message to the group (excluding the connected user)
                await send_to_group_exclude_self(self, GENERAL_CHAT, "user_connected", user.username)
                
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
                await send_to_group(self, GENERAL_CHAT, "user_disconnected", user.username)
                
        except Exception as e:
            logger.warning(f'Exception: {e}')

    async def receive(self, text_data):
        try:
            user = self.scope["user"]
            if user.is_authenticated and not user.is_anonymous:
                data = json.loads(text_data)
                type = data["type"]

                if type == "general_msg":
                    # Receive new message, let's spread it, but including information like Username
                    data["sender_name"] = user.username
                    await send_to_group(self, GENERAL_CHAT, "general_msg", data)
                elif type == "priv_msg":
                    message_data = json.loads(data["message"])
                    recipient = message_data["recipient"]
                    userChannel = get_channel_name_by_username(recipient, connected_users)
                    if(userChannel and recipient != user.username):
                        data["sender_name"] = user.username
                        data["message"] = message_data["message"]
                        # Send message to recipient user
                        await send_to_user(self, userChannel, "priv_msg", data)
                        # and send message to me too
                        await send_to_me(self, "priv_msg", data)
                elif type == "get_users":
                    await self.send_user_list()

        except Exception as e:
            logger.warning(f'Exception in receive: {e}')
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
        await send_to_me(self, 'user_list', connected_users_list)
