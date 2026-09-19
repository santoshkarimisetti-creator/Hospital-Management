from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from apps.hospitals.models import Hospital
from apps.roles.models import Role
from apps.staff.models import HospitalStaff

User = get_user_model()


class RBACScopingTests(TestCase):
    def setUp(self):
        # Create Roles
        self.super_admin_role = Role.objects.create(name=Role.SUPER_ADMIN, is_system_role=True)
        self.hospital_admin_role = Role.objects.create(name=Role.HOSPITAL_ADMIN, is_system_role=True)
        self.receptionist_role = Role.objects.create(name=Role.RECEPTIONIST, is_system_role=True)

        # Create Hospitals
        self.hospital_a = Hospital.objects.create(name="City Hospital A", code="HOSP_A")
        self.hospital_b = Hospital.objects.create(name="Metro Hospital B", code="HOSP_B")

        # Create Users
        self.super_admin_user = User.objects.create(
            username="superadmin", mobile_number="1000000000", is_superuser=True
        )
        self.admin_a_user = User.objects.create(
            username="admin_hospital_a", mobile_number="2000000000", is_patient=False
        )
        self.admin_b_user = User.objects.create(
            username="admin_hospital_b", mobile_number="3000000000", is_patient=False
        )

        # Assign Hospital Admin A to Hospital A
        self.staff_a = HospitalStaff.objects.create(
            user=self.admin_a_user,
            hospital=self.hospital_a,
            role=self.hospital_admin_role
        )

        # Assign Hospital Admin B to Hospital B
        self.staff_b = HospitalStaff.objects.create(
            user=self.admin_b_user,
            hospital=self.hospital_b,
            role=self.hospital_admin_role
        )

    def test_super_admin_can_access_all_hospitals(self):
        client = APIClient()
        client.force_authenticate(user=self.super_admin_user)

        url = reverse('hospital-list')
        response = client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_hospital_admin_can_list_assigned_hospitals_only(self):
        client = APIClient()
        client.force_authenticate(user=self.admin_a_user)

        # Hospital Admin sees only their assigned hospital (Hospital A), not Hospital B
        url = reverse('hospital-list')
        response = client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['code'], 'HOSP_A')

    def test_hospital_admin_can_access_own_hospital_detail(self):
        client = APIClient()
        client.force_authenticate(user=self.admin_a_user)

        # Hospital Admin A can retrieve their own hospital detail
        url = reverse('hospital-detail', kwargs={'pk': self.hospital_a.id})
        response = client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], 'HOSP_A')

    def test_hospital_admin_a_cannot_access_hospital_b_detail(self):
        client = APIClient()
        client.force_authenticate(user=self.admin_a_user)

        # Try accessing Hospital B directly
        url = reverse('hospital-detail', kwargs={'pk': self.hospital_b.id})
        response = client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_hospital_admin_a_cannot_see_hospital_b_staff(self):
        client = APIClient()
        client.force_authenticate(user=self.admin_a_user)

        url = reverse('hospital-staff-list')
        response = client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['user'], self.admin_a_user.id)

    def test_hospital_admin_a_cannot_add_staff_to_hospital_b(self):
        client = APIClient()
        client.force_authenticate(user=self.admin_a_user)

        new_user = User.objects.create(username="receptionist_b", mobile_number="4000000000")

        url = reverse('hospital-staff-list')
        payload = {
            "user": new_user.id,
            "hospital": self.hospital_b.id,
            "role": self.receptionist_role.id
        }
        response = client.post(url, payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
