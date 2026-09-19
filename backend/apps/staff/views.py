from rest_framework import viewsets, permissions, exceptions
from apps.staff.models import HospitalStaff
from apps.staff.serializers import HospitalStaffSerializer
from apps.roles.permissions import IsHospitalScoped, get_user_hospital_ids, get_user_role_names
from apps.roles.models import Role


class HospitalStaffViewSet(viewsets.ModelViewSet):
    """
    CRUD Endpoint for Hospital Staff.
    Strictly scoped by hospital ID:
    - Super Admin: Sees and manages all hospital staff.
    - Hospital Admin: Manages staff strictly within their assigned hospital. Cannot grant Super Admin role.
    """
    serializer_class = HospitalStaffSerializer
    permission_classes = [permissions.IsAuthenticated, IsHospitalScoped]

    def get_queryset(self):
        user = self.request.user
        role_names = get_user_role_names(user)
        
        if Role.SUPER_ADMIN in role_names or user.is_superuser:
            return HospitalStaff.objects.all().select_related('user', 'hospital', 'role')

        hospital_ids = get_user_hospital_ids(user)
        return HospitalStaff.objects.filter(hospital_id__in=hospital_ids).select_related('user', 'hospital', 'role')

    def perform_create(self, serializer):
        user = self.request.user
        role_names = get_user_role_names(user)
        hospital = serializer.validated_data.get('hospital')
        role = serializer.validated_data.get('role')

        # Hospital Admins cannot grant Super Admin role
        if role and role.name == Role.SUPER_ADMIN and Role.SUPER_ADMIN not in role_names and not user.is_superuser:
            raise exceptions.PermissionDenied("Hospital Admins cannot assign Super Admin role.")

        if Role.SUPER_ADMIN not in role_names and not user.is_superuser:
            user_hospitals = get_user_hospital_ids(user)
            if hospital and hospital.id not in user_hospitals:
                raise exceptions.PermissionDenied("You do not have permission to add staff to another hospital.")
            if not hospital and user_hospitals:
                serializer.save(hospital_id=user_hospitals[0])
                return

        serializer.save()
