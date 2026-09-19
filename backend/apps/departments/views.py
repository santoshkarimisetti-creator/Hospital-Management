from rest_framework import viewsets, permissions, exceptions
from apps.departments.models import Department
from apps.departments.serializers import DepartmentSerializer
from apps.roles.permissions import IsHospitalScoped, get_user_role_names, get_user_hospital_ids
from apps.roles.models import Role


class DepartmentViewSet(viewsets.ModelViewSet):
    """
    Department ViewSet.
    - GET (list/retrieve): All authenticated users (patients, doctors, receptionists, admins).
    - POST/PUT/PATCH/DELETE: Hospital Admin and Super Admin only.
    """
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role_names = get_user_role_names(user)

        # Super Admin sees all departments
        if Role.SUPER_ADMIN in role_names or user.is_superuser:
            return Department.objects.all().select_related('hospital')

        # Hospital-scoped staff see only their hospital departments
        hospital_ids = get_user_hospital_ids(user)
        if hospital_ids:
            return Department.objects.filter(hospital_id__in=hospital_ids).select_related('hospital')

        # Patients and others see all active departments (read-only anyway)
        return Department.objects.filter(is_active=True).select_related('hospital')

    def _require_hospital_admin(self):
        """Allow Hospital Admin and Super Admin to manage hospital departments."""
        user = self.request.user
        role_names = get_user_role_names(user)
        if Role.HOSPITAL_ADMIN in role_names or Role.SUPER_ADMIN in role_names or user.is_superuser:
            return  # allowed
        raise exceptions.PermissionDenied(
            "Only Hospital Admins can manage departments."
        )

    def create(self, request, *args, **kwargs):
        self._require_hospital_admin()
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        self._require_hospital_admin()
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        self._require_hospital_admin()
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        self._require_hospital_admin()
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
        user = self.request.user
        role_names = get_user_role_names(user)
        hospital = serializer.validated_data.get('hospital')

        # Hospital Admin can only create departments in their own hospital
        if Role.HOSPITAL_ADMIN in role_names and not user.is_superuser and Role.SUPER_ADMIN not in role_names:
            user_hospitals = get_user_hospital_ids(user)
            if hospital and hospital.id not in user_hospitals:
                raise exceptions.PermissionDenied(
                    "You can only manage departments within your assigned hospital."
                )
            if not hospital and user_hospitals:
                serializer.save(hospital_id=user_hospitals[0])
                return
        serializer.save()
