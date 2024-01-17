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
        fields = ('sender', 'receiver')