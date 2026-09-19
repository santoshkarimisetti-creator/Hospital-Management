import random
from django.core.cache import cache
from django.contrib.auth import get_user_model
from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema

from apps.accounts.serializers import (
    SendOTPSerializer,
    VerifyOTPSerializer,
    UserSerializer,
    HospitalTokenObtainPairSerializer,
)
from apps.members.models import Member, Relationship

User = get_user_model()

OTP_EXPIRY_SECONDS = 300  # 5 minutes TTL


class HospitalTokenObtainPairView(TokenObtainPairView):
    """
    Staff Authentication Endpoint for Hospital Portal:
    - Accepts Email OR Username + Password
    - Rejects patient-only accounts
    """
    serializer_class = HospitalTokenObtainPairSerializer


class MeView(views.APIView):
    """Return the authenticated user's profile. Used by both frontends after login."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)



class SendOTPView(views.APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=SendOTPSerializer, responses={200: dict})
    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        mobile_number = serializer.validated_data['mobile_number']

        # Generate 6-digit OTP
        otp = str(random.randint(100000, 999999))
        cache_key = f"otp:{mobile_number}"
        
        # Store OTP in Django Cache with TTL (300 seconds)
        cache.set(cache_key, otp, timeout=OTP_EXPIRY_SECONDS)

        return Response({
            "message": "OTP generated and sent successfully",
            "mobile_number": mobile_number,
            "otp": otp,  # Exposed for testing/prototype verification
            "expires_in_seconds": OTP_EXPIRY_SECONDS
        }, status=status.HTTP_200_OK)


class VerifyOTPView(views.APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=VerifyOTPSerializer, responses={200: dict})
    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        mobile_number = serializer.validated_data['mobile_number']
        submitted_otp = serializer.validated_data['otp']
        username_input = serializer.validated_data.get('username')
        name_input = serializer.validated_data.get('name')

        cache_key = f"otp:{mobile_number}"
        cached_otp = cache.get(cache_key)

        if not cached_otp:
            return Response(
                {"error": "OTP has expired or was not requested"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if cached_otp != submitted_otp:
            return Response(
                {"error": "Invalid OTP provided"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Clear OTP from cache after successful verification
        cache.delete(cache_key)

        # Get or create user with mobile_number
        user = User.objects.filter(mobile_number=mobile_number).first()
        if user:
            from apps.staff.models import HospitalStaff
            from apps.doctors.models import Doctor
            is_hospital_staff = (
                user.is_superuser
                or user.is_staff
                or HospitalStaff.objects.filter(user=user, is_active=True).exists()
                or Doctor.objects.filter(user=user, is_active=True).exists()
            )
            if is_hospital_staff:
                return Response(
                    {"error": "Hospital staff accounts cannot log in to the Patient portal. Please use the Hospital portal."},
                    status=status.HTTP_403_FORBIDDEN
                )
            if name_input and not user.first_name:
                user.first_name = name_input
                user.save()
        else:
            # Auto-generate unique username based on patient name or mobile
            if name_input:
                base_username = name_input.lower().replace(" ", "_")
            else:
                base_username = username_input or f"user_{mobile_number}"

            username = base_username
            if User.objects.filter(username=username).exists():
                username = f"{base_username}_{random.randint(1000, 9999)}"
            
            user = User.objects.create(
                mobile_number=mobile_number,
                username=username,
                first_name=name_input or '',
                is_patient=True
            )

        # Automatically create Self Member profile for Patient if not existing
        if name_input or not user.members.exists():
            patient_name = name_input or user.first_name or user.username
            self_member, created = Member.objects.get_or_create(
                user=user,
                full_name=patient_name,
                defaults={'phone': mobile_number, 'gender': Member.GENDER_MALE}
            )
            if created:
                Relationship.objects.get_or_create(
                    member=self_member,
                    related_to_user=user,
                    defaults={'relationship_type': Relationship.REL_SELF}
                )

        # Generate SimpleJWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            "message": "Authentication successful",
            "user": UserSerializer(user).data,
            "tokens": {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)


class LogoutView(views.APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=dict, responses={200: dict})
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            pass  # Even if token is already invalidated/blacklisted, confirm logout

        return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
