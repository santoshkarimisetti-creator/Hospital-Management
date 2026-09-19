from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from config.views import HealthCheckView
from apps.hospitals.views import HospitalViewSet
from apps.staff.views import HospitalStaffViewSet
from apps.departments.views import DepartmentViewSet
from apps.doctors.views import DoctorViewSet
from apps.schedules.views import DoctorScheduleViewSet, DailyDoctorCapacityViewSet
from apps.leaves.views import DoctorLeaveViewSet
from apps.appointments.views import AppointmentViewSet
from apps.members.views import MemberViewSet
from apps.credits.views import AppointmentCreditViewSet
from apps.payments.views import PaymentViewSet
from apps.tokens.views import TokenViewSet

router = DefaultRouter()
router.register(r'hospitals', HospitalViewSet, basename='hospital')
router.register(r'staff', HospitalStaffViewSet, basename='hospital-staff')
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'doctors', DoctorViewSet, basename='doctor')
router.register(r'schedules', DoctorScheduleViewSet, basename='doctor-schedule')
router.register(r'capacities', DailyDoctorCapacityViewSet, basename='daily-capacity')
router.register(r'leaves', DoctorLeaveViewSet, basename='doctor-leave')
router.register(r'appointments', AppointmentViewSet, basename='appointment')
router.register(r'members', MemberViewSet, basename='member')
router.register(r'credits', AppointmentCreditViewSet, basename='credit')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'tokens', TokenViewSet, basename='token')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API v1 Endpoints
    path('api/v1/health/', HealthCheckView.as_view(), name='health-check'),
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/', include(router.urls)),

    # Auto-generated API Documentation (drf-spectacular)
    path('api/v1/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/v1/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/v1/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
