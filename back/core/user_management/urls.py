from django.urls import path
from . import views

urlpatterns = [
    path('user_update/', views.UserUpdateView.as_view(), name='user-update'),
	path('user_update_password/', views.UserUpdatePasswordView.as_view(), name='user-update-password'),
	path('user_delete/', views.UserDeleteView.as_view(), name='user-delete'),
	path('user_list/', views.UserListView.as_view(), name='user-list'),
	path('user_list_all/', views.UserListAllView.as_view(), name='user-list-all'),
]