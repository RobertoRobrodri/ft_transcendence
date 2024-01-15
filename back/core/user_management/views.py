from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from pong_auth.models import CustomUser
from .serializers import UserUpdateSerializer, UserPasswordManagerSerializer, UserUpdateProfilePictureSerializer

class UserUpdateView(generics.UpdateAPIView):
	serializer_class = UserUpdateSerializer
	queryset = CustomUser.objects.all()
	lookup_field = 'username'

# We need two classes for updating user because the password needs to be hashed, therefore a special update method is used in the serializer
class UserPasswordUpdateView(generics.UpdateAPIView):
	serializer_class = UserPasswordManagerSerializer
	queryset = CustomUser.objects.all()
	lookup_field = 'username'

class UserProfilePictureUpdateView(generics.UpdateAPIView):
	serializer_class = UserUpdateProfilePictureSerializer
	queryset = CustomUser.objects.all()
	lookup_field = 'username'

# Should we ask for the password here ?
class UserDeleteView(generics.DestroyAPIView):
	queryset = CustomUser.objects.all()
	lookup_field = 'username'