# Digital Hospital Token & Appointment Platform

A full-stack prototype for hospital token management, online appointment booking, and demo payment processing. Built with Django REST Framework backend and two independent React (Vite) frontends.

---

## Project Architecture

```text
hospital_management/
├── backend/                 ← Django REST API (single source of truth)
│   ├── apps/                ← Domain-driven Django apps (16 apps)
│   ├── config/              ← Django settings, URLs, WSGI/ASGI
│   ├── manage.py            ← Django CLI entry point
│   ├── db.sqlite3           ← SQLite database (dev)
│   └── requirements.txt     ← Python dependencies
├── hospital-frontend/       ← Hospital Staff portal (React/Vite, port 5173)
│   └── src/
├── patient-frontend/        ← Patient portal (React/Vite, port 5174)
│   └── src/
├── README.md
├── DECISIONS.md             ← Architecture & design decisions
└── DEMO_CREDENTIALS.md      ← Demo login accounts
```

### Shared Backend & Database

Both frontends connect to the **same Django backend** (`http://localhost:8000`) and share the **same database**. They are independently deployable and run on separate ports.

```
┌──────────────────┐     ┌──────────────────┐
│ Hospital Frontend│     │ Patient Frontend  │
│   (port 5173)    │     │   (port 5174)     │
└────────┬─────────┘     └────────┬──────────┘
         │                        │
         └──────────┬─────────────┘
                    │
          ┌─────────▼──────────┐
          │   Django Backend   │
          │   (port 8000)      │
          │   ┌────────────┐   │
          │   │  Database  │   │
          │   │  (SQLite)  │   │
          │   └────────────┘   │
          └────────────────────┘
```

---

## Authentication Flows

### Hospital Staff Portal (port 5173)
- **Method**: Username + Password (JWT)
- **Users**: Super Admin, Hospital Admin, Doctors, Receptionists
- **Endpoint**: `POST /api/v1/auth/token/`
- Patient-only accounts are **rejected** at this endpoint.

### Patient Portal (port 5174)
- **Method**: Mobile Number + OTP (JWT)
- **Users**: Patients only
- **Endpoints**: `POST /api/v1/auth/send-otp/` → `POST /api/v1/auth/verify-otp/`
- Hospital staff accounts are **rejected** at this endpoint.
- New patients are auto-registered on first OTP verification.

> **Demo mode**: OTP is returned in the API response for testing. In production, it would be sent via SMS.

---

## User Roles & Permissions

| Role | Scope | Portal |
|---|---|---|
| **Super Admin** | Global — all hospitals, staff, data | Hospital |
| **Hospital Admin** | Scoped to assigned hospital | Hospital |
| **Receptionist** | Scoped to assigned hospital | Hospital |
| **Doctor** | Scoped to assigned hospital + own schedule | Hospital |
| **Patient** | Own records + family members | Patient |

---

## Feature Status

### ✅ Completed

**Backend**
- Custom User model with mobile number + username authentication
- Role-based access control (RBAC) with 5 system roles
- Multi-tenant hospital scoping (Hospital Admin sees only their hospital)
- 16 domain-driven Django apps (accounts, roles, hospitals, staff, departments, doctors, schedules, leaves, appointments, tokens, payments, credits, members, notifications, audit)
- Hospital, Department, Doctor CRUD with capacity management
- Doctor schedule & leave management
- Patient member/family management
- Appointment booking with token generation
- Demo payment processing (UPI, Card, QR)
- Daily doctor capacity tracking (online + physical tokens)
- OTP authentication with cache-based storage
- JWT authentication with token refresh & blacklisting
- OpenAPI 3.0 documentation (Swagger UI + ReDoc)
- Health check endpoint
- Cross-portal login rejection (staff ↔ patient isolation)
- RBAC automated tests (14 tests)

**Hospital Frontend**
- Login with username + password
- Role-based sidebar navigation (sections hidden for unauthorized roles)
- Dashboard with hospital statistics
- Hospital management (Super Admin)
- Staff management (Super Admin, Hospital Admin)
- Department management with doctor listings
- Doctor management with qualifications & capacity
- Schedule & leave management
- Appointment management
- Patient/member browsing
- Visit history

**Patient Frontend**
- Login with mobile number + OTP (auto-fill in demo mode)
- Patient dashboard with upcoming appointments
- Department browsing with doctor listings
- Doctor browsing with real-time capacity
- Family member management (Self, Spouse, Children, Parents)
- Full appointment booking flow:
  - Select Doctor → Select Member → Select Date → Payment
- Demo payment methods (UPI Apps, Credit/Debit Card, QR Code)
- Payment simulator with success confirmation
- Token generation on booking confirmation
- Appointment history with token and payment details

### 🚧 In Progress

- UI polish and responsive design refinements
- Enhanced error handling across frontends

### 📋 Planned

- Real SMS gateway integration (replacing demo OTP)
- Real payment gateway integration (replacing demo payments)
- Redis cache backend for production OTP storage
- PostgreSQL migration for production (row-level locking)
- Notification system (SMS/email appointment reminders)
- Doctor rating and reviews
- Prescription management
- Medical records
- Audit log viewer (admin)
- Credit wallet management UI

### ⚠️ Known Issues

- OTP is returned in the API response (prototype only — must be removed for production)
- SQLite does not support `SELECT ... FOR UPDATE` (must use PostgreSQL for production concurrency)
- Token number uniqueness relies on application-level logic (needs DB-level advisory locks in production)
- Demo payment is simulated — no real payment processing

