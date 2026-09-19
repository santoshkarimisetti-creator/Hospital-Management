import datetime
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from apps.hospitals.models import Hospital
from apps.departments.models import Department
from apps.doctors.models import Doctor
from apps.members.models import Member
from apps.appointments.models import Appointment
from apps.tokens.models import Token
from apps.payments.models import Payment
from apps.roles.models import Role
from apps.staff.models import HospitalStaff
from apps.schedules.models import DailyDoctorCapacity

User = get_user_model()


class PaymentAndBookingTests(TestCase):
    def setUp(self):
        # Create Roles
        self.hospital_admin_role = Role.objects.create(name=Role.HOSPITAL_ADMIN, is_system_role=True)
        self.patient_role = Role.objects.create(name=Role.PATIENT, is_system_role=True)

        # Create Hospital & Department
        self.hospital = Hospital.objects.create(name="Apex Medical Center", code="APEX")
        self.dept = Department.objects.create(name="Cardiology", hospital=self.hospital)

        # Create Doctor User & Profile
        self.doc_user = User.objects.create(username="dr_sharma", mobile_number="9998887771", first_name="Rajesh")
        self.doctor = Doctor.objects.create(
            user=self.doc_user,
            hospital=self.hospital,
            department=self.dept,
            qualification="MD, DM Cardiology",
            consultation_fee=150.00,
            daily_capacity_limit=20,
            is_active=True
        )

        # Create Patient User & Member
        self.patient_user = User.objects.create(
            username="patient_arun",
            mobile_number="9876543210",
            first_name="Arun",
            is_patient=True
        )
        self.member = Member.objects.create(
            user=self.patient_user,
            full_name="Arun Kumar",
            phone="9876543210",
            gender="M"
        )

        # Create Staff User
        self.staff_user = User.objects.create(
            username="admin_apex",
            mobile_number="9123456780",
            first_name="Admin Apex",
            is_patient=False
        )
        self.staff_user.set_password("password123")
        self.staff_user.save()
        HospitalStaff.objects.create(
            user=self.staff_user,
            hospital=self.hospital,
            role=self.hospital_admin_role
        )

    def test_demo_checkout_completes_appointment_and_payment(self):
        client = APIClient()
        client.force_authenticate(user=self.patient_user)

        tomorrow = (datetime.date.today() + datetime.timedelta(days=1)).isoformat()
        payload = {
            "doctor_id": self.doctor.id,
            "member_id": self.member.id,
            "appointment_date": tomorrow,
            "visit_reason": "Heart palpitations",
            "payment_method": "UPI",
            "payment_reference": "arun@okaxis"
        }

        url = reverse('payment-demo-checkout')
        response = client.post(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["token"]["token_number"], 1)
        self.assertEqual(response.data["appointment"]["payment_status"], "PAID")
        self.assertEqual(response.data["appointment"]["status"], "CONFIRMED")
        self.assertEqual(response.data["payment"]["status"], "SUCCESS")
        self.assertEqual(response.data["payment"]["payment_method"], "UPI")

        # Verify DB records
        self.assertTrue(Appointment.objects.filter(doctor=self.doctor, member=self.member).exists())
        self.assertTrue(Token.objects.filter(doctor=self.doctor, member=self.member).exists())
        self.assertTrue(Payment.objects.filter(payment_method="UPI", status="SUCCESS").exists())

        # Verify doctor capacity incremented
        capacity = DailyDoctorCapacity.objects.get(doctor=self.doctor, date=tomorrow)
        self.assertEqual(capacity.allocated_count, 1)

    def test_patient_can_see_booked_appointments_in_history(self):
        # Create an appointment for patient
        appt = Appointment.objects.create(
            hospital=self.hospital,
            doctor=self.doctor,
            member=self.member,
            appointment_date=datetime.date.today(),
            visit_reason="Routine check",
            status=Appointment.STATUS_CONFIRMED,
            payment_status=Appointment.PAYMENT_PAID
        )

        client = APIClient()
        client.force_authenticate(user=self.patient_user)

        url = reverse('appointment-list')
        response = client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], appt.id)

    def test_hospital_staff_cannot_login_via_patient_otp(self):
        client = APIClient()
        # Seed cache with OTP
        from django.core.cache import cache
        cache.set(f"otp:{self.staff_user.mobile_number}", "123456", timeout=300)

        url = reverse('auth-verify-otp')
        response = client.post(url, {
            "mobile_number": self.staff_user.mobile_number,
            "otp": "123456"
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Hospital staff accounts cannot log in to the Patient portal", response.data["error"])

    def test_patient_cannot_login_via_hospital_password_portal(self):
        self.patient_user.set_password("patient123")
        self.patient_user.save()

        client = APIClient()
        url = reverse('auth-token-obtain')
        response = client.post(url, {
            "username": self.patient_user.username,
            "password": "patient123"
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Patient accounts cannot log in to the Hospital Staff portal", str(response.data))
