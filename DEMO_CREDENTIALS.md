# ⚠️ DEMO CREDENTIALS — DEVELOPMENT ONLY — NOT FOR PRODUCTION ⚠️

> **WARNING**: These credentials are for local development and demo purposes only.
> Never use these credentials in a production environment.
> All passwords and OTPs shown here are hardcoded demo values.

---

## Hospital Staff Portal

**URL**: `http://localhost:5173`
**Authentication**: Username + Password

| Role | Name | Username | Password | Mobile |
|---|---|---|---|---|
| **Super Admin** | Super Admin | `superadmin` | `admin123` | +15550190000 |
| **Hospital Admin** | David Miller | `hosp_admin_david` | `admin123` | +15550197777 |
| **Receptionist** | Alice Vance | `receptionist_alice` | `password123` | +15550198888 |
| **Doctor** | Dr. Sarah Jenkins | `dr_sarah_jenkins` | `password123` | +1555011689 |
| **Doctor** | Dr. Robert Chen | `dr_robert_chen` | `password123` | +1555011489 |
| **Doctor** | Dr. Elena Rostova | `dr_elena_rostova` | `password123` | +15550100103 |
| **Doctor** | Dr. Marcus Vance | `dr_marcus_vance` | `password123` | +15550100104 |
| **Doctor** | Dr. Priya Sharma | `dr_priya_sharma` | `password123` | +15550100105 |
| **Doctor** | Dr. David Miller | `dr_david_miller` | `password123` | +15550100106 |
| **Doctor** | Dr. Michael Chang | `dr_michael_chang` | `password123` | +15550100107 |
| **Doctor** | Dr. Anita Roy | `dr_anita_roy` | `password123` | +15550100108 |
| **Doctor** | Dr. Jonathan Hayes | `dr_jonathan_hayes` | `password123` | +15550100109 |
| **Doctor** | Dr. Sophia Patel | `dr_sophia_patel` | `password123` | +15550100110 |

---

## Patient Portal

**URL**: `http://localhost:5174`
**Authentication**: Mobile Number + OTP

| Role | Username | Mobile Number |
|---|---|---|
| Patient | user_9876543210 | 9876543210 |
| Patient | user_9999999999 | 9999999999 |
| Patient | user_9000000000 | 9000000000 |
| Patient | user_8919841484 | 8919841484 |

### How OTP Works (Demo Mode)

1. Enter any mobile number on the Patient portal login screen.
2. Click "Send OTP" — the API returns the OTP **in the response** (prototype mode).
3. The frontend auto-fills the OTP field.
4. Click "Verify OTP" to log in.
5. If no user exists for that mobile number, a new patient account is created automatically.

> **Note**: In production, the OTP would be sent via SMS gateway and never returned in the API response.

---

## Hospital & Demo Data

| Item | Value |
|---|---|
| Hospital Name | City Central Super Specialty Hospital |
| Hospital Code | CCH-01 |
| Departments | Cardiology, Neurology, Orthopedics, Pediatrics, Dermatology |
| Doctors | 10 doctors across 5 departments |
| Doctor Capacities | 50–150 patients/day per doctor |

---

## Seeding Demo Data

To reset and re-seed the demo data:

```bash
cd backend
python manage.py seed_roles
python manage.py seed_demo_data
python manage.py createsuperuser  # Only if superadmin doesn't exist
```
