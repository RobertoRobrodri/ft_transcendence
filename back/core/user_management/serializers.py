from rest_framework import serializers
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from pong_auth.models import CustomUser
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.hashers import check_password
from django.core.exceptions import ValidationError
import pyotp

class UserUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = CustomUser
        fields = ('username', 'profile_picture',)

    def update(self, instance, validated_data):
        previous_profile_picture = instance.profile_picture
        if previous_profile_picture:
            previous_profile_picture.delete()
        instance.profile_picture = validated_data.get('profile_picture', instance.profile_picture)
        instance.username        = validated_data.get('username', instance.username)
        instance.save()
        return instance

class UserUpdateTwoFactorAuthSerializer(serializers.ModelSerializer):
    TwoFactorAuth = serializers.BooleanField(required=True)
    
    class Meta:
        model = CustomUser
        fields = ('TwoFactorAuth',)

    def update(self, instance, validated_data):
        user = self.context.get('user')
        if validated_data.get('TwoFactorAuth') == True and user.TwoFactorAuth == False:
            instance.OTP_SECRET_KEY = pyotp.random_base32()
        else:
            instance.OTP_SECRET_KEY = None
            instance.TwoFactorAuth   = validated_data.get('TwoFactorAuth', instance.TwoFactorAuth)
        instance.save()
        return instance

class UserUpdatePasswordSerializer(serializers.Serializer):

    old_password  = serializers.CharField(required=True)
    new_password  = serializers.CharField(required=True)
    new_password2 = serializers.CharField(required=True)

    def validate(self, attrs):
        user = self.context.get('user')
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        if not check_password(attrs['old_password'], user.password):
            raise serializers.ValidationError({"password": "Old password didn't match"})
        if attrs['new_password'] == attrs['old_password']:
            raise serializers.ValidationError({"password": "New password is the same!"})
        return attrs

    def validate_new_password(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError({'password': e.messages})
        return value

    def update(self, instance, validated_data):
        instance.set_password(validated_data.get('new_password'))
        instance.save()
        return instance

class FriendSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'status')

class FriendRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'username',)

class UserListSerializer(serializers.ModelSerializer):
    friends = FriendSerializer(many=True, read_only=True)
    friend_requests = FriendRequestSerializer(many=True, read_only=True)
    class Meta:
        model = CustomUser
        fields = ('username', 'status', 'profile_picture', 'TwoFactorAuth', 'wins', 'losses', 'wins_pool', 'losses_pool','friends', 'friend_requests')