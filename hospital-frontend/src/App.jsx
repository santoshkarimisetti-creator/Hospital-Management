import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/guards/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/dashboard/DashboardPage';
import HospitalsPage from './features/hospitals/HospitalsPage';
import StaffPage from './features/staff/StaffPage';
import SchedulesPage from './features/schedules/SchedulesPage';
import AppointmentsPage from './features/appointments/AppointmentsPage';
import PatientsPage from './features/patients/PatientsPage';
import DoctorsPage from './features/doctors/DoctorsPage';
import DepartmentsManagePage from './features/departments/DepartmentsManagePage';
import DepartmentDetailPage from './features/departments/DepartmentDetailPage';
import VisitHistoryPage from './features/history/VisitHistoryPage';
import PatientDetailPage from './features/patients/PatientDetailPage';
import GenericPlaceholderPage from './features/placeholders/GenericPlaceholderPage';

export const App = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Authenticated Staff Shell */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Department Detail Page */}
            <Route path="/departments/:id" element={<DepartmentDetailPage />} />

            {/* Super Admin Only */}
            <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
              <Route path="/hospitals" element={<HospitalsPage />} />
            </Route>

            {/* Admin Only */}
            <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN']} />}>
              <Route path="/staff"   element={<StaffPage />} />
              <Route path="/credits" element={<GenericPlaceholderPage title="Credit Wallets" description="Manage patient appointment credit balances." roles={['SUPER_ADMIN', 'HOSPITAL_ADMIN']} />} />
              <Route path="/reports" element={<GenericPlaceholderPage title="Analytics & Reports" description="Token throughput, occupancy, and financial reports." roles={['SUPER_ADMIN', 'HOSPITAL_ADMIN']} />} />
            </Route>

            {/* Departments — Hospital Admin, Receptionist */}
            <Route element={<ProtectedRoute allowedRoles={['HOSPITAL_ADMIN', 'RECEPTIONIST']} />}>
              <Route path="/departments" element={<DepartmentsManagePage />} />
            </Route>

            {/* Doctors — Hospital Admin, Receptionist, Doctor */}
            <Route element={<ProtectedRoute allowedRoles={['HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR']} />}>
              <Route path="/doctors" element={<DoctorsPage />} />
            </Route>

            {/* Schedules & Leaves — Hospital Admin, Doctor */}
            <Route element={<ProtectedRoute allowedRoles={['HOSPITAL_ADMIN', 'DOCTOR']} />}>
              <Route path="/schedules" element={<SchedulesPage />} />
              <Route path="/leaves"    element={<SchedulesPage />} />
            </Route>

            {/* Receptionist & Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['HOSPITAL_ADMIN', 'RECEPTIONIST']} />}>
              <Route path="/visit-history" element={<VisitHistoryPage />} />
              <Route path="/payments"      element={<GenericPlaceholderPage title="Counter & Online Payments" description="Process cash payments at reception desks and track gateway transactions." roles={['HOSPITAL_ADMIN', 'RECEPTIONIST']} />} />
              <Route path="/tokens"        element={<GenericPlaceholderPage title="Token Allocation Queue" description="Manage counter physical token queue." roles={['HOSPITAL_ADMIN', 'RECEPTIONIST']} />} />
            </Route>

            {/* Appointments & Patients — Hospital Admin, Receptionist, Doctor */}
            <Route element={<ProtectedRoute allowedRoles={['HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR']} />}>
              <Route path="/appointments"        element={<AppointmentsPage />} />
              <Route path="/patients"            element={<PatientsPage />} />
              <Route path="/patients/:memberId"  element={<PatientDetailPage />} />
            </Route>
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
