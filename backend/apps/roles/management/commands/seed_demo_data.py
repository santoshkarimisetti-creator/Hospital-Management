from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.hospitals.models import Hospital
from apps.departments.models import Department
from apps.doctors.models import Doctor
from apps.roles.models import Role
from apps.staff.models import HospitalStaff
from apps.credits.models import AppointmentCredit

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds realistic demo data with 10 doctors across 5 departments, varied token capacities, staff, and credits.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Starting Demo Data Seeding..."))

        # 1. Create or get Primary Hospital
        hospital, _ = Hospital.objects.get_or_create(
            name="City Central Super Specialty Hospital",
            defaults={
                'code': 'CCH-01',
                'address': '100 Medical Center Drive, Metro City',
                'phone': '+1 (555) 019-2831',
                'email': 'admin@citycentralhospital.org',
                'is_active': True,
            }
        )

        # 2. Create 5 Departments
        dept_data = [
            ("Cardiology", "Heart diseases, blood pressure, and cardiovascular health."),
            ("Neurology", "Brain, nerve system, stroke, and spinal conditions."),
            ("Orthopedics", "Bone fractures, joint replacements, and sports injuries."),
            ("Pediatrics", "Infant care, child development, and adolescent medicine."),
            ("Dermatology", "Skin disorders, cosmetic procedures, and allergy treatment."),
        ]

        departments = {}
        for name, desc in dept_data:
            code = name[:3].upper()
            dept, _ = Department.objects.get_or_create(
                hospital=hospital,
                name=name,
                defaults={'code': code, 'is_active': True}
            )
            departments[name] = dept

        # 3. Define 10 Realistic Doctors with distinct capacities (60, 50, 80, 100, 150)
        doctors_info = [
            # Cardiology
            {
                "username": "dr_sarah_jenkins",
                "first_name": "Sarah",
                "last_name": "Jenkins",
                "dept": "Cardiology",
                "qualification": "MBBS, MD, FACC (Cardiology)",
                "specialization": "Interventional Cardiology & Coronary Angioplasty",
                "fee": 120.00,
                "limit": 60,
            },
            {
                "username": "dr_robert_chen",
                "first_name": "Robert",
                "last_name": "Chen",
                "dept": "Cardiology",
                "qualification": "MBBS, DM (Cardiology)",
                "specialization": "Heart Failure & Cardiac Arrhythmias",
                "fee": 150.00,
                "limit": 50,
            },
            # Neurology
            {
                "username": "dr_elena_rostova",
                "first_name": "Elena",
                "last_name": "Rostova",
                "dept": "Neurology",
                "qualification": "MD, DNB (Neurology)",
                "specialization": "Stroke Rehabilitation & Epilepsy Specialist",
                "fee": 140.00,
                "limit": 80,
            },
            {
                "username": "dr_marcus_vance",
                "first_name": "Marcus",
                "last_name": "Vance",
                "dept": "Neurology",
                "qualification": "MBBS, MD (Neuro-Medicine)",
                "specialization": "Parkinson's Disease & Headache Disorders",
                "fee": 110.00,
                "limit": 100,
            },
            # Orthopedics
            {
                "username": "dr_priya_sharma",
                "first_name": "Priya",
                "last_name": "Sharma",
                "dept": "Orthopedics",
                "qualification": "MS (Orthopedics), MCh",
                "specialization": "Joint Replacement & Arthroscopic Surgery",
                "fee": 100.00,
                "limit": 150,
            },
            {
                "username": "dr_david_miller",
                "first_name": "David",
                "last_name": "Miller",
                "dept": "Orthopedics",
                "qualification": "MBBS, MS (Ortho)",
                "specialization": "Trauma, Spine Injuries & Fractures",
                "fee": 90.00,
                "limit": 60,
            },
            # Pediatrics
            {
                "username": "dr_michael_chang",
                "first_name": "Michael",
                "last_name": "Chang",
                "dept": "Pediatrics",
                "qualification": "MD (Pediatrics), DCH",
                "specialization": "Neonatal Intensive Care & Pediatric Development",
                "fee": 85.00,
                "limit": 100,
            },
            {
                "username": "dr_anita_roy",
                "first_name": "Anita",
                "last_name": "Roy",
                "dept": "Pediatrics",
                "qualification": "MBBS, DCH (Child Health)",
                "specialization": "Childhood Immunization & Allergy Care",
                "fee": 80.00,
                "limit": 80,
            },
            # Dermatology
            {
                "username": "dr_jonathan_hayes",
                "first_name": "Jonathan",
                "last_name": "Hayes",
                "dept": "Dermatology",
                "qualification": "MD (Dermatology, Venereology)",
                "specialization": "Psoriasis, Laser Surgery & Medical Cosmetics",
                "fee": 110.00,
                "limit": 50,
            },
            {
                "username": "dr_sophia_patel",
                "first_name": "Sophia",
                "last_name": "Patel",
                "dept": "Dermatology",
                "qualification": "MBBS, DVD (Dermatology)",
                "specialization": "Acne Treatment, Eczema & Hair Loss Therapy",
                "fee": 95.00,
                "limit": 150,
            },
        ]

        doc_role, _ = Role.objects.get_or_create(name=Role.DOCTOR, defaults={'description': 'Doctor Role'})

        for idx, d_info in enumerate(doctors_info, start=101):
            user, created = User.objects.get_or_create(
                username=d_info["username"],
                defaults={
                    'first_name': d_info["first_name"],
                    'last_name': d_info["last_name"],
                    'mobile_number': f"+15550100{idx}",
                    'is_staff': True,
                }
            )
            if created or not user.check_password('password123'):
                user.set_password('password123')
                user.save()

            dept = departments[d_info["dept"]]

            doctor, _ = Doctor.objects.get_or_create(
                user=user,
                hospital=hospital,
                defaults={
                    'department': dept,
                    'qualification': d_info["qualification"],
                    'specialization': d_info["specialization"],
                    'consultation_fee': d_info["fee"],
                    'daily_capacity_limit': d_info["limit"],
                    'is_active': True,
                }
            )
            # Update limit if doctor already existed
            doctor.daily_capacity_limit = d_info["limit"]
            doctor.department = dept
            doctor.consultation_fee = d_info["fee"]
            doctor.save()

            # Ensure Staff Role assignment
            HospitalStaff.objects.get_or_create(
                user=user,
                hospital=hospital,
                defaults={'role': doc_role, 'is_active': True}
            )

        # 4. Create Receptionist & Admin Staff
        rec_user, _ = User.objects.get_or_create(
            username="receptionist_alice",
            defaults={'first_name': "Alice", 'last_name': "Vance", 'mobile_number': "+15550198888"}
        )
        rec_role, _ = Role.objects.get_or_create(name=Role.RECEPTIONIST, defaults={'description': 'Receptionist'})
        HospitalStaff.objects.get_or_create(user=rec_user, hospital=hospital, defaults={'role': rec_role})

        admin_user, _ = User.objects.get_or_create(
            username="hosp_admin_david",
            defaults={'first_name': "David", 'last_name': "Miller", 'mobile_number': "+15550197777"}
        )
        admin_role, _ = Role.objects.get_or_create(name=Role.HOSPITAL_ADMIN, defaults={'description': 'Hospital Admin'})
        HospitalStaff.objects.get_or_create(user=admin_user, hospital=hospital, defaults={'role': admin_role})

        # 5. Initialize Patient Credit Accounts
        for patient in User.objects.filter(is_superuser=False):
            AppointmentCredit.objects.get_or_create(user=patient, defaults={'balance': 150.00})

        self.stdout.write(self.style.SUCCESS("Demo Data successfully seeded with 10 Doctors across 5 Departments!"))
