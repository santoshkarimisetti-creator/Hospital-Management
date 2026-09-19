from rest_framework import viewsets, permissions, exceptions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
import datetime

from apps.appointments.models import Appointment
from apps.appointments.serializers import AppointmentSerializer
from apps.leaves.models import DoctorLeave
from apps.schedules.models import DailyDoctorCapacity
from apps.tokens.models import Token
from apps.roles.permissions import IsHospitalScoped, get_user_hospital_ids, get_user_role_names
from apps.roles.models import Role


class AppointmentViewSet(viewsets.ModelViewSet):
    """
    Appointments Management Endpoint.
    - Doctor: Sees ONLY patients scheduled for their consultation for selected/current day, ordered chronologically by token number.
    - Receptionist / Admin: Sees appointments for their hospital.
    """
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsHospitalScoped]

    def get_queryset(self):
        user = self.request.user
        role_names = get_user_role_names(user)

        queryset = Appointment.objects.all().select_related(
            'hospital', 'doctor', 'doctor__user', 'member'
        )

        if Role.SUPER_ADMIN not in role_names and not user.is_superuser:
            hospital_ids = get_user_hospital_ids(user)
            if hospital_ids:
                queryset = queryset.filter(hospital_id__in=hospital_ids)
            elif Role.PATIENT in role_names:
                queryset = queryset.filter(member__user=user)
            else:
                queryset = queryset.none()

        # Scoping for Doctors: Filter ONLY appointments for this specific doctor
        if Role.DOCTOR in role_names and not user.is_superuser:
            queryset = queryset.filter(doctor__user=user)

        date_param = self.request.query_params.get('date')
        if date_param:
            queryset = queryset.filter(appointment_date=date_param)

        doctor_id_param = self.request.query_params.get('doctor_id')
        if doctor_id_param:
            queryset = queryset.filter(doctor_id=doctor_id_param)

        # Filter by member for patient history lookup
        member_id_param = self.request.query_params.get('member_id')
        if member_id_param:
            queryset = queryset.filter(member_id=member_id_param)

        # Order chronologically by appointment date desc, then token number
        return queryset.order_by('-appointment_date', 'tokens__token_number').distinct()

    def perform_create(self, serializer):
        doctor = serializer.validated_data.get('doctor')
        appointment_date = serializer.validated_data.get('appointment_date')

        # Check Doctor Leave Constraint
        is_on_leave = DoctorLeave.objects.filter(
            doctor=doctor,
            start_date__lte=appointment_date,
            end_date__gte=appointment_date,
            is_approved=True
        ).exists()

        if is_on_leave:
            raise exceptions.ValidationError({
                "appointment_date": f"Dr. {doctor.user.username} is on leave on {appointment_date} and cannot accept appointments."
            })

        limit = doctor.daily_capacity_limit or 60
        today_capacity, _ = DailyDoctorCapacity.objects.get_or_create(
            doctor=doctor,
            date=appointment_date,
            defaults={'total_capacity': limit, 'online_allocated': 0, 'physical_allocated': 0}
        )

        if today_capacity.allocated_count >= today_capacity.total_capacity:
            raise exceptions.ValidationError({
                "appointment_date": f"Dr. {doctor.user.get_full_name() or doctor.user.username} has reached the daily limit of {today_capacity.total_capacity} appointments for {appointment_date}."
            })

        appointment = serializer.save()

        next_token_num = (today_capacity.online_allocated + today_capacity.physical_allocated) + 1
        today_capacity.online_allocated += 1
        today_capacity.save()

        Token.objects.create(
            doctor=doctor,
            appointment=appointment,
            member=appointment.member,
            date=appointment_date,
            token_number=next_token_num,
            token_type=Token.TYPE_ONLINE,
            status=Token.STATUS_ISSUED
        )

    @action(detail=True, methods=['post'])
    def mark_completed(self, request, pk=None):
        appointment = self.get_object()
        appointment.status = Appointment.STATUS_COMPLETED
        notes = request.data.get('visit_notes')
        if notes:
            appointment.visit_notes = notes
        appointment.save()

        # Update linked token status
        Token.objects.filter(appointment=appointment).update(status=Token.STATUS_COMPLETED)

        return Response({
            "message": "Appointment marked as Completed",
            "appointment": self.get_serializer(appointment).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def mark_revisit(self, request, pk=None):
        current_appt = self.get_object()
        revisit_date_str = request.data.get('revisit_date')

        if not revisit_date_str:
            return Response({"error": "revisit_date is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            revisit_date = datetime.datetime.strptime(revisit_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({"error": "Invalid revisit_date format. Use YYYY-MM-DD"}, status=status.HTTP_400_BAD_REQUEST)

        # Check Doctor Leave on Revisit Date
        is_on_leave = DoctorLeave.objects.filter(
            doctor=current_appt.doctor,
            start_date__lte=revisit_date,
            end_date__gte=revisit_date,
            is_approved=True
        ).exists()

        if is_on_leave:
            return Response({
                "error": f"Doctor is on leave on the requested revisit date ({revisit_date_str}). Please select another date."
            }, status=status.HTTP_400_BAD_REQUEST)

        notes = request.data.get('visit_notes', '')

        # Update current appointment status & revisit date while preserving history
        current_appt.status = Appointment.STATUS_REVISIT
        current_appt.revisit_date = revisit_date
        if notes:
            current_appt.visit_notes = notes
        current_appt.save()

        # Create NEW follow-up appointment record for revisit date
        new_appt = Appointment.objects.create(
            hospital=current_appt.hospital,
            doctor=current_appt.doctor,
            member=current_appt.member,
            appointment_date=revisit_date,
            visit_reason=f"Revisit / Follow-up (Original Appt #{current_appt.id})",
            visit_notes=notes,
            status=Appointment.STATUS_CONFIRMED,
            payment_status=Appointment.PAYMENT_PAID
        )

        # Create token for revisit date
        revisit_capacity, _ = DailyDoctorCapacity.objects.get_or_create(
            doctor=current_appt.doctor,
            date=revisit_date,
            defaults={'total_capacity': 100, 'online_allocated': 0, 'physical_allocated': 0}
        )

        next_token_num = (revisit_capacity.online_allocated + revisit_capacity.physical_allocated) + 1
        revisit_capacity.online_allocated += 1
        revisit_capacity.save()

        Token.objects.create(
            doctor=current_appt.doctor,
            appointment=new_appt,
            member=new_appt.member,
            date=revisit_date,
            token_number=next_token_num,
            token_type=Token.TYPE_ONLINE,
            status=Token.STATUS_ISSUED
        )

        return Response({
            "message": "Revisit scheduled successfully",
            "previous_appointment": self.get_serializer(current_appt).data,
            "new_revisit_appointment": self.get_serializer(new_appt).data
        }, status=status.HTTP_200_OK)
