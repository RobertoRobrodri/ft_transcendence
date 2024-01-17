from rest_framework import serializers
from .models import CustomUser
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth import get_user_model
from pong_auth.models import CustomUser
from .models import FriendRequest

class FriendRequestSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = FriendRequest
        fields = ('sender', 'receiver',)
    
    def validate(self, data):
        # Ensure that the sender and receiver are not the same user
        if data['sender'] == data['receiver']:
            raise serializers.ValidationError("Sender and receiver cannot be the same user.")
        # You can add more validation logic if needed
        return data