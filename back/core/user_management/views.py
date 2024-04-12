from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from pong_auth.models import CustomUser
from .serializers import UserUpdateSerializer, UserUpdatePasswordSerializer, UserListSerializer
from pong_auth.permissions import IsLoggedInUser
from django.core.exceptions import ValidationError
import base64

class UserUpdateView(generics.GenericAPIView):
	serializer_class = UserUpdateSerializer
	queryset = CustomUser.objects.all()

	def patch(self, request):
		user = request.user
		self.check_object_permissions(request, user)
		user_serializer = self.serializer_class(user, data=request.data, partial=True)
		if user_serializer.is_valid():
			user_serializer.save()
			return Response({'message': 'User updated successfully'}, status=status.HTTP_200_OK)
		return Response({'error': user_serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class UserUpdatePasswordView(generics.GenericAPIView):
	serializer_class = UserUpdateSerializer
	queryset = CustomUser.objects.all()
	# Use this method only for local users. 42 Users will log through 42 account
	def patch(self, request):
		user = request.user
		if user.external_id is None:
			user_serializer = UserUpdatePasswordSerializer(user, data=request.data)
			if user_serializer.is_valid():
				try:
					user_serializer.save()
					return Response({'message': 'User updated successfully'}, status=status.HTTP_200_OK)
				except ValidationError as e:
					return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
			return Response({'message': user_serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class UserListAllView(generics.ListAPIView):
	serializer_class = UserUpdateSerializer
	queryset = CustomUser.objects.all()

# Override the requirement for a PK, because we already know the user sending the request
class UserListView(generics.GenericAPIView):
	serializer_class = UserListSerializer
	queryset = CustomUser.objects.all()

	def get(self, request):
		user = request.user
		user_serializer = self.serializer_class(user)
		user_data = user_serializer.data
		# Encode profile picture in base 64
		profile_picture_path = user_serializer.data['profile_picture']
		if (profile_picture_path is not None):
        	# Open the profile picture file, read its content, and encode it in base64
			with open(profile_picture_path, "rb") as image_file:
				encoded_image = base64.b64encode(image_file.read()).decode('utf-8')

        	# Add the base64 encoded image to the serializer data
			user_data['profile_picture'] = encoded_image
		return Response(user_data, status=status.HTTP_200_OK)

class UserDeleteView(generics.GenericAPIView):
	queryset = CustomUser.objects.all()

	def delete(self, request):
		user = request.user
		self.check_object_permissions(request, user)
		user_destroy = user.update(is_active=False)
		if user_destroy == 1:
			return Response({'message': 'User deleted successfully'}, status=status.HTTP_200_OK)
		return Response({'message': 'User doesn´t exists'}, status=status.HTTP_400_BAD_REQUEST)

# Cant user userviewset because of the requirement for a pk

# class UserViewset(viewsets.GenericViewSet):
# 	serializer_class = UserUpdateSerializer
# 	queryset = CustomUser.objects.all()
# 	permission_classes = [IsLoggedInUser, IsAuthenticated]
	
# 	def list(self, request):
# 		user = request.user
# 		user_serializer = self.serializer_class(user)
# 		return Response(user_serializer.data, status=status.HTTP_200_OK)
	
# 	def retrieve(self, request):
# 		#user = get_object_or_404(self.serializer_class.Meta.model, pk=pk)
# 		user = request.user
# 		user_serializer = self.serializer_class(user)
# 		return Response(user_serializer.data, status=status.HTTP_200_OK)

# 	# Use this method only for local users. 42 Users will log through 42 account
# 	@action(detail=True, methods=['patch'])
# 	def set_password(self, request):
# 		user = request.user
# 		if user.external_id is None:
# 			user_serializer = UserUpdatePasswordSerializer(user, data=request.data)
# 			if user_serializer.is_valid():
# 				user_serializer.save()
# 				return Response({'message': 'User updated successfully'}, status=status.HTTP_200_OK)
# 		return Response({'message': 'Cannot update user'}, status=status.HTTP_400_BAD_REQUEST)

# 	def partial_update(self, request):
# 		user = request.user
# 		self.check_object_permissions(request, user)
# 		user_serializer = self.serializer_class(user, data=request.data, partial=True)
# 		if user_serializer.is_valid():
# 			user_serializer.save()
# 			return Response({'message': 'User updated successfully'}, status=status.HTTP_200_OK)
# 		return Response({'message': 'Cannot update user'}, status=status.HTTP_400_BAD_REQUEST)
	
# 	def destroy(self, request):
# 		user = request.user
# 		self.check_object_permissions(request, user)
# 		user_destroy = user.update(is_active=False)
# 		if user_destroy == 1:
# 			return Response({'message': 'User deleted successfully'}, status=status.HTTP_200_OK)
# 		return Response({'message': 'User doesn´t exists'}, status=status.HTTP_400_BAD_REQUEST)