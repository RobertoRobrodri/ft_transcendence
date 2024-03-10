import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from django.contrib.auth.models import AnonymousUser

import logging
logger = logging.getLogger(__name__)

connected_users = {}

class MultiplayerConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        try:
            user = self.scope["user"]
            if user.is_authenticated and not user.is_anonymous:
                await self.accept()
                # Add user to array
                connected_users[self.channel_name] = user

        except Exception as e:
            await self.close()
            logger.warning(f'Exception: {e}')
        

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            type = text_data_json["type"]
            message = text_data_json["message"]
            if type == 'authenticate':
                # Manejar la autenticación aquí
                await self.authenticate_user(message.get('token'))
            elif type == 'other_message_type':
                # Manejar la autenticación aquí
                await self.authenticate_user(message.get('token'))
        except Exception as e:
            logger.warning(f'Exception: {e}')
    
    async def send_user_list(self):
        # Enviar la lista actualizada de usuarios conectados a todos los clientes
        user_list = list(connected_users.values())
        await self.send(text_data=json.dumps({
             'type': 'user_list',
             'users': user_list,
            }))
