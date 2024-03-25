"""
ASGI config for core project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os
from django import setup
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
setup()
django_asgi_app = get_asgi_application()
from .JWTAuthMiddlewareStack import JWTAuthMiddlewareStack
from game.routing import websocket_game
from chat.routing import websocket_chat
all_websocket_routes = websocket_game + websocket_chat

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": JWTAuthMiddlewareStack(
            URLRouter(
                all_websocket_routes
            )
        ),
    }
)