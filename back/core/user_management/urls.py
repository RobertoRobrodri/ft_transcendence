# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('user_update/<slug:username>', views.UserUpdateView.as_view(), name='user-update'),
	path('password_update/<slug:username>', views.UserPasswordUpdateView.as_view(), name='password-update'),
	path('profile_picture_update/<slug:username>', views.UserProfilePictureUpdateView.as_view(), name='profile-picture-update'),
	path('user_delete/<slug:username>', views.UserDeleteView.as_view(), name='user-delete'),
]