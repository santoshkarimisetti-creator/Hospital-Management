from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """
    Custom User Model.
    Supports mobile number + OTP auth, system-wide unique username, and patient flag.
    """
    mobile_number = models.CharField(
        max_length=20,
        unique=True,
        db_index=True,
        help_text="Mobile number used for OTP authentication"
    )
    username = models.CharField(
        max_length=150,
        unique=True,
        db_index=True,
        help_text="System-wide unique username"
    )
    is_patient = models.BooleanField(
        default=True,
        help_text="Designates whether this user is registered as a patient"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.username} ({self.mobile_number})"
