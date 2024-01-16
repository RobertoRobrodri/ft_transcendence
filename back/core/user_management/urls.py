# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('user_update/<slug:username>', views.UserUpdateView.as_view(), name='user-update'),
	path('user_delete/<slug:username>', views.UserDeleteView.as_view(), name='user-delete'),
]