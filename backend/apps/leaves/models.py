from django.db import models
from apps.doctors.models import Doctor


class DoctorLeave(models.Model):
    """
    Tracks doctor leaves to prevent token issuance during absent days.
    """
    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        related_name='leaves'
    )
    start_date = models.DateField(db_index=True)
    end_date = models.DateField(db_index=True)
    reason = models.TextField(blank=True, default='')
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'doctor_leaves'
        verbose_name = 'Doctor Leave'
        verbose_name_plural = 'Doctor Leaves'
        indexes = [
            models.Index(fields=['doctor', 'start_date', 'end_date']),
        ]

    def __str__(self):
        return f"{self.doctor} leave: {self.start_date} to {self.end_date}"
