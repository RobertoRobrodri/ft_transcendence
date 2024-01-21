from rest_framework import serializers
from .models import CustomUser
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.validators import UniqueValidator
from django.contrib.auth import get_user_model


class UserRegistrationSerializer(serializers.ModelSerializer):

    class Meta:
        model = CustomUser
        # In case new fields are needed, create a custom model that inherits from User and add fields
        fields = ('username', 'password',)
        # DO NOT SEND THE PASSWORD
        extra_kwargs = {
            'password': {
                'write_only': True,
                'required': False,
            },
#            'email': {
#                'validators': [
#                    UniqueValidator(
#                        queryset=CustomUser.objects.all()
#                    )
#                ],
#                'required': True,
#                'allow_blank': False,
#                
#            },
            'external_id': {
                'required': False,
            }
        }

    def create(self, validated_data):
        user = CustomUser(
            username=validated_data['username'],
            # Set here any new field you may need
        )
        user.set_password(validated_data['password'])
        user.save()
        return user
    
# In case we need to add custom logic to the serializer
class UserTokenObtainPairSerializer(TokenObtainPairSerializer):
    pass

class User42RegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('username', 'external_id')