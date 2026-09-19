from django.test import TestCase
from django.urls import reverse
from django.core.cache import cache
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

User = get_user_model()


class OTPAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.mobile = "9876543210"
        cache.clear()

    def test_send_otp_success(self):
        url = reverse('auth-send-otp')
        response = self.client.post(url, {'mobile_number': self.mobile}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('otp', response.data)
        
        # Verify OTP is saved in cache with TTL
        cached_otp = cache.get(f"otp:{self.mobile}")
        self.assertIsNotNone(cached_otp)
        self.assertEqual(cached_otp, response.data['otp'])

    def test_verify_otp_success_creates_user_and_tokens(self):
        # Send OTP
        send_url = reverse('auth-send-otp')
        send_resp = self.client.post(send_url, {'mobile_number': self.mobile}, format='json')
        otp = send_resp.data['otp']

        # Verify OTP
        verify_url = reverse('auth-verify-otp')
        verify_resp = self.client.post(verify_url, {
            'mobile_number': self.mobile,
            'otp': otp,
            'name': 'John Doe'
        }, format='json')

        self.assertEqual(verify_resp.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', verify_resp.data)
        self.assertIn('access', verify_resp.data['tokens'])
        self.assertIn('refresh', verify_resp.data['tokens'])

        # Check DB user creation
        user = User.objects.get(mobile_number=self.mobile)
        self.assertEqual(user.first_name, 'John Doe')
        self.assertTrue(user.is_patient)

        # Cache should be cleared after verification
        self.assertIsNone(cache.get(f"otp:{self.mobile}"))

    def test_verify_invalid_otp_fails(self):
        send_url = reverse('auth-send-otp')
        self.client.post(send_url, {'mobile_number': self.mobile}, format='json')

        verify_url = reverse('auth-verify-otp')
        verify_resp = self.client.post(verify_url, {
            'mobile_number': self.mobile,
            'otp': '000000'  # Wrong OTP
        }, format='json')

        self.assertEqual(verify_resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', verify_resp.data)

    def test_username_uniqueness_system_wide(self):
        # Create an existing user with username 'alice'
        User.objects.create(mobile_number="1111111111", username="alice")

        # Now try to register another user with the same username 'alice'
        send_url = reverse('auth-send-otp')
        send_resp = self.client.post(send_url, {'mobile_number': "2222222222"}, format='json')
        otp = send_resp.data['otp']

        verify_url = reverse('auth-verify-otp')
        verify_resp = self.client.post(verify_url, {
            'mobile_number': "2222222222",
            'otp': otp,
            'name': 'alice'
        }, format='json')

        self.assertEqual(verify_resp.status_code, status.HTTP_200_OK)
        # Should gracefully resolve username collision (e.g. alice_xxxx)
        user2 = User.objects.get(mobile_number="2222222222")
        self.assertNotEqual(user2.username, 'alice')
        self.assertTrue(user2.username.startswith('alice'))
