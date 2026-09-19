import React from 'react';
import { useAuth } from '../../context/AuthContext';
import SuperAdminDashboard from './SuperAdminDashboard';
import PatientHomePage from './PatientHomePage';
import HospitalDashboard from './HospitalDashboard';

export const DashboardPage = () => {
  const { activeRole } = useAuth();

  if (activeRole === 'SUPER_ADMIN') return <SuperAdminDashboard />;
  if (activeRole === 'PATIENT')    return <PatientHomePage />;
  return <HospitalDashboard />;
};

export default DashboardPage;
