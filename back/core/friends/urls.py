# urls.py
from django.urls import path
from . import views


urlpatterns = [
    path('send_friend_request/', views.CreateFriendRequestView.as_view(), name='send-friend-request'),
	path('handle_friend_request/<int:pk>/', views.AcceptOrCancelFriendRequestView.as_view(), name='handle-friend-request'),
]