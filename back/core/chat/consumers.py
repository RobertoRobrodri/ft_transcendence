import json
import hashlib
import time
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import User
from pong_auth.models import CustomUser
from .models import ChatModel
from core.socket import *
from jwt import ExpiredSignatureError
from game.consumers import games, get_game_id, matchmaking_queue, MultiplayerConsumer
from game.PongGame import PongGame
import asyncio
import base64

import logging
logger = logging.getLogger(__name__)

# CHANNELS
GENERAL_CHANNEL     = 'general'

# SOCKET CALLBACKS
MY_DATA             = 'my_data'
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
GAME_REQUEST        = 'game_request'
ACCEPT_GAME         = 'accept_game'
REJECT_GAME         = 'reject_game'

class ChatConsumer(AsyncWebsocketConsumer):
    
    # Base function to send message to all in group
    async def systemmessage(self, event):
        text = event["text"]
        await self.send(text_data=text)

    # Base function to send message to all in group except is not allowed
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
            if user and user.is_authenticated and not user.is_anonymous:
                # maybe throw an error
                if user.connected is False:
                    await self.accept()
                    logger.debug('Connected')
                    await CustomUser.update_user_on_connect(user, self.channel_name)
                    # Add user to `{general_chat}` room
                    await self.channel_layer.group_add(GENERAL_CHANNEL, self.channel_name)
                    await self.channel_layer.group_add(hashlib.sha256(str(user.id).encode('utf-8')).hexdigest(), self.channel_name)
                    profile_picture_url = ''
                    if user.profile_picture:
                        # Open the profile picture file, read its content, and encode it in base64
                        with open(user.profile_picture.path, "rb") as image_file:
                            profile_picture_content = base64.b64encode(image_file.read()).decode('utf-8')
                            profile_picture_url = f'data:image/jpeg;base64,{profile_picture_content}'
                    await send_to_group_exclude_self(self, GENERAL_CHANNEL, USER_CONNECTED, {'id': user.id, 'username': user.username, 'image': profile_picture_url})
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
                await CustomUser.update_user_on_disconnect(user)
                await send_to_group_exclude_self(self, GENERAL_CHANNEL, USER_DISCONNECTED, {'id': user.id, 'username': user.username})
                await self.channel_layer.group_discard(GENERAL_CHANNEL, self.channel_name)
                await self.channel_layer.group_discard(hashlib.sha256(str(user.id).encode('utf-8')).hexdigest(), self.channel_name)
                
                
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
                    await self.mark_message_seen(user, data)
                elif type == GAME_REQUEST:
                    await self.game_request(user, data)
                elif type == ACCEPT_GAME:
                    await self.accept_game(user, data)
                elif type == REJECT_GAME:
                    await self.reject_game(user, data)

        except Exception as e:
            logger.warning(f'Exception in receive: {e}')
            await self.close(code=4003)
            
    #########################
    ## PRIV GAME FUNCTIONS ##
    #########################
    
    async def reject_game(self, user, data):
        rival = data.get("message")
        if rival is None:
            return
        rivalUser = await CustomUser.get_user_by_id(rival)
        # {type: "priv_msg", message: "dfg", recipient: "1", sender: 2, sender_name: "imurugar1"}
        data = {
            "type": "priv_msg",
            "message": "GAME REJECTED",
            "recipient": rivalUser.id,
            "sender": user.id, 
            "sender_name": user.username
        }
        await send_to_user(self, rivalUser.channel_name, PRIV_MSG, data)
        
    async def game_request(self, user, data):
        # Check if user is already in game
        game_id = get_game_id(user.id)
        message_data = data.get("message")
        if message_data is None or game_id is not None:
            return
        # rival = message_data.get("sender")
        rival = message_data.get("rival")
        game_request = message_data.get("game")
        if not rival or not game_request: # if not game
            return
        
        # check if any of user is on matchmaking
        if matchmaking_queue.is_user_in_queue(user.id) or matchmaking_queue.is_user_in_queue(rival):
            return
        # check if any of users is playing any game
        if get_game_id(user.id) is not None or get_game_id(rival) is not None:
            return
        
        userChannel = await CustomUser.get_user_by_id(rival)
        if(userChannel and rival != user.id):
            data["sender"] = user.id
            data["sender_name"] = user.username
            await send_to_user(self, userChannel.channel_name, GAME_REQUEST, data)
            
    async def accept_game(self, user, data):
        rival = data.get("message")
        if rival is None:
            return
        data['sender'] = user.id
        rivalUser = await CustomUser.get_user_by_id(rival)
        # Generate unique room name
        room_name = f'room_{hashlib.sha256(str(int(time.time())).encode()).hexdigest()}'
        # game = PongGame(room_name, self, True)
        
        
        game = {
            "game": "Pong",
            "instance": PongGame(room_name, None, None)
        }
        
        game["instance"].add_player(user.username, user.id, 1)
        game["instance"].add_player(rivalUser.username, rivalUser.id, 2)

        games[room_name] = game
        if not game["instance"].running:
            asyncio.create_task(game["instance"].start_game())
        # Send message to recipient user
        await send_to_user(self, rivalUser.channel_name, ACCEPT_GAME, data)
        # and send message to me too
        await send_to_me(self, ACCEPT_GAME, data)

    ####################
    ## CHAT FUNCTIONS ##
    ####################
        
    async def mark_message_seen(self, user, data):
        sender = data.get("message")
        if sender is not None:
            await ChatModel.mark_message_as_seen(user.id, sender)

    async def get_ignore_list(self, user, data):
        ignored_list = await CustomUser.get_ignored_users_data(user.id)
        await send_to_me(self, IGNORE_LIST, ignored_list)

    async def unignore_user(self, user, data):
        userdata = data.get("message")
        if userdata is not None and userdata.strip():
            await CustomUser.unignore_user(user, userdata)

    async def ignore_user(self, user, data):
        userdata = data.get("message")
        if userdata and userdata.strip():
            await CustomUser.ignore_user(user, userdata)

    async def get_messages_between_users(self, user, data):
        recipient = data.get("message")
        if recipient is not None and recipient.strip():
            messages = await ChatModel.get_messages_between_users(user.id, recipient)
            await send_to_me(self, LIST_MSG, messages)

    async def send_user_list(self):
        user = self.scope["user"]
        connected_users_list = await CustomUser.get_connected_users_not_me(user)
        await send_to_me(self, USER_LIST, connected_users_list)
    
    async def process_global_msg(self, user, data):
        # Receive new message, let's spread it, but including information
        data["sender"] = user.id
        data["sender_name"] = user.username
        del data["type"]
        await send_to_group(self, GENERAL_CHANNEL, GENERAL_MSG, data)

    async def process_priv_msg(self, user, data):
        message_data = data["message"]
        recipient = message_data.get("recipient")
        message = message_data.get("message")

        if recipient and message and recipient.isdigit() and message.strip():
            userChannel = await CustomUser.get_user_by_id(recipient)
            if(userChannel is not None and len(userChannel.channel_name) > 0 and recipient != user.id):
                data["recipient"] = recipient
                data["sender"] = user.id
                data["sender_name"] = user.username
                data["message"] = message
                # Store message
                await ChatModel.save_message(user, userChannel, message)
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
        sender_id = data["message"].get("sender")
        if sender_id is None or sender_id == "Admin":
            return True
        recipient_id = self.scope["user"].id
        ignored_users_sender = await CustomUser.get_ignored_users(sender_id)
        ignored_users_recipient = await CustomUser.get_ignored_users(recipient_id)
        if sender_id not in ignored_users_recipient and recipient_id not in ignored_users_sender:
            return True
        return False