from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from pong_auth.models import CustomUser
from .models import FriendRequest
from .serializers import FriendRequestSerializer

class CreateFriendRequestView(generics.CreateAPIView):
	serializer_class = FriendRequestSerializer
	queryset = FriendRequest.objects.all()
	
	def post(self, request, *args, **kwargs):
		sender = request.user
		receiver = request.data.get('receiver', None)
		user_sender = CustomUser.objects.get(username=sender)

		try:
			user_receiver = CustomUser.objects.get(username=receiver)
		except CustomUser.DoesNotExist:
			return Response({"detail": "Receiver user does not exist."}, status=status.HTTP_400_BAD_REQUEST)
		
		existing_request = FriendRequest.objects.filter(sender=user_sender.id, receiver=user_receiver.id)
		if existing_request.exists():
			return Response({"detail": "Friend request already exists."}, status=status.HTTP_400_BAD_REQUEST)

		friend_request_data = {'sender': user_sender.id, 'receiver': user_receiver.id}
		friend_serializer = self.serializer_class(data=friend_request_data)
		if friend_serializer.is_valid():
			friend_serializer.save()
			return Response({"message": "Friend Request sent"}, status=status.HTTP_200_OK)
		print(friend_serializer.errors)
		return Response({"message": "Cannot send friend request"}, status=status.HTTP_404_NOT_FOUND)