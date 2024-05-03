from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from pong_auth.models import CustomUser
from .serializers import UserUpdateSerializer, UserUpdatePasswordSerializer, UserListSerializer, UserUpdateTwoFactorAuthSerializer
from pong_auth.permissions import IsLoggedInUser
from django.core.exceptions import ValidationError
from django.conf import settings
from pong_auth.utils import GenerateQR
import base64, pyotp

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

	def delete(self, request):
		user = request.user
		self.check_object_permissions(request, user)
		previous_profile_picture = user.profile_picture
		if previous_profile_picture:
			previous_profile_picture.delete()
			user.profile_picture = None
			user.save()
			return Response({'message': 'Deleted profile picture'}, status=status.HTTP_200_OK)
		return Response({'message': 'No profile picture'}, status=status.HTTP_400_BAD_REQUEST)

class UserUpdatePasswordView(generics.GenericAPIView):
	serializer_class = UserUpdatePasswordSerializer
	queryset = CustomUser.objects.all()
	# Use this method only for local users. 42 Users will log through 42 account
	def patch(self, request):
		user = request.user
		if user.external_id is None:
			user_serializer = self.serializer_class(user, data=request.data, context={'user': user})
			if user_serializer.is_valid():
				try:
					user_serializer.save()
					return Response({'message': 'Password updated successfully'}, status=status.HTTP_200_OK)
				except ValidationError as e:
					return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
			return Response({'message': user_serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
		
class UserUpdateActivate2FA(generics.GenericAPIView):
	serializer_class = UserUpdateTwoFactorAuthSerializer
	queryset = CustomUser.objects.all()

	def patch(self, request):
		user = request.user
		user_serializer = self.serializer_class(user, data=request.data, context={'user': user})
		if user_serializer.is_valid():
			user_serializer.save()
			if user_serializer.validated_data.get('TwoFactorAuth') == True:
				if user.TwoFactorAuth == True:
					return Response({'message':'Already activated'}, status=status.HTTP_400_BAD_REQUEST)
				encoded_qr = GenerateQR(user)
				return Response({'message': 'Please confirm the following code',
					'qr' : encoded_qr,
					}, status=status.HTTP_307_TEMPORARY_REDIRECT)
			else:
				return Response({'message':'Two Factor Authentication deactivated'}, status=status.HTTP_200_OK)
		return Response({'message': user_serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class UserUpdateValidateOTPView(generics.GenericAPIView):
	queryset = CustomUser.objects.all()

	def post(self, request):
		user = request.user
		if (user.TwoFactorAuth == False):
			otp = request.data.get('otp', None)
			if (user.OTP_SECRET_KEY is None):
				return Response({'error': 'Please try to activate 2FA first'}, status=status.HTTP_401_UNAUTHORIZED)
			# Verify
			totp = pyotp.TOTP(user.OTP_SECRET_KEY)
			if totp.verify(otp):
				user.TwoFactorAuth = True
				user.save()
				return Response({'message': '2FA confirmed',},status=status.HTTP_200_OK)
			else:
				user.OTP_SECRET_KEY = None
		return Response({'error': 'Not valid code, please try again'}, status=status.HTTP_401_UNAUTHORIZED)

class UserListAllView(generics.ListAPIView):
	serializer_class = UserListSerializer
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
			absolute_profile_picture_path = '/core' +  profile_picture_path
			# Open the profile picture file, read its content, and encode it in base64
			with open(absolute_profile_picture_path, "rb") as image_file:
				encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
			# Add the base64 encoded image to the serializer data
			user_data['profile_picture'] = encoded_image
		if (user_serializer.data['TwoFactorAuth'] == True):
			# Send qr image as base64
			encoded_qr = GenerateQR(user)
			user_data['qr'] = encoded_qr
		return Response(user_data, status=status.HTTP_200_OK)

class UserDetailView(generics.GenericAPIView):
	serializer_class = UserListSerializer

	def get(self, request, user_id):
		try:
			user = CustomUser.objects.get(pk=user_id)
			user_serializer = self.serializer_class(user)
			user_data = user_serializer.data

			# Encode profile picture in base64
			profile_picture_path = user_serializer.data['profile_picture']
			if profile_picture_path is not None:
				absolute_profile_picture_path = '/core' + profile_picture_path
				# Open the profile picture file, read its content, and encode it in base64
				with open(absolute_profile_picture_path, "rb") as image_file:
					encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
				# Add the base64 encoded image to the serializer data
				user_data['profile_picture'] = encoded_image

			return Response(user_data, status=status.HTTP_200_OK)
		except CustomUser.DoesNotExist:
			return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
		
class UserDeleteView(generics.GenericAPIView):
	queryset = CustomUser.objects.all()

	def delete(self, request):
		user = request.user
		self.check_object_permissions(request, user)
		user_destroy = user.update(is_active=False)
		if user_destroy == 1:
			return Response({'message': 'User deleted successfully'}, status=status.HTTP_200_OK)
		return Response({'message': 'User doesn´t exists'}, status=status.HTTP_400_BAD_REQUEST)