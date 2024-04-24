from django.urls import re_path
from . import consumers

websocket_notifications = [
    re_path(r'ws/notifications/', consumers.NotificationsConsumer.as_asgi()),
]