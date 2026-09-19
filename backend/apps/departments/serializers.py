from rest_framework import serializers
from apps.departments.models import Department


class DepartmentSerializer(serializers.ModelSerializer):
    doctor_count = serializers.SerializerMethodField()
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)

    class Meta:
        model = Department
        fields = ('id', 'hospital', 'hospital_name', 'name', 'code', 'doctor_count', 'is_active', 'created_at')
        read_only_fields = ('id', 'created_at')

    def get_doctor_count(self, obj):
        return obj.doctors.filter(is_active=True).count()
