from rest_framework import viewsets, permissions, exceptions
from apps.doctors.models import Doctor
from apps.doctors.serializers import DoctorSerializer
from apps.roles.permissions import get_user_role_names, get_user_hospital_ids
from apps.roles.models import Role


class DoctorViewSet(viewsets.ModelViewSet):
    """
    Doctor Directory ViewSet.
    - GET: All authenticated users can read doctor list.
    - POST/PUT/PATCH/DELETE: Hospital Admin and Super Admin only.
    Allows filtering by department_id or hospital_id.
    """
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role_names = get_user_role_names(user)

        # Super Admin sees all doctors
        if Role.SUPER_ADMIN in role_names or user.is_superuser:
            queryset = Doctor.objects.all().select_related('user', 'hospital', 'department')
        elif Role.HOSPITAL_ADMIN in role_names:
            # Hospital Admin sees all doctors (active & inactive) within their assigned hospital(s)
            hospital_ids = get_user_hospital_ids(user)
            queryset = Doctor.objects.filter(hospital_id__in=hospital_ids).select_related('user', 'hospital', 'department')
        else:
            # Patients, receptionists, other staff see active doctors
            hospital_ids = get_user_hospital_ids(user)
            if hospital_ids and Role.PATIENT not in role_names:
                queryset = Doctor.objects.filter(hospital_id__in=hospital_ids, is_active=True).select_related('user', 'hospital', 'department')
            else:
                queryset = Doctor.objects.filter(is_active=True).select_related('user', 'hospital', 'department')

        department_id = self.request.query_params.get('department_id')
        hospital_id = self.request.query_params.get('hospital_id')

        if department_id:
            queryset = queryset.filter(department_id=department_id)
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)

        return queryset

    def _require_hospital_admin(self):
        """Allow Hospital Admin and Super Admin to manage doctor profiles."""
        user = self.request.user
        role_names = get_user_role_names(user)
        if Role.HOSPITAL_ADMIN in role_names or Role.SUPER_ADMIN in role_names or user.is_superuser:
            return
        raise exceptions.PermissionDenied("Only Hospital Admins can manage doctors.")

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

        # Hospital Admin can only add doctors to their own hospital
        if Role.HOSPITAL_ADMIN in role_names and not user.is_superuser and Role.SUPER_ADMIN not in role_names:
            user_hospitals = get_user_hospital_ids(user)
            if hospital and hospital.id not in user_hospitals:
                raise exceptions.PermissionDenied(
                    "You can only add doctors to your assigned hospital."
                )
            if not hospital and user_hospitals:
                serializer.save(hospital_id=user_hospitals[0])
                return
        serializer.save()

