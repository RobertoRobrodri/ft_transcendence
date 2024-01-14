from rest_framework import serializers
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth import get_user_model
from pong_auth.models import CustomUser

class UserUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = CustomUser
        # In case new fields are needed, create a custom model that inherits from User and add fields
        fields = ('username', 'email', 'score', 'status', 'profile_picture')
        lookup_field = 'username'

class UserPasswordManagerSerializer(serializers.ModelSerializer):

    class Meta:
        model = CustomUser
        # In case new fields are needed, create a custom model that inherits from User and add fields
        fields = ('password', )
        lookup_field = 'username'
        extra_kwargs = {
            'password': {
                'write_only': True
            },
        }


    def update(self, instance, validated_data):
        instance.set_password(validated_data['password'])
        instance.save()
        return instance