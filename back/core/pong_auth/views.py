from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
from .models import CustomUser
from django.contrib.auth import authenticate
from .serializers import UserRegistrationSerializer, UserTokenObtainPairSerializer, User42Serializer
import requests, os

class UserRegistrationView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer

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
        user.status = "offline"
        return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)

class User42Callback(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = User42Serializer

    def get(self, request):
        token_url     = "https://api.intra.42.fr/oauth/token"
        code          = request.GET.get('code')
        state         = request.GET.get('state')
        client_id     = os.environ.get('CLIENT_ID')
        client_secret = os.environ.get('CLIENT_SECRET')
        data = {
            'grant_type': 'authorization_code',
            'client_id': client_id,
            'client_secret': client_secret,
            'code': code,
            'redirect_uri': "http://localhost:8000/api/pong_auth/42/callback/", # ? Should this URL be passed as a secret?
            'state': state
        }
        # Make request to get 42 credentials for more information
        # https://api.intra.42.fr/apidoc/guides/web_application_flow
        r = requests.post(url=token_url, data=data)
        if r.status_code == 200:
            user_serializer = self.serializer_class(data=r.json())
            if user_serializer.is_valid():
                auth_token=user_serializer.validated_data['access_token']
                headers = {'Authorization': f'Bearer {auth_token}'}
                user_request = requests.get(url="https://api.intra.42.fr/v2/me", headers=headers)
                #Check if user with this external ID exists in the DB
                external_id = user_request.json()["id"]
                user = CustomUser.objects.filter(external_id=external_id).first()
                if user is not None:
                    refresh = RefreshToken.for_user(user)
                    return Response({
                    'token' : str(refresh.access_token),
                    'refresh' : str(refresh),
                    'message': 'Login successful',
                },status=status.HTTP_200_OK)
                else:
                    # User prompt an username and return the token
                    return Response({"message": "Welcome! Insert an username"}, status=status.HTTP_200_OK)
        return Response(user_request.text, status=r.status_code)