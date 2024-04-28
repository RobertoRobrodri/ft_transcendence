import json
import base64
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

STATUS_CONNECTED        = 'status_connected'
STATUS_DISCONNECTED     = 'status_disconnected'
STATUS_USER_LIST        = 'status_user_list'
STATUS_CHANNEL          = 'status_channel'
FRIEND_REQUEST_SENT     = 'friend_request_sent'
FRIEND_REQUEST_RECEIVED = 'friend_request_received'

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
                if self.channel_name in self.connected_users:
                    await self.close(code=4001)
                    logger.debug('Already connected')
                    return
                await self.accept()
                await self.channel_layer.group_add(STATUS_CHANNEL, self.channel_name)
                self.connected_users[self.channel_name] = user
                # send yourself to all the users
                profile_picture_url = ''
                if user.profile_picture:
                        # Open the profile picture file, read its content, and encode it in base64
                        with open(user.profile_picture.path, "rb") as image_file:
                            profile_picture_content = base64.b64encode(image_file.read()).decode('utf-8')
                            profile_picture_url = f'data:image/jpeg;base64,{profile_picture_content}'
                await CustomUser.update_user_on_connect_to_site(user, self.channel_name)
                await send_to_group_exclude_self(self, STATUS_CHANNEL, STATUS_CONNECTED, {'id': user.id, 'username': user.username, 'image': profile_picture_url})

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
                if self.channel_name in self.connected_users:
                    del self.connected_users[self.channel_name]
                await CustomUser.update_user_on_disconnect_from_site(user)
                await send_to_group_exclude_self(self, STATUS_CHANNEL, STATUS_DISCONNECTED, {'id': user.id, 'username': user.username})
                await self.channel_layer.group_discard(STATUS_CHANNEL, self.channel_name)
                
        except Exception as e:
            logger.warning(f'Exception in disconnect: {e}')

    async def receive(self, text_data):
        try:
            user = self.scope["user"]
            if user.is_authenticated and not user.is_anonymous:
                data = json.loads(text_data)
                type = data["type"]
                if type == STATUS_USER_LIST:
                    await self.send_user_list()
                elif type == FRIEND_REQUEST_SENT:
                    logger.debug('FRIEND REQUEST' + FRIEND_REQUEST_SENT)
                    await self.send_notification(user, data)
        except Exception as e:
            logger.warning(f'Exception in receive: {e}')
            await self.close(code=4003)
            
    async def send_user_list(self):
        # Send the whole list
        user_list = self.get_user_list()
        await send_to_me(self, STATUS_USER_LIST, user_list)
    
    def get_user_list(self):
        user_list = []
        for user in self.connected_users.values():
            user_data = {
                'id': user.id,
                'username': user.username,
                'image': ''  # Default value if user doesn't have a profile picture
            }
            if user.profile_picture:
                # Open the profile picture file, read its content, and encode it in base64
                with open(user.profile_picture.path, "rb") as image_file:
                    profile_picture_content = base64.b64encode(image_file.read()).decode('utf-8')
                    user_data['image'] = f'data:image/jpeg;base64,{profile_picture_content}'
            user_list.append(user_data)
        return user_list

    async def send_notification(self, user, data):
        message_data = data["message"]
        recipient = message_data.get("recipient")
        if recipient and recipient.isdigit():
            userChannel = await CustomUser.get_user_by_id(recipient)
            if(userChannel and recipient != user.id):
                await send_to_user(self, userChannel.channel_name, FRIEND_REQUEST_RECEIVED, {'id': user.id, 'username': user.username, 'message': "Has sent you a friend request"})