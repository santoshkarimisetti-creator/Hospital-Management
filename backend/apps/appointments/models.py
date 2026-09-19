from django.db import models
from apps.hospitals.models import Hospital
from apps.doctors.models import Doctor
from apps.members.models import Member


class Appointment(models.Model):
    """
    Appointment booking record linking a Patient Member to a Doctor and Hospital.
    Supports visit reason, visit status, and revisit tracking.
    """
    STATUS_PENDING = 'PENDING'
    STATUS_CONFIRMED = 'CONFIRMED'
    STATUS_COMPLETED = 'COMPLETED'
    STATUS_REVISIT = 'REVISIT'
    STATUS_CANCELLED = 'CANCELLED'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_CONFIRMED, 'Confirmed'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_REVISIT, 'Revisit Scheduled'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    PAYMENT_PENDING = 'PENDING'
    PAYMENT_PAID = 'PAID'
    PAYMENT_REFUNDED = 'REFUNDED'

    PAYMENT_STATUS_CHOICES = [
        (PAYMENT_PENDING, 'Pending'),
        (PAYMENT_PAID, 'Paid'),
        (PAYMENT_REFUNDED, 'Refunded'),
    ]

    hospital = models.ForeignKey(
        Hospital,
        on_delete=models.CASCADE,
        related_name='appointments'
    )
    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        related_name='appointments'
    )
    member = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        related_name='appointments'
    )
    appointment_date = models.DateField(db_index=True)
    visit_reason = models.CharField(max_length=255, blank=True, default='General Consultation')
    visit_notes = models.TextField(blank=True, default='')
    revisit_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default=PAYMENT_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'appointments'
        verbose_name = 'Appointment'
        verbose_name_plural = 'Appointments'
        indexes = [
            models.Index(fields=['hospital', 'appointment_date']),
            models.Index(fields=['doctor', 'appointment_date']),
            models.Index(fields=['member', 'status']),
        ]

    def __str__(self):
        return f"Appt #{self.id}: {self.member.full_name} with {self.doctor} on {self.appointment_date}"
