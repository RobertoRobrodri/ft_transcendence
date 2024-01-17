from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
from .models import CustomUser
from django.contrib.auth import authenticate
from .serializers import UserSerializer, UserTokenObtainPairSerializer

class UserRegistrationView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = UserSerializer

#Token Obtain Base sets permission_classes and authentication_classes to allow any
class UserLoginView(TokenObtainPairView):
    serializer_class = UserTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        # TokenObtainPairSerializer takes care of authentication and generating both tokens
        login_serializer = self.serializer_class(data=request.data)
        if login_serializer.is_valid():
            return Response({
                    'token' : login_serializer.validated_data.get('access'),
                    'refresh' : login_serializer.validated_data.get('refresh'),
                    'message': 'Login successful',
                },
                status=status.HTTP_200_OK)
        return Response({'error': 'Invalid Credentials'}, status=status.HTTP_401_UNAUTHORIZED)

# We are not using logout because we are not using sessions
class UserLogoutView(generics.GenericAPIView):
    def post(self, request,*args, **kwargs):
        user = request.user
        # Front has to delete the access token!!!
        RefreshToken.for_user(user)
        return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)
