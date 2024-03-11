import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import User
from pong_auth.models import CustomUser
from .models import ChatModel
from core.socket import *
from jwt import ExpiredSignatureError

import logging
logger = logging.getLogger(__name__)

# CHANNELS
GENERAL_CHANNEL     = 'general'

# SOCKET CALLBACKS
USER_CONNECTED      = 'user_connected'
USER_DISCONNECTED   = 'user_disconnected'
USER_LIST           = 'user_list'
GENERAL_MSG         = 'general_chat'
PRIV_MSG            = 'priv_msg'
LIST_MSG            = 'get_messages_between'
IGNORE_USER         = 'ignore_user'
UNIGNORE_USER       = 'unignore_user'
IGNORE_LIST         = 'ignore_list'
SEEN_MSG            = 'seen_msg'

class ChatConsumer(AsyncWebsocketConsumer):
    
    # Base function to send message to all in group
    async def general_message(self, event):
        text = event["text"]
        if await self.allowed_message(event):
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
                await CustomUser.update_user_on_connect(user, self.channel_name)
                # Add user to `{general_chat}` room
                await self.channel_layer.group_add(GENERAL_CHANNEL, self.channel_name)
                # Send a user_connected message to the group (excluding the connected user)
                await send_to_group_exclude_self(self, GENERAL_CHANNEL, USER_CONNECTED, user.username)
                
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
                await CustomUser.update_user_on_disconnect(user)
                await self.channel_layer.group_discard(GENERAL_MSG,self.channel_name)
                await send_to_group_exclude_self(self, GENERAL_CHANNEL, USER_DISCONNECTED, user.username)
                
        except Exception as e:
            logger.warning(f'Exception in disconnect: {e}')

    async def receive(self, text_data):
        try:
            user = self.scope["user"]
            if user.is_authenticated and not user.is_anonymous:
                data = json.loads(text_data)
                type = data["type"]

                if type == GENERAL_MSG:
                    await self.process_global_msg(user, data)
                elif type == PRIV_MSG:
                    await self.process_priv_msg(user, data)
                elif type == USER_LIST:
                    await self.send_user_list()
                elif type == LIST_MSG:
                    await self.get_messages_between_users(user, data)
                elif type == IGNORE_USER:
                    await self.ignore_user(user, data)
                elif type == UNIGNORE_USER:
                    await self.unignore_user(user, data)
                elif type == IGNORE_LIST:
                    await self.get_ignore_list(user, data)
                elif type == SEEN_MSG:
                    await self.mark_message_seen(data)

        except Exception as e:
            logger.warning(f'Exception in receive: {e}')
            await self.close(code=4003)


    ####################
    ## CHAT FUNCTIONS ##
    ####################
    
    async def mark_message_seen(self, data):
        user = self.scope["user"]
        message_data = json.loads(data["message"])
        await ChatModel.mark_message_as_seen(user.username, message_data["sender"])

    async def get_ignore_list(self, user, data):
        user = self.scope["user"]
        ignored_list = await CustomUser.get_ignored_users(user.username)
        await send_to_me(self, IGNORE_LIST, ignored_list)

    async def unignore_user(self, user, data):
        user = self.scope["user"]
        message_data = json.loads(data["message"])
        await CustomUser.unignore_user(user, message_data["user"])

    async def ignore_user(self, user, data):
        user = self.scope["user"]
        message_data = json.loads(data["message"])
        await CustomUser.ignore_user(user, message_data["user"])

    async def get_messages_between_users(self, user, data):
        user = self.scope["user"]
        message_data = json.loads(data["message"])
        recipient = message_data["recipient"]
        messages = await ChatModel.get_messages_between_users(user, recipient)
        # parsed_json = await ChatModel.serialize_messages(messages)
        await send_to_me(self, LIST_MSG, messages)

    async def send_user_list(self):
        user = self.scope["user"]
        connected_users_list = await CustomUser.get_connected_usernames_not_me(user)
        await send_to_me(self, USER_LIST, connected_users_list)
    
    async def process_global_msg(self, user, data):
        # Receive new message, let's spread it, but including information like Username
        data["sender"] = user.username
        await send_to_group(self, GENERAL_CHANNEL, GENERAL_MSG, data)

    async def process_priv_msg(self, user, data):
        message_data = json.loads(data["message"])
        recipient = message_data["recipient"]
        userChannel = await CustomUser.get_user_by_username(recipient)
        # userChannel = get_channel_name_by_username(recipient, connected_users)
        if(userChannel and recipient != user.username):
            data["sender"] = user.username
            data["message"] = message_data["message"]
            # Store message
            await ChatModel.save_message(user, userChannel, data["message"])
            # Send message to recipient user
            await send_to_user(self, userChannel.channel_name, PRIV_MSG, data)
            # and send message to me too
            await send_to_me(self, PRIV_MSG, data)


    ######################
    ## HELPER FUNCTIONS ##
    ######################
            
    async def allowed_message(self, event):
        text = event["text"]
        data = json.loads(text)
        sender_username = data["message"].get("sender")
        if sender_username is None:
            return True
        recipient_username = self.scope["user"].username
        ignored_users_sender = await CustomUser.get_ignored_users(sender_username)
        ignored_users_recipient = await CustomUser.get_ignored_users(recipient_username)
        if sender_username not in ignored_users_recipient and recipient_username not in ignored_users_sender:
            return True
        return False