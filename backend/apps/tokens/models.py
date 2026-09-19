from django.db import models
from apps.doctors.models import Doctor
from apps.appointments.models import Appointment
from apps.members.models import Member


class Token(models.Model):
    """
    Token model representing physical queue or online token numbers.
    CORE RULE: Token number is strictly unique per doctor and date.
    Online & Physical tokens draw from the doctor's DailyDoctorCapacity pool.
    """
    TYPE_ONLINE = 'ONLINE'
    TYPE_PHYSICAL = 'PHYSICAL'
    TYPE_CHOICES = [
        (TYPE_ONLINE, 'Online Token'),
        (TYPE_PHYSICAL, 'Physical Token'),
    ]

    STATUS_ISSUED = 'ISSUED'
    STATUS_IN_CONSULTATION = 'IN_CONSULTATION'
    STATUS_COMPLETED = 'COMPLETED'
    STATUS_CANCELLED = 'CANCELLED'
    STATUS_NO_SHOW = 'NO_SHOW'

    STATUS_CHOICES = [
        (STATUS_ISSUED, 'Issued'),
        (STATUS_IN_CONSULTATION, 'In Consultation'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_CANCELLED, 'Cancelled'),
        (STATUS_NO_SHOW, 'No Show'),
    ]

    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        related_name='tokens'
    )
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tokens'
    )
    member = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        related_name='tokens'
    )
    date = models.DateField(db_index=True)
    token_number = models.PositiveIntegerField()
    token_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_ONLINE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ISSUED)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tokens'
        verbose_name = 'Token'
        verbose_name_plural = 'Tokens'
        constraints = [
            models.UniqueConstraint(
                fields=['doctor', 'date', 'token_number'],
                name='unique_token_number_per_doctor_date'
            )
        ]
        indexes = [
            models.Index(fields=['doctor', 'date', 'status']),
            models.Index(fields=['member', 'date']),
        ]

    def __str__(self):
        return f"Token #{self.token_number} ({self.token_type}) for Dr. {self.doctor.user.username} on {self.date}"
