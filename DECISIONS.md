# Architecture & Design Decisions - Digital Hospital Platform

This document details the core architectural decisions, database concurrency considerations, multi-tenant security design, and production migration notes for the Digital Hospital Token & Appointment Platform backend.

---

## 1. Core Rule & Source of Truth

> **CORE RULE**: Online tokens + physical tokens share **ONE daily capacity per doctor**. The backend is the sole source of truth for token allocation, price, payment status, and credit balance.

- **Token Allocation**: Both online booking and counter physical token issuance draw from a single `DailyDoctorCapacity` pool.
- **Price & Payment**: Consultation fees, payment gateway verification, refund processing, and patient credit balances (`AppointmentCredit`) are computed, validated, and managed strictly by backend domain services. Client payload values for price or balance are never trusted.

---

## 2. Database Concurrency & SQLite3 Limitations

For full transactional integrity and row-level locking (`SELECT ... FOR UPDATE`), **PostgreSQL** is supported as the core relational database backend via `psycopg2-binary`.

### PostgreSQL Integration:
- Configured in `config/settings.py` using `django.db.backends.postgresql`.
- Environment flags: Set `USE_POSTGRES=true`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`.
- SQLite is maintained as a zero-dependency fallback for rapid offline local development.

### Production PostgreSQL Migration Strategy:
When implementing the token issuance engine, PostgreSQL will be required with explicit transactional locking:
```python
# PostgreSQL Row-Level Lock Pattern (Required in Production)
with transaction.atomic():
    capacity = DailyDoctorCapacity.objects.select_for_update().get(
        doctor=doctor,
        date=token_date
    )
    if capacity.online_allocated + capacity.physical_allocated >= capacity.total_capacity:
        raise CapacityExceededError("Doctor capacity reached for today")
    
    # Increment allocation atomically
    capacity.online_allocated += 1
    capacity.save()
```
*Note*: For high-throughput scenarios, PostgreSQL advisory locks (`pg_advisory_xact_lock(doctor_id, date_hash)`) will be used to serialize token number generation without blocking unrelated doctor capacity rows.

---

## 3. OTP Authentication & Cache Backend

### Prototype Implementation:
- Mobile-number based OTP authentication endpoints (`/api/v1/auth/send-otp/`, `/api/v1/auth/verify-otp/`).
- OTPs are stored in Django's Cache framework (`django.core.cache`) with a 300-second (5-minute) TTL.
- For prototype testing, `LocMemCache` (local memory cache) is configured in `config/settings.py`.

### Production Redis Upgrade:
- `LocMemCache` is process-bound and does not share cache state across multi-worker Gunicorn/ASGI processes or celery workers.
- **Production Requirement**: Switch cache backend to **Redis** using `django-redis`:
```python
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}
```
Redis will also back rate-limiting for OTP requests (`django-ratelimit`) to prevent SMS flooding attacks.

---

## 4. Multi-Tenant Hospital Scoping & RBAC Architecture

### Roles Supported:
1. **Super Admin**: System-wide global visibility and management.
2. **Hospital Admin**: Scoped strictly to their assigned hospital.
3. **Receptionist**: Scoped strictly to their assigned hospital.
4. **Doctor**: Scoped strictly to their assigned hospital and department.
5. **Patient**: Scoped strictly to self and linked family member records.

### Implementation Pattern:
- **`IsHospitalScoped` Permission Class**: Evaluates user identity and role.
- **Automatic Queryset Filtering**: `HospitalViewSet` and `HospitalStaffViewSet` override `get_queryset()` to filter by `get_user_hospital_ids(request.user)`.
- **Cross-Tenant Isolation Enforcement**: Requests trying to read or write objects outside a staff member's assigned hospital receive a `404 Not Found` or `403 Permission Denied`.

---

## 5. App Structure & Model Schema

The system is organized into 16 domain-oriented apps under `backend/apps/`:
- `accounts`: Custom `User` model with system-wide unique `username` and `mobile_number`.
- `roles`: `Role` and `Permission` models + `seed_roles` management command.
- `hospitals`: `Hospital` entity.
- `staff`: `HospitalStaff` mapping.
- `members`: Patient master records (`Member`) and family relationships (`Relationship`).
- `departments`: Medical departments per hospital.
- `doctors`: Doctor profiles, qualifications, and consultation fees.
- `schedules`: `DoctorSchedule` and shared `DailyDoctorCapacity`.
- `leaves`: `DoctorLeave` tracker.
- `appointments`: `Appointment` booking status.
- `tokens`: `Token` entity with strict `UniqueConstraint(doctor, date, token_number)`.
- `payments`: `Payment` and `Refund` ledgers.
- `credits`: `AppointmentCredit` wallet and `CreditTransaction` audit log.
- `notifications`: User alert notifications.
- `audit`: Compliance `AuditLog`.

---

## 6. API Documentation & Health Monitoring

- **OpenAPI 3.0 Documentation**: Auto-generated via `drf-spectacular`.
  - Swagger UI: `/api/v1/docs/`
  - Redoc: `/api/v1/redoc/`
  - Schema JSON: `/api/v1/schema/`
- **Health Check Endpoint**: `/api/v1/health/` verifies DB connection and Cache subsystem responsiveness.

---

## 7. Project Structure & Dual Frontend Architecture

### Final Directory Layout

```text
hospital_management/
├── backend/                ← Single Django backend (source of truth)
│   ├── apps/               ← 16 domain-driven Django apps
│   ├── config/             ← Django settings, URLs, WSGI/ASGI
│   ├── manage.py           ← Django CLI entry point
│   ├── db.sqlite3          ← SQLite database (dev)
│   └── requirements.txt    ← Python dependencies
├── hospital-frontend/      ← Hospital Staff portal (port 5173)
├── patient-frontend/       ← Patient portal (port 5174)
├── README.md
├── DECISIONS.md
└── DEMO_CREDENTIALS.md
```

### Dual Frontend Separation

Both frontends are **independently deployable** React applications (built with Vite) that connect to the **same backend API** and **shared database**:

- **`hospital-frontend`** (port 5173): For Super Admin, Hospital Admin, Doctors, Receptionists. Authenticates via username + password (JWT).
- **`patient-frontend`** (port 5174): For Patients. Authenticates via mobile number + OTP (JWT).

This separation ensures:
1. **Clean role boundaries**: Hospital staff never see patient-facing UI and vice versa.
2. **Independent deployment**: Each frontend can be built, versioned, and deployed independently.
3. **Security isolation**: Backend enforces cross-portal login rejection — staff cannot authenticate via OTP, patients cannot authenticate via password endpoint.

---

## 8. Portal Authentication Isolation

The backend actively prevents cross-portal authentication:

- **Hospital Staff Login** (`/api/v1/auth/token/`): Rejects users whose only role is `PATIENT` (no `HospitalStaff` or `Doctor` profile, not `is_superuser`).
- **Patient OTP Login** (`/api/v1/auth/verify-otp/`): Rejects users who have active `HospitalStaff` or `Doctor` profiles, or who are `is_superuser`.

This ensures that even if a user knows both portals exist, they cannot authenticate on the wrong one.

