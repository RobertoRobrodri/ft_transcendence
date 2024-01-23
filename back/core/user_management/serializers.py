from rest_framework import serializers
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth import get_user_model
from pong_auth.models import CustomUser

class UserUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = CustomUser
        fields = ('username', 'status', 'profile_picture',)

    def update(self, instance, validated_data):
        previous_profile_picture = instance.profile_picture
        if previous_profile_picture:
            previous_profile_picture.delete()
        instance.profile_picture = validated_data.get('profile_picture', instance.profile_picture)
        instance.username        = validated_data.get('username', instance.username)
        instance.status          = validated_data.get('status', instance.status)
        instance.save()
        return instance
    
class UserUpdatePasswordSerializer(serializers.ModelSerializer):

    class Meta:
        model = CustomUser
        fields = ('password', )
        extra_kwargs = {
            'password': {
                'write_only': True,
            },
        }

    def update(self, instance, validated_data):
        instance.set_password(validated_data.get('password'))
        instance.save()
        return instance