from rest_framework import viewsets, permissions
from apps.members.models import Member, Relationship
from apps.members.serializers import MemberSerializer


class MemberViewSet(viewsets.ModelViewSet):
    """
    CRUD Endpoint for Patient Family Members / Dependent Patient Profiles.
    Scoped strictly to the authenticated user.
    """
    serializer_class = MemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Member.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        member = serializer.save(user=self.request.user)
        rel_type = self.request.data.get('relationship_type', 'FAMILY')
        Relationship.objects.get_or_create(
            member=member,
            related_to_user=self.request.user,
            defaults={'relationship_type': rel_type}
        )
