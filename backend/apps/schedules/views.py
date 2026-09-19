from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
import datetime

from apps.schedules.models import DoctorSchedule, DailyDoctorCapacity
from apps.schedules.serializers import DoctorScheduleSerializer, DailyDoctorCapacitySerializer
from apps.doctors.models import Doctor
from apps.roles.permissions import IsHospitalScoped, get_user_hospital_ids, get_user_role_names
from apps.roles.models import Role


class DoctorScheduleViewSet(viewsets.ModelViewSet):
    serializer_class = DoctorScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role_names = get_user_role_names(user)
        
        queryset = DoctorSchedule.objects.all().select_related('doctor', 'doctor__user')
        if Role.SUPER_ADMIN in role_names or user.is_superuser:
            return queryset

        hospital_ids = get_user_hospital_ids(user)
        if hospital_ids:
            return queryset.filter(doctor__hospital_id__in=hospital_ids)
        return queryset


class DailyDoctorCapacityViewSet(viewsets.ModelViewSet):
    """
    Tracks doctor capacity per doctor_id + date.
    """
    serializer_class = DailyDoctorCapacitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role_names = get_user_role_names(user)
        
        queryset = DailyDoctorCapacity.objects.all().select_related('doctor', 'doctor__user')
        
        if Role.SUPER_ADMIN not in role_names and not user.is_superuser:
            hospital_ids = get_user_hospital_ids(user)
            if hospital_ids:
                queryset = queryset.filter(doctor__hospital_id__in=hospital_ids)

        doctor_id = self.request.query_params.get('doctor_id')
        date_param = self.request.query_params.get('date')

        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
        if date_param:
            queryset = queryset.filter(date=date_param)

        return queryset

    @action(detail=False, methods=['get'])
    def today_doctor_capacity(self, request):
        """
        Retrieves today's capacity for a specific doctor or first available doctor.
        Calculates count using doctor_id + date.
        """
        doctor_id = request.query_params.get('doctor_id')
        if not doctor_id and hasattr(request.user, 'doctor_profiles'):
            doctor = request.user.doctor_profiles.filter(is_active=True).first()
            if doctor:
                doctor_id = doctor.id

        if not doctor_id:
            first_doctor = Doctor.objects.filter(is_active=True).first()
            if first_doctor:
                doctor_id = first_doctor.id

        if not doctor_id:
            return Response({
                "display_capacity": "0/60",
                "total_capacity": 60,
                "allocated_count": 0,
                "online_allocated": 0,
                "physical_allocated": 0
            }, status=status.HTTP_200_OK)

        doctor = Doctor.objects.filter(id=doctor_id).first()
        limit = doctor.daily_capacity_limit if doctor else 60

        today = timezone.now().date()
        capacity, created = DailyDoctorCapacity.objects.get_or_create(
            doctor_id=doctor_id,
            date=today,
            defaults={'total_capacity': limit, 'online_allocated': 0, 'physical_allocated': 0}
        )

        serializer = self.get_serializer(capacity)
        return Response(serializer.data, status=status.HTTP_200_OK)
