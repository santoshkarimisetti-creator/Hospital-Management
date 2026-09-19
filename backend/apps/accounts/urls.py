from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from apps.accounts.views import (
    SendOTPView,
    VerifyOTPView,
    HospitalTokenObtainPairView,
    LogoutView,
    MeView,
)

urlpatterns = [
    # Patient OTP Authentication
    path('send-otp/', SendOTPView.as_view(), name='auth-send-otp'),
    path('verify-otp/', VerifyOTPView.as_view(), name='auth-verify-otp'),

    # Hospital Staff Email/Username+Password Authentication
    path('token/', HospitalTokenObtainPairView.as_view(), name='auth-token-obtain'),
    path('hospital-login/', HospitalTokenObtainPairView.as_view(), name='auth-hospital-login'),
    path('refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),

    # Shared
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', MeView.as_view(), name='auth-me'),
]
