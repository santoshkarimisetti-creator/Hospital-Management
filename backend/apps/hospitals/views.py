from rest_framework import viewsets, permissions, exceptions
from apps.hospitals.models import Hospital
from apps.hospitals.serializers import HospitalSerializer
from apps.roles.permissions import IsHospitalScoped, get_user_hospital_ids, get_user_role_names
from apps.roles.models import Role


class HospitalViewSet(viewsets.ModelViewSet):
    """
    CRUD Endpoint for Hospitals.
    Hospital scoping:
    - Super Admin: Full CRUD over all hospitals.
    - Hospital Admin / Staff: Can ONLY view or update their assigned hospital. Cannot list all hospitals or create new hospitals.
    """
    serializer_class = HospitalSerializer
    permission_classes = [permissions.IsAuthenticated, IsHospitalScoped]

    def get_queryset(self):
        user = self.request.user
        role_names = get_user_role_names(user)
        
        if Role.SUPER_ADMIN in role_names or user.is_superuser:
            return Hospital.objects.all()

        hospital_ids = get_user_hospital_ids(user)
        if hospital_ids:
            return Hospital.objects.filter(id__in=hospital_ids)

        if Role.PATIENT in role_names:
            return Hospital.objects.filter(is_active=True)

        return Hospital.objects.none()

    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        user = request.user
        role_names = get_user_role_names(user)
        
        # Only Super Admin can create a hospital
        if Role.SUPER_ADMIN not in role_names and not user.is_superuser:
            raise exceptions.PermissionDenied("Creating new hospital organizations is restricted to Super Admin.")
        return super().create(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        user = request.user
        role_names = get_user_role_names(user)
        
        # Only Super Admin can delete a hospital
        if Role.SUPER_ADMIN not in role_names and not user.is_superuser:
            raise exceptions.PermissionDenied("Deleting hospital organizations is restricted to Super Admin.")
        return super().destroy(request, *args, **kwargs)
