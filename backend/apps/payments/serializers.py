import uuid
from rest_framework import serializers
from apps.payments.models import Payment, Refund
from apps.appointments.serializers import AppointmentSerializer


class PaymentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='appointment.member.full_name', read_only=True)
    doctor_name = serializers.CharField(source='appointment.doctor.doctor_name', read_only=True)
    hospital_name = serializers.CharField(source='appointment.hospital.name', read_only=True)
    appointment_date = serializers.DateField(source='appointment.appointment_date', read_only=True)

    class Meta:
        model = Payment
        fields = (
            'id', 'appointment', 'patient_name', 'doctor_name', 'hospital_name',
            'appointment_date', 'amount', 'payment_method', 'transaction_id',
            'status', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class DemoCheckoutSerializer(serializers.Serializer):
    doctor_id = serializers.IntegerField(required=True)
    member_id = serializers.IntegerField(required=False, allow_null=True)
    hospital_id = serializers.IntegerField(required=False, allow_null=True)
    appointment_date = serializers.DateField(required=True)
    visit_reason = serializers.CharField(max_length=255, required=False, default='General Consultation')
    payment_method = serializers.ChoiceField(
        choices=['UPI', 'CARD', 'QR', 'ONLINE'],
        default='UPI'
    )
    payment_reference = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')

    # Inline patient creation support
    new_member_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    new_member_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    new_member_relation = serializers.CharField(max_length=50, required=False, allow_blank=True, default='Self')
    new_member_gender = serializers.ChoiceField(choices=['M', 'F', 'O'], required=False, default='M')
