from rest_framework import serializers
from apps.leaves.models import DoctorLeave
from apps.doctors.models import Doctor


class DoctorLeaveSerializer(serializers.ModelSerializer):
    doctor_name = serializers.SerializerMethodField()
    hospital_id = serializers.IntegerField(source='doctor.hospital_id', read_only=True)

    class Meta:
        model = DoctorLeave
        fields = (
            'id', 'doctor', 'doctor_name', 'hospital_id',
            'start_date', 'end_date', 'reason', 'is_approved',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_doctor_name(self, obj):
        return f"Dr. {obj.doctor.user.get_full_name() or obj.doctor.user.username}"

    def validate(self, data):
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError({"end_date": "End date cannot be before start date."})
        return data
