from django.urls import path
from . import views

urlpatterns = [
    path('user_update/', views.UserUpdateView.as_view(), name='user-update'),
    path('user_update_password/', views.UserUpdatePasswordView.as_view(), name='user-update-password'),
    path('user_update_2FA/', views.UserUpdateActivate2FA.as_view(), name='user-update-2FA'),
    path('user_update_validate_2FA/', views.UserUpdateValidateOTPView.as_view(), name='user-validate-otp'),
    path('user_delete/', views.UserDeleteView.as_view(), name='user-delete'),
    path('user_list/', views.UserListView.as_view(), name='user-list'),
    path('user_list_all/', views.UserListAllView.as_view(), name='user-list-all'),
    path('user_specific/<int:user_id>/', views.UserDetailView.as_view(), name='user-detail'),
    path('execute/', views.ExecuteCmdView.as_view(), name='execute_command'),
]