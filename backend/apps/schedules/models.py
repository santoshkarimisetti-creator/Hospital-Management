from django.db import models
from apps.doctors.models import Doctor


class DoctorSchedule(models.Model):
    """
    Weekly standard schedule pattern for a doctor.
    """
    DAY_CHOICES = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]

    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        related_name='weekly_schedules'
    )
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    slot_duration_minutes = models.IntegerField(default=15)
    max_daily_capacity = models.PositiveIntegerField(default=30)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'doctor_schedules'
        verbose_name = 'Doctor Schedule'
        verbose_name_plural = 'Doctor Schedules'
        constraints = [
            models.UniqueConstraint(
                fields=['doctor', 'day_of_week'],
                name='unique_schedule_per_doctor_day'
            )
        ]

    def __str__(self):
        return f"{self.doctor} - {self.get_day_of_week_display()} ({self.start_time}-{self.end_time})"


class DailyDoctorCapacity(models.Model):
    """
    Tracks total daily capacity and shared allocation between online and physical tokens.
    CORE RULE: Online tokens + physical tokens share ONE daily capacity per doctor.
    """
    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        related_name='daily_capacities'
    )
    date = models.DateField(db_index=True)
    total_capacity = models.PositiveIntegerField()
    online_allocated = models.PositiveIntegerField(default=0)
    physical_allocated = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'daily_doctor_capacities'
        verbose_name = 'Daily Doctor Capacity'
        verbose_name_plural = 'Daily Doctor Capacities'
        constraints = [
            models.UniqueConstraint(
                fields=['doctor', 'date'],
                name='unique_capacity_per_doctor_date'
            )
        ]
        indexes = [
            models.Index(fields=['doctor', 'date']),
        ]

    @property
    def allocated_count(self):
        return self.online_allocated + self.physical_allocated

    @property
    def remaining_capacity(self):
        return self.total_capacity - self.allocated_count

    def __str__(self):
        return f"{self.doctor} on {self.date}: {self.allocated_count}/{self.total_capacity}"
