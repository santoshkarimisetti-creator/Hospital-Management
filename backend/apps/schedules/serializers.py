from rest_framework import serializers
from apps.schedules.models import DoctorSchedule, DailyDoctorCapacity
from apps.doctors.models import Doctor


class DoctorScheduleSerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)

    class Meta:
        model = DoctorSchedule
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class DailyDoctorCapacitySerializer(serializers.ModelSerializer):
    allocated_count = serializers.SerializerMethodField()
    display_capacity = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()

    class Meta:
        model = DailyDoctorCapacity
        fields = (
            'id', 'doctor', 'doctor_name', 'date', 'total_capacity',
            'online_allocated', 'physical_allocated', 'allocated_count',
            'display_capacity', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_allocated_count(self, obj):
        return obj.online_allocated + obj.physical_allocated

    def get_display_capacity(self, obj):
        allocated = obj.online_allocated + obj.physical_allocated
        return f"{allocated}/{obj.total_capacity}"

    def get_doctor_name(self, obj):
        return f"Dr. {obj.doctor.user.get_full_name() or obj.doctor.user.username}"
