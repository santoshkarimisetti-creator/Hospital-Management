import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/guards/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './features/auth/LoginPage';
import PatientHomePage from './features/dashboard/PatientHomePage';
import DepartmentsManagePage from './features/departments/DepartmentsManagePage';
import DepartmentDetailPage from './features/departments/DepartmentDetailPage';
import DoctorsPage from './features/doctors/DoctorsPage';
import MembersPage from './features/members/MembersPage';
import PatientHistoryPage from './features/history/PatientHistoryPage';

export const App = () => {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Patient Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<PatientHomePage />} />

            <Route path="/departments" element={<DepartmentsManagePage />} />
            <Route path="/departments/:id" element={<DepartmentDetailPage />} />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/history" element={<PatientHistoryPage />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
