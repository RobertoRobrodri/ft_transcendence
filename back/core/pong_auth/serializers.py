from rest_framework import serializers
from .models import CustomUser
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.validators import UniqueValidator
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError


class UserRegistrationSerializer(serializers.ModelSerializer):

	class Meta:
		model = CustomUser
		# In case new fields are needed, create a custom model that inherits from User and add fields
		fields = ('username', 'password',)
		# DO NOT SEND THE PASSWORD
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