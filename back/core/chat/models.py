from django.db import models
from pong_auth.models import CustomUser
from channels.db import database_sync_to_async
from django.core.serializers import serialize
import json

import logging
logger = logging.getLogger(__name__)

class ChatModel(models.Model):

    sender = models.ForeignKey(CustomUser, related_name='msg_sender', on_delete=models.CASCADE)
    receiver = models.ForeignKey(CustomUser, related_name='msg_receiver', on_delete=models.CASCADE)
    msg = models.TextField()
    time = models.TimeField(auto_now_add=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    seen = models.BooleanField(default=False)
    
    @classmethod
    @database_sync_to_async
    def mark_message_as_seen(cls, user1, user2):
        user1_instance = CustomUser.objects.get(id=user1)
        user2_instance = CustomUser.objects.get(id=user2)
        cls.objects.filter(
            models.Q(sender=user2_instance, receiver=user1_instance, seen=False)
        ).update(seen=True)
    
    @classmethod
    @database_sync_to_async
    def get_messages_between_users(cls, user1, user2):
        user1_instance = CustomUser.objects.get(id=user1)
        user2_instance = CustomUser.objects.get(id=user2)

        messages = cls.objects.filter(
            (models.Q(sender=user1_instance) & models.Q(receiver=user2_instance)) |
            (models.Q(sender=user2_instance) & models.Q(receiver=user1_instance))
        )
        
        ignored_users_sender = user1_instance.ignored_users.values_list('id', flat=True)
        ignored_users_recipient = user2_instance.ignored_users.values_list('id', flat=True)
        
        # Check if either user has blocked the other
        if user1_instance.id in ignored_users_recipient or user2_instance.id in ignored_users_sender:
            messages = messages.filter(
                models.Q(seen=True) | models.Q(seen=False, sender=user1_instance)
            )

        # Update unseen messages to seen
        if user1_instance.id not in ignored_users_recipient and user2_instance.id not in ignored_users_sender:
            cls.objects.filter(
                sender=user2_instance,
                receiver=user1_instance,
                seen=False
            ).update(seen=True)
        
        # Order by timestamp in descending order and get last 50 messages
        messages = messages.order_by('-timestamp')[:50]

        # Format and fill messages
        formatted_messages = [
            {
                'direction' : 'out' if msg.sender == user1_instance else 'in',
                'sender'    : cls.serialize_custom_user(msg.sender if msg.sender == user1_instance else user2_instance),
                'receiver'  : cls.serialize_custom_user(msg.receiver if msg.receiver == user2_instance else user1_instance),
                'message'   : msg.msg,
                'timestamp' : msg.timestamp.timestamp() * 1000,
                'seen'      : msg.seen,
            }
            for msg in messages
        ]
        return formatted_messages

    def serialize_custom_user(user):
        return user.id if isinstance(user, CustomUser) else user

    @classmethod
    @database_sync_to_async
    def save_message(cls, sender, receiver, message):
        new_message = cls(sender=sender, receiver=receiver, msg=message)
        new_message.save()
    
    @classmethod
    @database_sync_to_async
    def serialize_messages(cls, messages):
        # Serialize message to JSON
        json_messages = serialize('json', messages)
        return json.loads(json_messages)