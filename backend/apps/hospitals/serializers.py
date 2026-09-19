from rest_framework import serializers
from apps.hospitals.models import Hospital


class HospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hospital
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')
