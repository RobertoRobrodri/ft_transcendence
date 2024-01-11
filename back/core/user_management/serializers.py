from rest_framework import serializers
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth import get_user_model
from pong_auth.models import CustomUser

class UserUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = CustomUser
        # In case new fields are needed, create a custom model that inherits from User and add fields
        fields = ('username', 'password', 'email', 'score')
        lookup_field = 'username'