from django.db import models
from apps.appointments.models import Appointment


class Payment(models.Model):
    """
    Payment transaction record for an appointment.
    CORE RULE: Backend is sole source of truth for payment status and price.
    """
    METHOD_ONLINE = 'ONLINE'
    METHOD_UPI = 'UPI'
    METHOD_CARD = 'CARD'
    METHOD_QR = 'QR'
    METHOD_CASH = 'CASH'
    METHOD_CREDIT_WALLET = 'CREDIT_WALLET'

    METHOD_CHOICES = [
        (METHOD_ONLINE, 'Online Payment Gateway'),
        (METHOD_UPI, 'UPI Apps (GPay / PhonePe / Paytm)'),
        (METHOD_CARD, 'Credit / Debit Card'),
        (METHOD_QR, 'QR Code Scanner'),
        (METHOD_CASH, 'Cash at Desk'),
        (METHOD_CREDIT_WALLET, 'Appointment Credit Wallet'),
    ]

    STATUS_PENDING = 'PENDING'
    STATUS_SUCCESS = 'SUCCESS'
    STATUS_FAILED = 'FAILED'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_SUCCESS, 'Success'),
        (STATUS_FAILED, 'Failed'),
    ]

    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=30, choices=METHOD_CHOICES, default=METHOD_ONLINE)
    transaction_id = models.CharField(max_length=100, unique=True, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payments'
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        indexes = [
            models.Index(fields=['appointment', 'status']),
            models.Index(fields=['transaction_id']),
        ]

    def __str__(self):
        return f"Payment #{self.transaction_id} - {self.amount} ({self.status})"


class Refund(models.Model):
    """
    Refund record for cancelled/refunded payments or tokens.
    """
    STATUS_PENDING = 'PENDING'
    STATUS_PROCESSED = 'PROCESSED'
    STATUS_REJECTED = 'REJECTED'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_PROCESSED, 'Processed'),
        (STATUS_REJECTED, 'Rejected'),
    ]

    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name='refunds'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'refunds'
        verbose_name = 'Refund'
        verbose_name_plural = 'Refunds'

    def __str__(self):
        return f"Refund for Payment #{self.payment.transaction_id}: {self.amount} ({self.status})"
