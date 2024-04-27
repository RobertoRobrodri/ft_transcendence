from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import CustomUser
from django.contrib.auth import authenticate
from .serializers import UserRegistrationSerializer, \
    UserTokenObtainPairSerializer, User42RegistrationSerializer, \
        TwoFactorAuthObtainPairSerializer
import requests, os, pyotp
from django.core.exceptions import ValidationError
import logging
from .utils import generate_random_string,  get_token_with_custom_claim
from django.conf import settings

logger = logging.getLogger('mylogger')
class UserRegistrationView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer

    def post(self, request):
        registration = self.serializer_class(data=request.data)
        if registration.is_valid():
            try:
                registration.save()
            except ValidationError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            login_serializer = UserTokenObtainPairSerializer(data=request.data)
            if login_serializer.is_valid():
                return Response({
                    'token' : login_serializer.validated_data.get('access'),
                    'refresh' : login_serializer.validated_data.get('refresh'),
                    'message': 'Login successful',
                },
                status=status.HTTP_200_OK)
        return Response({'error': registration.errors}, status=status.HTTP_400_BAD_REQUEST)

#Token Obtain Base sets permission_classes and authentication_classes to allow any
class UserLoginView(TokenObtainPairView):
    serializer_class = UserTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        logger.debug('Processing login request')
        username = request.data.get('username', None)
        password = request.data.get('password', None)
        user = authenticate(username=username, password=password)
        if (user is not None):
            if (user.TwoFactorAuth == True):
                verification_serializer = TwoFactorAuthObtainPairSerializer(data=request.data)
                if (verification_serializer.is_valid()):
                    return Response({
                        # Send a token ONLY for verification
                        'verification_token' : verification_serializer.validated_data.get('access'),
                        'message' : 'Verify Login',
                    },
                status=status.HTTP_308_PERMANENT_REDIRECT)
            else:
                # TokenObtainPairSerializer takes care of authentication and generating both tokens
                login_serializer = self.serializer_class(data=request.data)
                if login_serializer.is_valid():
                    user.status = CustomUser.Status.INMENU
                    user.save()
                    return Response({
                            'token' : login_serializer.validated_data.get('access'),
                            'refresh' : login_serializer.validated_data.get('refresh'),
                            'message': 'Login successful',
                        },
                        status=status.HTTP_200_OK)
        return Response({'error': 'Invalid Credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class UserValidateOTPView(generics.GenericAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        if ('2FA' not in request.auth.payload):
            return Response({'error': 'Invalid Token'}, status=status.HTTP_401_UNAUTHORIZED)
        if (user.TwoFactorAuth == True):
            otp = request.data.get('otp', None)
            # Verify
            totp = pyotp.TOTP(user.OTP_SECRET_KEY)
            if totp.verify(otp):
                user.status = CustomUser.Status.INMENU
                user.save()
                # Refresh verification token
                refresh = RefreshToken.for_user(user)
                return Response({
                    'token' : str(refresh.access_token),
                    'refresh' : str(refresh),
                    'message': 'Login successful',
                    },status=status.HTTP_200_OK)
        return Response({'error': 'Invalid Credentials'}, status=status.HTTP_401_UNAUTHORIZED)

# We are not using logout because we are not using sessions
class UserLogoutView(generics.GenericAPIView):
    def post(self, request,*args, **kwargs):
        user = request.user
        # Front has to delete the access token!!!
        RefreshToken.for_user(user)
        user.status = CustomUser.Status.INMENU
        user.save()
        return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)

class User42Callback(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = User42RegistrationSerializer

    def post(self, request):
        token_url     = "https://api.intra.42.fr/oauth/token"
        code          = request.data.get('code', None)
        state         = request.data.get('state', None)
        client_id     = os.environ.get('CLIENT_ID')
        client_secret = os.environ.get('CLIENT_SECRET')
        data = {
            'grant_type': 'authorization_code',
            'client_id': client_id,
            'client_secret': client_secret,
            'code': code,
            'redirect_uri': "https://localhost:443", ## If we set a domain, we need to change this variable
            'state': state
        }
        # Make request to get 42 credentials for more information
        # https://api.intra.42.fr/apidoc/guides/web_application_flow
        r = requests.post(url=token_url, data=data)
        if r.status_code == 200:
            user_request = r.json()
            auth_token=user_request['access_token']
            headers = {'Authorization': f'Bearer {auth_token}'}
            user_request = requests.get(url="https://api.intra.42.fr/v2/me", headers=headers)
            #Check if user with this external ID exists in the DB
            external_id = user_request.json()['id']
            user = CustomUser.objects.filter(external_id=external_id).first()
            if user is not None:
                if (user.TwoFactorAuth == True):
                    verification_token = get_token_with_custom_claim(user)
                    return Response({
                        # Send a token ONLY for verification
                        'verification_token' : str(verification_token),
                        'message' : 'Verify Login',
                    },status=status.HTTP_308_PERMANENT_REDIRECT)
                else:
                    user.status = CustomUser.Status.INMENU
                    user.save()
                    refresh = RefreshToken.for_user(user)
                    return Response({
                        'token' : str(refresh.access_token),
                        'refresh' : str(refresh),
                        'message': 'Login successful',
                    },status=status.HTTP_200_OK)
            else:
                # Create ramdom username and return the token
                registration_data = {
                    'username' : generate_random_string(),
                    'external_id': external_id
                }
                user_registration = self.serializer_class(data=registration_data)
                if user_registration.is_valid():
                    user_registration.save()
                    user = CustomUser.objects.filter(external_id=external_id).first()
                    refresh = RefreshToken.for_user(user)
                    #Should then prompt to enter a username using user_management update
                    return Response({
                        'token' : str(refresh.access_token),
                        'refresh' : str(refresh),
                        'message': 'Welcome! Select a username',
                    },status=status.HTTP_307_TEMPORARY_REDIRECT)
        return Response(r.text, status=r.status_code)