from rest_framework import serializers
from apps.staff.models import HospitalStaff
from apps.accounts.serializers import UserSerializer
from apps.hospitals.serializers import HospitalSerializer


class HospitalStaffSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)
    hospital_detail = HospitalSerializer(source='hospital', read_only=True)

    class Meta:
        model = HospitalStaff
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')
