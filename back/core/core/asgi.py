"""
ASGI config for core project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

# import os

# from django.core.asgi import get_asgi_application
# from game.routing import websocket_urlpatterns
# from channels.routing import ProtocolTypeRouter, URLRouter

# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# application = get_asgi_application()

# application = ProtocolTypeRouter(
#     {
#         "http": get_asgi_application(),
#         "websocket": URLRouter(websocket_urlpatterns),
# 	}
# )

import os

from django.core.asgi import get_asgi_application
from game.routing import websocket_urlpatterns
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from .channelsmiddleware import JwtAuthMiddlewareStack
import game.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
		"websocket": AllowedHostsOriginValidator(
			JwtAuthMiddlewareStack(
				URLRouter(
					websocket_urlpatterns
				)
			)
		),
    }
)