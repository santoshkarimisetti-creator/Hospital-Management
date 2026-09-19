from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from apps.roles.permissions import get_user_role_names

User = get_user_model()


class HospitalTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom SimpleJWT Token Serializer for Hospital Staff portal:
    - Supports Email OR Username + Password
    - Enforces role separation: Rejects pure patient accounts from logging into hospital portal
    """
    def validate(self, attrs):
        username_or_email = attrs.get('username', '').strip()
        if '@' in username_or_email:
            # Look up username by email
            matching_user = User.objects.filter(email__iexact=username_or_email).first()
            if matching_user:
                attrs['username'] = matching_user.username

        data = super().validate(attrs)

        from apps.staff.models import HospitalStaff
        from apps.doctors.models import Doctor

        user = self.user
        is_hospital_user = (
            user.is_superuser
            or user.is_staff
            or HospitalStaff.objects.filter(user=user, is_active=True).exists()
            or Doctor.objects.filter(user=user, is_active=True).exists()
        )

        if not is_hospital_user:
            raise serializers.ValidationError(
                {"detail": "Access restricted: Patient accounts cannot log in to the Hospital Staff portal. Please use the Patient portal."}
            )

        data['user'] = UserSerializer(self.user).data
        return data


class SendOTPSerializer(serializers.Serializer):
    mobile_number = serializers.CharField(max_length=20, required=True)


class VerifyOTPSerializer(serializers.Serializer):
    mobile_number = serializers.CharField(max_length=20, required=True)
    otp = serializers.CharField(max_length=6, required=True)
    username = serializers.CharField(max_length=150, required=False, allow_blank=True)
    name = serializers.CharField(max_length=255, required=False, allow_blank=True)


class UserSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()
    primary_role = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'mobile_number', 'email', 'full_name', 'is_patient',
            'is_staff', 'is_superuser', 'roles', 'primary_role', 'created_at'
        )
        read_only_fields = ('id', 'is_superuser', 'created_at')

    def get_full_name(self, obj):
        if obj.first_name:
            return obj.first_name
        self_member = obj.members.first()
        return self_member.full_name if self_member else obj.username

    def get_roles(self, obj):
        return get_user_role_names(obj)

    def get_primary_role(self, obj):
        roles = self.get_roles(obj)
        if 'SUPER_ADMIN' in roles or obj.is_superuser:
            return 'SUPER_ADMIN'
        if 'HOSPITAL_ADMIN' in roles:
            return 'HOSPITAL_ADMIN'
        if 'DOCTOR' in roles:
            return 'DOCTOR'
        if 'RECEPTIONIST' in roles:
            return 'RECEPTIONIST'
        return 'PATIENT'
