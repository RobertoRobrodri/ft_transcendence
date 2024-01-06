from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, logout
from django.contrib.auth.decorators import login_required
from .serializers import UserRegistrationSerializer

class UserRegistrationView(generics.CreateAPIView):
#    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer

#    def post (self, request):
#        serializer = self.get_serializer(data=request.data)
#        if serializer.is_valid():
#            serializer.save()
#            return Response({'message': 'User created successfully'}, status=status.HTTP_201_CREATED)
#        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#class UserLoginView(generics.RetrieveAPIView):
#    def post(self, request):
#        username = request.data.get('username')
#        password = request.data.get('password')
#
#        user = authenticate(username=username, password=password)
#        if user:
#            return Response({'message': 'Login successful'}, status=status.HTTP_200_OK)
#        return Response({'error': 'Invalid Credentials'}, status=status.HTTP_401_UNAUTHORIZED)
#
#@login_required
#class UserLogoutView(APIView):
#    def post(self, request):
#        logout(request)
#        return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)