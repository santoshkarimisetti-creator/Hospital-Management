from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.tokens.models import Token
from apps.tokens.serializers import TokenSerializer
from apps.roles.permissions import get_user_role_names, get_user_hospital_ids
from apps.roles.models import Role


class TokenViewSet(viewsets.ModelViewSet):
    """
    Token Queue & Allocation ViewSet.
    - Super Admin: full access to all tokens
    - Hospital Admin / Receptionist: tokens for their assigned hospital
    - Doctor: tokens assigned to them
    - Patient: tokens linked to their registered members
    """
    serializer_class = TokenSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role_names = get_user_role_names(user)

        queryset = Token.objects.all().select_related(
            'doctor', 'doctor__user', 'doctor__hospital', 'doctor__department', 'member', 'appointment'
        )

        if Role.SUPER_ADMIN in role_names or user.is_superuser:
            pass
        elif Role.DOCTOR in role_names and not user.is_superuser:
            queryset = queryset.filter(doctor__user=user)
        elif Role.HOSPITAL_ADMIN in role_names or Role.RECEPTIONIST in role_names:
            hospital_ids = get_user_hospital_ids(user)
            queryset = queryset.filter(doctor__hospital_id__in=hospital_ids)
        elif Role.PATIENT in role_names:
            queryset = queryset.filter(member__user=user)
        else:
            queryset = queryset.none()

        date_param = self.request.query_params.get('date')
        if date_param:
            queryset = queryset.filter(date=date_param)

        doctor_id = self.request.query_params.get('doctor_id')
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)

        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        return queryset.order_by('date', 'token_number')

    @action(detail=True, methods=['post'])
    def call_token(self, request, pk=None):
        token = self.get_object()
        token.status = Token.STATUS_IN_CONSULTATION
        token.save()
        return Response({"message": f"Token #{token.token_number} called for consultation.", "token": self.get_serializer(token).data})

    @action(detail=True, methods=['post'])
    def complete_token(self, request, pk=None):
        token = self.get_object()
        token.status = Token.STATUS_COMPLETED
        token.save()
        return Response({"message": f"Token #{token.token_number} marked completed.", "token": self.get_serializer(token).data})
