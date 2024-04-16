from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from pong_auth.models import CustomUser

class FriendRequestSerializer(serializers.Serializer):
    
    receiver = serializers.PrimaryKeyRelatedField(queryset=CustomUser.objects.all())
    
    def validate(self, data):
        # Ensure that the sender and receiver are not the same user
        user_sender = self.context['request'].user
        if user_sender == data['receiver']:
            raise serializers.ValidationError("Sender and receiver cannot be the same user.")
        return data