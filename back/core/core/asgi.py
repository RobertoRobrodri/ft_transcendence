"""
ASGI config for core project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from .JWTAuthMiddlewareStack import JWTAuthMiddlewareStack
from game.routing import websocket_game
from chat.routing import websocket_chat
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

all_websocket_routes = websocket_game + websocket_chat

application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": JWTAuthMiddlewareStack(
            URLRouter(
                all_websocket_routes
            )
        ),
    }
)