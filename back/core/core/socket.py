import json
import re
from django.contrib.auth.models import User
from channels.db import database_sync_to_async

##############################
## GENERAL SOCKET FUNCTIONS ##
##############################

# Function to send message to self
async def send_to_me(consumer, type, message):
    await consumer.send(text_data=json.dumps({
        "type": type,
        "message": message,
    }))
    
# Function to send message to specific user
async def send_to_user(consumer, user_channel_name, type, message):
    await consumer.channel_layer.send(
        user_channel_name,
        {
            "type": "general.message",
            "text": json.dumps({
                "type": type,
                "message": message,
            }),
        }
    )
    
 # Function to send message to entire group
async def send_to_group(consumer, group_name, type, message):
    await consumer.channel_layer.group_send(
        group_name,
        {
            "type": "general.message",
            "text": json.dumps({
                "type": type,
                "message": message,
            }),
        }
    )

# Function to send message to entire group except self
async def send_to_group_exclude_self(consumer, group_name, type, message):
    await consumer.channel_layer.group_send(
        group_name,
        {
            "type": "general.message.exclude.self",
            "channel": consumer.channel_name,
            "text": json.dumps({
                "type": type,
                "message": message,
            }),
        }
    )

def get_channel_name_by_username(username, list):
    for channel_name, user_name in list.items():
        if user_name == username:
            return channel_name
    return None
    
@database_sync_to_async
def get_user_by_username(consumer, username):
    try:
        return User.objects.get(username=username)
    except User.DoesNotExist:
        return None


######################
## HELPER FUNCTIONS ##
######################