# urls.py
from django.urls import path
from . import views


urlpatterns = [
    path('send_friend_request/', views.CreateFriendRequestView.as_view(), name='send-friend-request'),
]