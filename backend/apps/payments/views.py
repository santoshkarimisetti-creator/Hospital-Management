import uuid
from django.db import transaction
from rest_framework import viewsets, permissions, status, exceptions
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.payments.models import Payment, Refund
from apps.payments.serializers import PaymentSerializer, DemoCheckoutSerializer
from apps.appointments.models import Appointment
from apps.appointments.serializers import AppointmentSerializer
from apps.doctors.models import Doctor
from apps.members.models import Member, Relationship
from apps.leaves.models import DoctorLeave
from apps.schedules.models import DailyDoctorCapacity
from apps.tokens.models import Token
from apps.roles.permissions import get_user_role_names, get_user_hospital_ids
from apps.roles.models import Role


class PaymentViewSet(viewsets.ModelViewSet):
    """
    Payments and Demo Checkout Transactions Endpoint.
    - Tracks payment ledgers for appointments
    - Implements simulated demo checkout for UPI, Card, and QR code
    """
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role_names = get_user_role_names(user)

        queryset = Payment.objects.all().select_related(
            'appointment', 'appointment__doctor', 'appointment__member', 'appointment__hospital'
        )

        if Role.SUPER_ADMIN in role_names or user.is_superuser:
            return queryset

        hospital_ids = get_user_hospital_ids(user)
        if hospital_ids and Role.PATIENT not in role_names:
            return queryset.filter(appointment__hospital_id__in=hospital_ids)

        if Role.PATIENT in role_names:
            return queryset.filter(appointment__member__user=user)

        return queryset.none()

    @action(detail=False, methods=['post'], url_path='demo-checkout')
    def demo_checkout(self, request):
        """
        Processes a demo appointment payment transaction atomically:
        1. Validates doctor, date, leave, and capacity
        2. Prevents duplicate booking
        3. Confirms appointment (STATUS_CONFIRMED, PAYMENT_PAID)
        4. Updates DailyDoctorCapacity.online_allocated
        5. Issues unique Token record
        6. Creates Payment transaction with STATUS_SUCCESS
        """
        serializer = DemoCheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        doctor_id = data['doctor_id']
        appointment_date = data['appointment_date']
        payment_method = data.get('payment_method', 'UPI')
        payment_reference = data.get('payment_reference', '')
        visit_reason = data.get('visit_reason', 'General Consultation')

        # 1. Resolve Doctor
        doctor = Doctor.objects.filter(id=doctor_id, is_active=True).select_related('user', 'hospital').first()
        if not doctor:
            return Response(
                {"error": "Selected doctor was not found or is currently inactive."},
                status=status.HTTP_400_BAD_REQUEST
            )

        hospital = doctor.hospital

        with transaction.atomic():
            # 2. Resolve or Create Patient Member
            member_id = data.get('member_id')
            if member_id:
                member = Member.objects.filter(id=member_id).first()
                if not member:
                    return Response({"error": "Selected patient profile not found."}, status=status.HTTP_400_BAD_REQUEST)
            else:
                new_name = data.get('new_member_name', '').strip()
                new_phone = data.get('new_member_phone', '').strip()
                if not new_name:
                    return Response({"error": "Patient name is required."}, status=status.HTTP_400_BAD_REQUEST)
                
                member = Member.objects.create(
                    user=request.user,
                    full_name=new_name,
                    phone=new_phone or request.user.mobile_number,
                    gender=data.get('new_member_gender', 'M'),
                    custom_relation=data.get('new_member_relation', 'Self')
                )
                Relationship.objects.create(
                    member=member,
                    related_to_user=request.user,
                    relationship_type=data.get('new_member_relation', 'Self').upper() if data.get('new_member_relation', 'Self').upper() in dict(Relationship.RELATIONSHIP_CHOICES) else Relationship.REL_OTHER,
                    custom_relation=data.get('new_member_relation', 'Self')
                )

            # 3. Check Doctor Leave
            is_on_leave = DoctorLeave.objects.filter(
                doctor=doctor,
                start_date__lte=appointment_date,
                end_date__gte=appointment_date,
                is_approved=True
            ).exists()

            if is_on_leave:
                return Response(
                    {"error": f"Dr. {doctor.user.username} is on approved leave on {appointment_date} and cannot accept appointments."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 4. Check Daily Doctor Capacity
            limit = doctor.daily_capacity_limit or 60
            capacity, _ = DailyDoctorCapacity.objects.get_or_create(
                doctor=doctor,
                date=appointment_date,
                defaults={'total_capacity': limit, 'online_allocated': 0, 'physical_allocated': 0}
            )

            if capacity.allocated_count >= capacity.total_capacity:
                return Response(
                    {"error": f"Dr. {doctor.user.get_full_name() or doctor.user.username} has reached the daily limit of {capacity.total_capacity} appointments for {appointment_date}."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 5. Prevent Duplicate Booking
            duplicate = Appointment.objects.filter(
                doctor=doctor,
                member=member,
                appointment_date=appointment_date,
                status__in=[Appointment.STATUS_CONFIRMED, Appointment.STATUS_PENDING]
            ).first()

            if duplicate:
                existing_token = Token.objects.filter(appointment=duplicate).first()
                token_info = f" (Token #{existing_token.token_number})" if existing_token else ""
                return Response(
                    {"error": f"An appointment for {member.full_name} with Dr. {doctor.user.username} is already confirmed on {appointment_date}{token_info}."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 6. Create Confirmed Appointment
            appointment = Appointment.objects.create(
                hospital=hospital,
                doctor=doctor,
                member=member,
                appointment_date=appointment_date,
                visit_reason=visit_reason,
                status=Appointment.STATUS_CONFIRMED,
                payment_status=Appointment.PAYMENT_PAID
            )

            # 7. Increment Capacity
            next_token_num = capacity.allocated_count + 1
            capacity.online_allocated += 1
            capacity.save()

            # 8. Create Token Record
            token = Token.objects.create(
                doctor=doctor,
                appointment=appointment,
                member=member,
                date=appointment_date,
                token_number=next_token_num,
                token_type=Token.TYPE_ONLINE,
                status=Token.STATUS_ISSUED
            )

            # 9. Create Payment Record (Backend is sole source of truth for fee)
            txn_id = f"TXN-DEMO-{uuid.uuid4().hex[:10].upper()}"
            payment = Payment.objects.create(
                appointment=appointment,
                amount=doctor.consultation_fee,
                payment_method=payment_method,
                transaction_id=txn_id,
                status=Payment.STATUS_SUCCESS
            )

        return Response({
            "message": "Demo payment processed successfully. Appointment confirmed & token issued.",
            "appointment": AppointmentSerializer(appointment).data,
            "token": {
                "id": token.id,
                "token_number": token.token_number,
                "token_type": token.token_type,
                "status": token.status,
                "date": str(token.date)
            },
            "payment": PaymentSerializer(payment).data,
            "doctor_capacity": {
                "allocated": capacity.allocated_count,
                "total": capacity.total_capacity,
                "display": f"{capacity.allocated_count}/{capacity.total_capacity}"
            }
        }, status=status.HTTP_201_CREATED)
