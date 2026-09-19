from rest_framework import serializers
from apps.doctors.models import Doctor


class DoctorSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True, required=False)
    doctor_name = serializers.SerializerMethodField()
    department_name = serializers.CharField(source='department.name', read_only=True)
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)
    today_allocated = serializers.SerializerMethodField()
    today_remaining = serializers.SerializerMethodField()
    today_capacity_display = serializers.SerializerMethodField()

    class Meta:
        model = Doctor
        fields = (
            'id', 'user', 'username', 'doctor_name', 'hospital', 'hospital_name',
            'department', 'department_name', 'qualification',
            'specialization', 'consultation_fee', 'daily_capacity_limit',
            'today_allocated', 'today_remaining', 'today_capacity_display',
            'is_active', 'created_at'
        )
        read_only_fields = ('id', 'created_at')
        extra_kwargs = {
            'user': {'required': False}
        }

    def create(self, validated_data):
        username = validated_data.pop('username', None)
        if username and 'user' not in validated_data:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            matching_user = User.objects.filter(username=username).first()
            if not matching_user:
                raise serializers.ValidationError({"username": f"User with username '{username}' does not exist."})
            validated_data['user'] = matching_user
        return super().create(validated_data)

    def get_doctor_name(self, obj):
        return f"Dr. {obj.user.get_full_name() or obj.user.username}"

    def get_today_allocated(self, obj):
        from apps.schedules.models import DailyDoctorCapacity
        from django.utils import timezone
        today = timezone.now().date()
        capacity = DailyDoctorCapacity.objects.filter(doctor=obj, date=today).first()
        if capacity:
            return capacity.allocated_count
        return 0

    def get_today_remaining(self, obj):
        allocated = self.get_today_allocated(obj)
        limit = obj.daily_capacity_limit or 60
        rem = limit - allocated
        return max(rem, 0)

    def get_today_capacity_display(self, obj):
        allocated = self.get_today_allocated(obj)
        limit = obj.daily_capacity_limit or 60
        return f"{allocated}/{limit}"
