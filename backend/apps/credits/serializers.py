from rest_framework import serializers
from apps.credits.models import AppointmentCredit, CreditTransaction


class AppointmentCreditSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AppointmentCredit
        fields = ('id', 'user', 'username', 'balance', 'updated_at')
        read_only_fields = ('id', 'user', 'updated_at')


class CreditTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditTransaction
        fields = ('id', 'credit_account', 'amount', 'transaction_type', 'reference_type', 'reference_id', 'created_at')
        read_only_fields = ('id', 'created_at')
