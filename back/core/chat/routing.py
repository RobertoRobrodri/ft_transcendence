from django.urls import re_path
from . import consumers

websocket_chat = [
    re_path(r'ws/chat/', consumers.ChatConsumer.as_asgi()),
]