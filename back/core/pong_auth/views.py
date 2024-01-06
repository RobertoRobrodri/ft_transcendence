from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, logout
from .serializers import UserSerializer, UserTokenObtainPairSerializer

class UserRegistrationView(generics.CreateAPIView):
    serializer_class = UserSerializer


class UserLoginView(TokenObtainPairView):
    serializer_class = UserTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(username=username, password=password)
        if user:
            login_serializer = self.serializer_class(data=request.data)
            if login_serializer.is_valid():
                user_serializer = UserSerializer(user)
                return Response({
                        'token' : login_serializer.validated_data.get('access'),
                        'refresh' : login_serializer.validated_data.get('refresh'),
                        'user' : user_serializer.data,
                        'message': 'Login successful',
                    },
                    status=status.HTTP_200_OK)
        return Response({'error': 'Invalid Credentials'}, status=status.HTTP_401_UNAUTHORIZED)

# We are not using logout because we are not using sessions
class UserLogoutView(generics.GenericAPIView):
    def post(self, request,*args, **kwargs):
        user = request.user
        RefreshToken.for_user(user)
        return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)