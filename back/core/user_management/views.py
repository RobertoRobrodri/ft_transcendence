from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from pong_auth.models import CustomUser
from .serializers import UserUpdateSerializer
from pong_auth.permissions import IsLoggedInUser

class UserViewset(viewsets.GenericViewSet):
	serializer_class = UserUpdateSerializer
	queryset = CustomUser.objects.all()
	permission_classes = [IsLoggedInUser]
	
	def list(self, request):
		users = self.get_queryset()
		user_serializer = self.serializer_class(users, many=True)
		return Response(user_serializer.data, status=status.HTTP_200_OK)
	
	def retrieve(self, request, pk=None):
		user = get_object_or_404(self.serializer_class.Meta.model, pk=pk)
		self.check_object_permissions(request, user)
		user_serializer = self.serializer_class(user)
		return Response(user_serializer.data)

	def partial_update(self, request, pk=None):
		user = get_object_or_404(self.serializer_class.Meta.model, pk=pk)
		self.check_object_permissions(request, user)
		user_serializer = self.serializer_class(user, data=request.data, partial=True)
		if user_serializer.is_valid():
			user_serializer.save()
			return Response({'message': 'User updated successfully'}, status=status.HTTP_200_OK)
		return Response({'message': 'Cannot update user'}, status=status.HTTP_400_BAD_REQUEST)
	
	def destroy(self, request, pk=None):
		user = get_object_or_404(self.serializer_class.Meta.model, pk=pk)
		self.check_object_permissions(request, user)
		user_destroy = user.update(is_active=False)
		if user_destroy == 1:
			return Response({'message': 'User deleted successfully'}, status=status.HTTP_200_OK)
		return Response({'message': 'User doesn´t exists'}, status=status.HTTP_400_BAD_REQUEST)
