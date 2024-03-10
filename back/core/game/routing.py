from django.urls import re_path
from . import consumers

websocket_game = [
    re_path(r'ws/game/', consumers.MultiplayerConsumer.as_asgi()),
]