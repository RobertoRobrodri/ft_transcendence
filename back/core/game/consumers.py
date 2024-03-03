import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from django.contrib.auth.models import AnonymousUser

import logging

logger = logging.getLogger(__name__)

connected_users = set()

class MultiplayerConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        try:
            user = self.scope["user"]
            logger.warning(f'user: {user}')
            logger.warning(f'user.is_authenticated: {user.is_authenticated}')
            logger.warning(f'user.is_anonymous: {user.is_anonymous}')
            # Validate user before accepting the Websocket Connection
            # For example:
            if user.is_authenticated and not user.is_anonymous:
                await self.accept()

        except Exception as e:
            logger.warning(f'Exception: {e}')
        

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        type = text_data_json["type"]
        message = text_data_json["message"]

        if type == 'authenticate':
            # Manejar la autenticación aquí
            await self.authenticate_user(message.get('token'))
        elif type == 'other_message_type':
            # Otros tipos de mensajes
            pass
