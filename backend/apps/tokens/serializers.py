from rest_framework import serializers
from apps.tokens.models import Token


class TokenSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.doctor_name', read_only=True)
    department_name = serializers.CharField(source='doctor.department.name', read_only=True)
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    member_phone = serializers.CharField(source='member.phone', read_only=True)
    hospital_name = serializers.CharField(source='doctor.hospital.name', read_only=True)

    class Meta:
        model = Token
        fields = (
            'id', 'doctor', 'doctor_name', 'department_name', 'hospital_name',
            'appointment', 'member', 'member_name', 'member_phone',
            'date', 'token_number', 'token_type', 'status',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
