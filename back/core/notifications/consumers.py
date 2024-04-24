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
from core.socket import *
from jwt import ExpiredSignatureError
from asgiref.sync import sync_to_async

import logging
logger = logging.getLogger(__name__)

USER_CONNECTED      = 'user_connected'
USER_DISCONNECTED   = 'user_disconnected'
USER_LIST           = 'user_list'
STATUS_CHANNEL      = 'status_channel'

class NotificationsConsumer(AsyncWebsocketConsumer):
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
                self.connected_users[user.id] = (self.channel_name)
                # await self.channel_layer.group_add(GENERAL_GAME, self.channel_name)
                await self.accept()
                await send_to_group_exclude_self(self, STATUS_CHANNEL, USER_CONNECTED, {'id': user.id, 'username': user.username})

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
                # await self.channel_layer.group_discard(GENERAL_GAME, self.channel_name)
                
        except Exception as e:
            logger.warning(f'Exception in disconnect: {e}')

    async def receive(self, text_data):
        try:
            user = self.scope["user"]
            if user.is_authenticated and not user.is_anonymous:
                data = json.loads(text_data)
                type = data["type"]
                if type == USER_LIST:
                    await self.send_user_list()

        except Exception as e:
            logger.warning(f'Exception in receive: {e}')
            await self.close(code=4003)
            
    async def send_user_list(self):
        user_ids = list(self.connected_users.keys())
        usernames_coroutine = CustomUser.objects.filter(id__in=user_ids).values_list('id', 'username')
        usernames = await sync_to_async(list)(usernames_coroutine)
        result = {user_id: username for user_id, username in usernames}
        await send_to_me(self, USER_LIST, result)