---

## Appointment & Token Workflow

1. **Patient** selects a doctor, family member, and appointment date
2. **Patient** chooses payment method (UPI / Card / QR)
3. **Demo payment** is processed (simulated success)
4. **Backend** atomically:
   - Creates `Appointment` (status=CONFIRMED, payment_status=PAID)
   - Increments `DailyDoctorCapacity.online_allocated`
   - Generates unique `Token` number for the day
   - Creates `Payment` record with transaction ID
5. **Patient** receives confirmation with token number, doctor, date, and transaction ID
6. **Hospital staff** (receptionist/doctor) can view the appointment immediately

---

## Database & Models

The backend uses 16 Django apps organized by domain:

| App | Key Models | Purpose |
|---|---|---|
| `accounts` | `User` | Custom user with mobile_number, is_patient |
| `roles` | `Role`, `Permission` | System roles (5 predefined) |
| `hospitals` | `Hospital` | Hospital entity |
| `staff` | `HospitalStaff` | Staff ↔ Hospital ↔ Role mapping |
| `departments` | `Department` | Hospital departments |
| `doctors` | `Doctor` | Doctor profiles, fees, capacity |
| `schedules` | `DoctorSchedule`, `DailyDoctorCapacity` | Schedule & daily capacity tracking |
| `leaves` | `DoctorLeave` | Doctor leave management |
| `appointments` | `Appointment` | Booking records |
| `tokens` | `Token` | Queue token numbers |
| `payments` | `Payment`, `Refund` | Payment transactions |
| `credits` | `AppointmentCredit`, `CreditTransaction` | Patient credit wallet |
| `members` | `Member`, `Relationship` | Patient family profiles |
| `notifications` | `Notification` | User alerts |
| `audit` | `AuditLog` | Compliance logging |

---

## API Structure

**Base URL**: `http://localhost:8000/api/v1/`

| Endpoint | Description |
|---|---|
| `auth/token/` | Hospital staff JWT login (username + password) |
| `auth/token/refresh/` | JWT token refresh |
| `auth/send-otp/` | Patient OTP request |
| `auth/verify-otp/` | Patient OTP verification + JWT |
| `auth/me/` | Current user profile |
| `auth/logout/` | JWT blacklist |
| `hospitals/` | Hospital CRUD |
| `staff/` | Hospital staff management |
| `departments/` | Department CRUD |
| `doctors/` | Doctor CRUD |
| `schedules/` | Doctor schedules |
| `capacities/` | Daily doctor capacity |
| `leaves/` | Doctor leave management |
| `appointments/` | Appointment management |
| `tokens/` | Token queue management |
| `members/` | Patient member/family profiles |
| `payments/` | Payment transactions |
| `payments/{id}/demo_checkout/` | Demo payment + appointment creation |
| `credits/` | Patient credit wallet |
| `health/` | System health check |
| `schema/` | OpenAPI 3.0 schema (JSON) |
| `docs/` | Swagger UI |
| `redoc/` | ReDoc documentation |

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DJANGO_SETTINGS_MODULE` | `config.settings` | Django settings module |
| `USE_POSTGRES` | `false` | Set `true` to use PostgreSQL instead of SQLite |
| `DB_NAME` | `hospital_db` | PostgreSQL database name |
| `DB_USER` | `postgres` | PostgreSQL username |
| `DB_PASSWORD` | `postgres` | PostgreSQL password |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |

---

## Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_roles
python manage.py seed_demo_data
python manage.py createsuperuser  # Create super admin (username: superadmin, password: admin123)
```

### Frontend Setup

```bash
# Hospital Frontend
cd hospital-frontend
npm install

# Patient Frontend
cd patient-frontend
npm install
```

---

## Running the Application

### 1. Start Backend (port 8000)

```bash
cd backend
python manage.py runserver
```

### 2. Start Hospital Frontend (port 5173)

```bash
cd hospital-frontend
npm run dev
```

### 3. Start Patient Frontend (port 5174)

```bash
cd patient-frontend
npm run dev
```

### All Three Services

Run each command in a separate terminal. All three must be running simultaneously for the full experience.

---

## Running Tests

### Backend Tests

```bash
cd backend
python manage.py test --verbosity=2
```

### Frontend Build Verification

```bash
cd hospital-frontend && npm run build
cd patient-frontend && npm run build
```

---

## Deployment Notes

- Both frontends can be built as static assets (`npm run build`) and served via any static file server or CDN.
- The backend can be deployed with Gunicorn/uWSGI behind Nginx.
- For production, switch to PostgreSQL and Redis (see [DECISIONS.md](DECISIONS.md)).
- CORS is currently set to `ALLOW_ALL_ORIGINS = True` — must be restricted in production.

---

## Demo Credentials

See [DEMO_CREDENTIALS.md](DEMO_CREDENTIALS.md) for all working demo accounts.

---

## Current Development Phase

This project is a **functional prototype** demonstrating the full appointment booking and token management workflow. The core backend API, authentication flows, RBAC, and both frontends are operational. The demo payment flow simulates the full end-to-end booking experience without real payment gateway integration.

**Next major milestones:**
1. Real SMS gateway for OTP delivery
2. Real payment gateway integration
3. PostgreSQL + Redis for production deployment
4. Enhanced notification system
5. Medical records & prescription management
