from rest_framework import generics, status
from rest_framework import viewsets
from rest_framework.response import Response
from pong_auth.models import CustomUser
from .models import FriendRequest
from .serializers import FriendRequestSerializer
from django.db.models import Q

class FriendRequestViewset(viewsets.GenericViewSet):
	serializer_class = FriendRequestSerializer
	queryset = FriendRequest.objects.all()

	def create(self, request, *args, **kwargs):
		user_sender = request.user
		receiver = request.data.get('receiver', None)
		# Search in the user list if they are already friends
		if user_sender.friends.filter(pk=receiver).exists():
			return Response({"message": "Already friends"}, status=status.HTTP_400_BAD_REQUEST)
		
		# Want to be friends with an unexistent user
		try:
			user_receiver = CustomUser.objects.get(pk=receiver)
		except CustomUser.DoesNotExist:
			return Response({"message": "Receiver user does not exist."}, status=status.HTTP_400_BAD_REQUEST)
		
		# Check if the request already exists
		# Bidirectional, means it checks for both receiver and sender in both fields
		existing_request = FriendRequest.objects.filter(Q(sender=user_sender.id, receiver=user_receiver.id) |
												  Q(sender=user_receiver.id, receiver=user_sender.id)).first()
		if existing_request is not None:
			return Response({"message": "Friend request already exists."}, status=status.HTTP_400_BAD_REQUEST)

		friend_request_data = {'sender': user_sender.id, 'receiver': user_receiver.id}
		friend_serializer = self.serializer_class(data=friend_request_data)
		if friend_serializer.is_valid():
			friend_serializer.save()
			return Response({"message": "Friend Request sent"}, status=status.HTTP_200_OK)
		return Response({"message": "Cannot send friend request"}, status=status.HTTP_404_NOT_FOUND)
	
	def destroy(self, request, *args, **kwargs):
		friend_request_id = kwargs.get('pk')
		try:
			friend_request = FriendRequest.objects.get(pk=friend_request_id)
		except:
			return Response({"message": "No such friend request"}, status=status.HTTP_400_BAD_REQUEST)
		action = request.data.get('action', None)
		if request.user == friend_request.receiver:
			if action == 'ACCEPT':
				friend_request.sender.friends.add(friend_request.receiver)
				friend_request.receiver.friends.add(friend_request.sender)
				friend_request.delete()
				return Response({"message": "Friend Request Accepted"}, status=status.HTTP_200_OK)
			elif action == 'DECLINE':
				friend_request.delete()
				return Response({"message": "Friend Request declined"}, status=status.HTTP_200_OK)
		else:
			return Response({"Error": "Request Users don´t match"}, status=status.HTTP_401_UNAUTHORIZED)	
		return Response({"Error": "Action Required"}, status=status.HTTP_400_BAD_REQUEST)