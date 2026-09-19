from rest_framework.permissions import BasePermission, SAFE_METHODS
from apps.roles.models import Role
from apps.staff.models import HospitalStaff
from apps.doctors.models import Doctor


def get_user_hospital_ids(user):
    """
    Retrieves list of Hospital IDs associated with the user via HospitalStaff or Doctor profiles.
    """
    if not user or not user.is_authenticated:
        return []
    
    staff_hospitals = list(
        HospitalStaff.objects.filter(user=user, is_active=True).values_list('hospital_id', flat=True)
    )
    doctor_hospitals = list(
        Doctor.objects.filter(user=user, is_active=True).values_list('hospital_id', flat=True)
    )
    return list(set(staff_hospitals + doctor_hospitals))


def get_user_role_names(user):
    """
    Retrieves active role names assigned to the user.
    """
    if not user or not user.is_authenticated:
        return []
    
    if user.is_superuser:
        return [Role.SUPER_ADMIN]

    staff_roles = list(
        HospitalStaff.objects.filter(user=user, is_active=True).values_list('role__name', flat=True)
    )
    roles = set(staff_roles)

    if Doctor.objects.filter(user=user, is_active=True).exists():
        roles.add(Role.DOCTOR)
    
    if not roles:
        roles.add(Role.PATIENT)

    return list(roles)


class IsHospitalScoped(BasePermission):
    """
    DRF Permission enforcing role-based access & multi-tenant hospital scoping:
    - Super Admin: Global unrestricted access.
    - Hospital Admin / Receptionist / Doctor: Access restricted to their assigned hospital(s).
    - Patient: Access limited to self-owned data.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        role_names = get_user_role_names(request.user)
        if Role.SUPER_ADMIN in role_names or request.user.is_superuser:
            return True

        # Hospital Staff or Doctors must have an active hospital assignment
        if any(r in [Role.HOSPITAL_ADMIN, Role.RECEPTIONIST, Role.DOCTOR] for r in role_names):
            hospital_ids = get_user_hospital_ids(request.user)
            return len(hospital_ids) > 0

        # Patients are allowed for general patient endpoints
        return Role.PATIENT in role_names

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        role_names = get_user_role_names(request.user)
        if Role.SUPER_ADMIN in role_names or request.user.is_superuser:
            return True

        user_hospitals = get_user_hospital_ids(request.user)

        # Check hospital attribute on object
        if hasattr(obj, 'hospital_id'):
            return obj.hospital_id in user_hospitals
        elif hasattr(obj, 'hospital') and hasattr(obj.hospital, 'id'):
            return obj.hospital.id in user_hospitals
        elif hasattr(obj, 'id') and obj.__class__.__name__ == 'Hospital':
            return obj.id in user_hospitals

        return False
