from rest_framework import serializers
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from pong_auth.models import CustomUser
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

class UserUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = CustomUser
        fields = ('username', 'status', 'profile_picture', 'TwoFactorAuth')

    def update(self, instance, validated_data):
        previous_profile_picture = instance.profile_picture
        if previous_profile_picture:
            previous_profile_picture.delete()
        instance.profile_picture = validated_data.get('profile_picture', instance.profile_picture)
        instance.username        = validated_data.get('username', instance.username)
        instance.status          = validated_data.get('status', instance.status)
        instance.TwoFactorAuth   = validated_data.get('TwoFactorAuth', instance.TwoFactorAuth)
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

    def validate_password(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError({'password': e.messages})
        return value

    def update(self, instance, validated_data):
        instance.set_password(validated_data.get('password'))
        instance.save()
        return instance

class FriendSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'status')

class UserListSerializer(serializers.ModelSerializer):
    friends = FriendSerializer(many=True, read_only=True)
    class Meta:
        model = CustomUser
        fields = ('username', 'status', 'profile_picture', 'TwoFactorAuth', 'wins', 'losses', 'friends')