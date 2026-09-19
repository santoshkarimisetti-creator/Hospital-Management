from rest_framework import serializers
from apps.appointments.models import Appointment
from apps.tokens.models import Token


class AppointmentSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.full_name', read_only=True)
    member_phone = serializers.CharField(source='member.phone', read_only=True)
    member_gender = serializers.CharField(source='member.gender', read_only=True)
    member_age = serializers.IntegerField(source='member.age', read_only=True)
    member_address = serializers.CharField(source='member.address', read_only=True, default='')
    doctor_name = serializers.SerializerMethodField()
    department_name = serializers.CharField(source='doctor.department.name', read_only=True)
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    token_number = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = (
            'id', 'hospital', 'hospital_name', 'doctor', 'doctor_name',
            'department_name', 'member', 'member_name', 'member_phone',
            'member_gender', 'member_age', 'member_address',
            'appointment_date', 'visit_reason', 'visit_notes',
            'revisit_date', 'status', 'payment_status', 'token_number',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_doctor_name(self, obj):
        return f"Dr. {obj.doctor.user.get_full_name() or obj.doctor.user.username}"

    def get_token_number(self, obj):
        token = Token.objects.filter(appointment=obj).first()
        return token.token_number if token else None

