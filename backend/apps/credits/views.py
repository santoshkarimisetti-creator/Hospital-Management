from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.credits.models import AppointmentCredit, CreditTransaction
from apps.credits.serializers import AppointmentCreditSerializer, CreditTransactionSerializer


class AppointmentCreditViewSet(viewsets.ModelViewSet):
    """
    CRUD and wallet viewset for Patient Appointment Credits.
    """
    serializer_class = AppointmentCreditSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_superuser:
            return AppointmentCredit.objects.all()
        return AppointmentCredit.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def wallet(self, request):
        """
        Returns or initializes the logged-in user's credit wallet balance.
        Default balance for demo users: 150.00 Credits.
        """
        credit, created = AppointmentCredit.objects.get_or_create(
            user=request.user,
            defaults={'balance': 150.00}
        )
        serializer = self.get_serializer(credit)
        return Response(serializer.data, status=status.HTTP_200_OK)
