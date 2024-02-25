from rest_framework import serializers
from .models import CustomUser
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth import get_user_model
from pong_auth.models import CustomUser
from .models import Game

class GameSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Game
        fields = ('player')

    def create(self, validated_data):
        game = Game(
            player_1 = validated_data['player'],
        )
        game.save()
        return game