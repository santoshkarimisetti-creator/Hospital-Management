from django.core.management.base import BaseCommand
from apps.roles.models import Role


class Command(BaseCommand):
    help = 'Seeds initial system roles into the database'

    def handle(self, *args, **options):
        roles_data = [
            (Role.SUPER_ADMIN, "Super Administrator with full global platform access"),
            (Role.HOSPITAL_ADMIN, "Hospital Administrator with management access to single hospital"),
            (Role.RECEPTIONIST, "Hospital Receptionist managing desk appointments and physical tokens"),
            (Role.DOCTOR, "Doctor managing consultation queue and schedule"),
            (Role.PATIENT, "Patient accessing personal tokens and appointment history"),
        ]

        created_count = 0
        for name, desc in roles_data:
            role, created = Role.objects.get_or_create(
                name=name,
                defaults={'description': desc, 'is_system_role': True}
            )
            if created:
                created_count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded system roles ({created_count} created)."))
