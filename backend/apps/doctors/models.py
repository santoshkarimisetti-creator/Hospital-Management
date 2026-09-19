from django.db import models
from django.conf import settings
from apps.hospitals.models import Hospital
from apps.departments.models import Department


class Doctor(models.Model):
    """
    Doctor entity linked to a User account, Hospital, and Department.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='doctor_profiles'
    )
    hospital = models.ForeignKey(
        Hospital,
        on_delete=models.CASCADE,
        related_name='doctors'
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name='doctors'
    )
    qualification = models.CharField(max_length=255, blank=True, default='')
    specialization = models.CharField(max_length=255, blank=True, default='')
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    daily_capacity_limit = models.IntegerField(default=60, help_text="Doctor default daily appointment token limit")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'doctors'
        verbose_name = 'Doctor'
        verbose_name_plural = 'Doctors'
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'hospital'],
                name='unique_doctor_per_hospital'
            )
        ]
        indexes = [
            models.Index(fields=['hospital', 'department']),
            models.Index(fields=['hospital', 'is_active']),
        ]

    def __str__(self):
        return f"Dr. {self.user.get_full_name() or self.user.username} ({self.department.name} - {self.hospital.name})"
