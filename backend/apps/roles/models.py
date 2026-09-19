from django.db import models


class Permission(models.Model):
    """
    Fine-grained permission for RBAC enforcement.
    """
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=100, unique=True, db_index=True)
    description = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'permissions'
        verbose_name = 'Permission'
        verbose_name_plural = 'Permissions'

    def __str__(self):
        return f"{self.name} ({self.code})"


class Role(models.Model):
    """
    System and custom roles (Super Admin, Hospital Admin, Receptionist, Doctor, Patient).
    """
    SUPER_ADMIN = 'SUPER_ADMIN'
    HOSPITAL_ADMIN = 'HOSPITAL_ADMIN'
    RECEPTIONIST = 'RECEPTIONIST'
    DOCTOR = 'DOCTOR'
    PATIENT = 'PATIENT'

    SYSTEM_ROLE_CHOICES = [
        (SUPER_ADMIN, 'Super Admin'),
        (HOSPITAL_ADMIN, 'Hospital Admin'),
        (RECEPTIONIST, 'Receptionist'),
        (DOCTOR, 'Doctor'),
        (PATIENT, 'Patient'),
    ]

    name = models.CharField(max_length=50, unique=True, db_index=True)
    description = models.TextField(blank=True, default='')
    is_system_role = models.BooleanField(default=True)
    permissions = models.ManyToManyField(Permission, blank=True, related_name='roles')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'roles'
        verbose_name = 'Role'
        verbose_name_plural = 'Roles'

    def __str__(self):
        return self.name
