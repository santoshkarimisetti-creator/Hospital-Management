from django.db import models
from django.conf import settings


class AppointmentCredit(models.Model):
    """
    Patient credit balance wallet.
    CORE RULE: Backend is sole source of truth for credit balance.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='credit_account'
    )
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'appointment_credits'
        verbose_name = 'Appointment Credit'
        verbose_name_plural = 'Appointment Credits'

    def __str__(self):
        return f"Credit Account ({self.user.username}): {self.balance}"


class CreditTransaction(models.Model):
    """
    Audit ledger of all credit additions (refunds/top-ups) and debits (token payments).
    """
    TYPE_CREDIT = 'CREDIT'
    TYPE_DEBIT = 'DEBIT'

    TRANSACTION_TYPE_CHOICES = [
        (TYPE_CREDIT, 'Credit (Add)'),
        (TYPE_DEBIT, 'Debit (Deduct)'),
    ]

    credit_account = models.ForeignKey(
        AppointmentCredit,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPE_CHOICES)
    reference_type = models.CharField(max_length=50, blank=True, default='')
    reference_id = models.CharField(max_length=100, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'credit_transactions'
        verbose_name = 'Credit Transaction'
        verbose_name_plural = 'Credit Transactions'
        indexes = [
            models.Index(fields=['credit_account', 'created_at']),
        ]

    def __str__(self):
        return f"{self.transaction_type} {self.amount} for {self.credit_account.user.username}"
