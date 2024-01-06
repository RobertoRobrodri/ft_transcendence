from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        # In case new fields are needed, create a custom model that inherits from User and add fields
        fields = ('username', 'password')
        # DO NOT SEND THE PASSWORD
        extra_kwargs = {'password': {'write_only': True}}
    
    def create(self, validated_data):
        user = User(
            username=validated_data['username']
            # Set here any new field you may need
        )
        user.set_password(validated_data['password'])
        user.save()
        return user
    
# In case we need to add custom logic to the serializer
class UserTokenObtainPairSerializer(TokenObtainPairSerializer):
    pass