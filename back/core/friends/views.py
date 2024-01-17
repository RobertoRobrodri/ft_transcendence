from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from pong_auth.models import CustomUser
from .models import FriendRequest
from .serializers import FriendRequestSerializer

class CreateFriendRequestView(generics.CreateAPIView):
    serializer_class = FriendRequestSerializer
    
class DeleteFriendRequestView(generics.DestroyAPIView):
	queryset = FriendRequest.objects.all()