from rest_framework import viewsets, permissions, exceptions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
import datetime

from apps.leaves.models import DoctorLeave
from apps.leaves.serializers import DoctorLeaveSerializer
from apps.roles.permissions import IsHospitalScoped, get_user_hospital_ids, get_user_role_names
from apps.roles.models import Role


class DoctorLeaveViewSet(viewsets.ModelViewSet):
    """
    CRUD Endpoint for Doctor Leaves.
    - Doctor: Can submit leave requests for self.
    - Hospital Admin / Receptionist / Staff: Can view leaves for doctors.
    """
    serializer_class = DoctorLeaveSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role_names = get_user_role_names(user)
        
        queryset = DoctorLeave.objects.all().select_related('doctor', 'doctor__user', 'doctor__hospital')

        if Role.SUPER_ADMIN not in role_names and not user.is_superuser:
            hospital_ids = get_user_hospital_ids(user)
            if hospital_ids:
                queryset = queryset.filter(doctor__hospital_id__in=hospital_ids)

        doctor_id = self.request.query_params.get('doctor_id')
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)

        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        role_names = get_user_role_names(user)
        doctor = serializer.validated_data.get('doctor')

        # Auto-approve if created by Doctor themselves or Hospital Admin
        is_approved = serializer.validated_data.get('is_approved', True)

        if Role.SUPER_ADMIN not in role_names and not user.is_superuser:
            user_hospitals = get_user_hospital_ids(user)
            if doctor.hospital_id not in user_hospitals:
                raise exceptions.PermissionDenied("You cannot submit leave for a doctor in another hospital.")

        serializer.save(is_approved=is_approved)

    @action(detail=False, methods=['get'])
    def check_availability(self, request):
        """
        Utility endpoint checking if a doctor is on leave on a given date.
        """
        doctor_id = request.query_params.get('doctor_id')
        date_str = request.query_params.get('date')

        if not doctor_id or not date_str:
            return Response({"error": "doctor_id and date are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            target_date = datetime.datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD"}, status=status.HTTP_400_BAD_REQUEST)

        is_on_leave = DoctorLeave.objects.filter(
            doctor_id=doctor_id,
            start_date__lte=target_date,
            end_date__gte=target_date,
            is_approved=True
        ).exists()

        return Response({
            "doctor_id": int(doctor_id),
            "date": date_str,
            "is_available": not is_on_leave,
            "is_on_leave": is_on_leave
        }, status=status.HTTP_200_OK)
