from rest_framework import generics, status
from rest_framework import viewsets
from rest_framework.response import Response
from pong_auth.models import CustomUser
from .serializers import FriendRequestSerializer
from django.db.models import Q

class FriendRequestViewset(viewsets.GenericViewSet):
	serializer_class = FriendRequestSerializer

	def create(self, request, *args, **kwargs):
		user_sender = request.user
		receiver_name = request.data.get('receiver', None)
		receiver_user = CustomUser.objects.filter(username=receiver_name).first() 
		
		# Want to be friends with an unexistent user
		if receiver_user is None:
			return Response({"message": "Receiver user does not exist."}, status=status.HTTP_400_BAD_REQUEST)
		
		if user_sender == receiver_user:
			return Response({"message": "Can´t add yourself as friend"}, status=status.HTTP_400_BAD_REQUEST)
		receiver_id = receiver_user.pk
		# Search in the user list if they are already friends
		if user_sender.friends.filter(pk=receiver_id).exists():
			return Response({"message": "Already friends"}, status=status.HTTP_400_BAD_REQUEST)
		
		# Check if the request already exists
		# Bidirectional, means it checks for both receiver and sender in both fields
		if user_sender.friend_requests.filter(pk=receiver_id).exists() or receiver_user.friend_requests.filter(pk=user_sender.pk).exists():
			return Response({"message": "Friend request already exists."}, status=status.HTTP_400_BAD_REQUEST)

		receiver_user.friend_requests.add(user_sender)
		return Response({"message": "Friend Request sent"}, status=status.HTTP_200_OK)
	
	def destroy(self, request, *args, **kwargs):
		friend_request_id = kwargs.get('pk')
		action = request.data.get('action', None)
		try:
			user_receiver = request.user.friend_requests.get(pk=friend_request_id)
			if action == 'ACCEPT':
				request.user.friends.add(user_receiver)
				user_receiver.friends.add(request.user)
				request.user.friend_requests.remove(user_receiver)
				return Response({"message": "Friend Request Accepted"}, status=status.HTTP_200_OK)
			elif action == 'DECLINE':
				request.user.friend_requests.remove(user_receiver)
				return Response({"message": "Friend Request declined"}, status=status.HTTP_200_OK)
		except CustomUser.DoesNotExist:
			return Response({"message": "No such friend request"}, status=status.HTTP_400_BAD_REQUEST)
		return Response({"message": "Action Required"}, status=status.HTTP_400_BAD_REQUEST)
