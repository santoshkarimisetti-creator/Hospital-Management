from django.db import models
from apps.hospitals.models import Hospital


class Department(models.Model):
    """
    Medical Department within a Hospital (e.g., Cardiology, Orthopedics).
    """
    hospital = models.ForeignKey(
        Hospital,
        on_delete=models.CASCADE,
        related_name='departments'
    )
    name = models.CharField(max_length=150, db_index=True)
    code = models.CharField(max_length=50, blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'departments'
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'
        constraints = [
            models.UniqueConstraint(
                fields=['hospital', 'name'],
                name='unique_department_per_hospital'
            )
        ]
        indexes = [
            models.Index(fields=['hospital', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} - {self.hospital.name}"
