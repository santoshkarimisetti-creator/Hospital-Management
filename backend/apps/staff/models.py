from django.db import models
from django.conf import settings
from apps.hospitals.models import Hospital
from apps.roles.models import Role


class HospitalStaff(models.Model):
    """
    Mapping model connecting Users to Hospitals with specific system Roles.
    Enforces tenant scoping for staff (Hospital Admin, Receptionist, Doctor).
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='hospital_staff_assignments'
    )
    hospital = models.ForeignKey(
        Hospital,
        on_delete=models.CASCADE,
        related_name='staff_members'
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.PROTECT,
        related_name='staff_assignments'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hospital_staff'
        verbose_name = 'Hospital Staff'
        verbose_name_plural = 'Hospital Staff'
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'hospital'],
                name='unique_user_per_hospital'
            )
        ]
        indexes = [
            models.Index(fields=['user', 'hospital']),
            models.Index(fields=['hospital', 'role']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.hospital.name} ({self.role.name})"
