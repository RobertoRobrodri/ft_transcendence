# urls.py
from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


urlpatterns = [
    path('register/', views.UserRegistrationView.as_view(), name='user-registration'),
    path('login/', views.UserLoginView.as_view(), name='user-login'),
    path('logout/', views.UserLogoutView.as_view(), name='user-logout'),
    path('42/callback/', views.User42Callback.as_view(), name='user-42-callback'),
    path('verify_otp/', views.UserValidateOTPView.as_view(), name='user-validate-otp'),
    # Simple JWT urls
    # path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]