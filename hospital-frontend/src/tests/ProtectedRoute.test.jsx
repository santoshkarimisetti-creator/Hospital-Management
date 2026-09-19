import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthContext } from '../context/AuthContext';
import ProtectedRoute from '../components/guards/ProtectedRoute';

const MockComponent = ({ title }) => <div>{title}</div>;

const renderWithAuth = (initialEntry, userVal, activeRoleVal, allowedRoles = []) => {
  const contextValue = {
    user: userVal,
    activeRole: activeRoleVal,
    userRoles: userVal ? (userVal.roles || [activeRoleVal]) : [],
    isAuthenticated: !!userVal,
    hasRole: (roles) => {
      if (!userVal) return false;
      if (!roles || roles.length === 0) return true;
      if (userVal.is_superuser) return true;
      return roles.includes(activeRoleVal);
    },
  };

  return render(
    <AuthContext.Provider value={contextValue}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<MockComponent title="Login View" />} />
          <Route path="/dashboard" element={<MockComponent title="Dashboard View" />} />
          <Route element={<ProtectedRoute allowedRoles={allowedRoles} />}>
            <Route path="/hospitals" element={<MockComponent title="Hospitals Admin View" />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('ProtectedRoute Route Guard Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirects unauthenticated user to /login', () => {
    renderWithAuth('/hospitals', null, null, ['SUPER_ADMIN']);
    expect(screen.getByText('Login View')).toBeInTheDocument();
    expect(screen.queryByText('Hospitals Admin View')).not.toBeInTheDocument();
  });

  it('redirects unauthorized HOSPITAL_ADMIN away from Super Admin /hospitals to /dashboard', () => {
    const hospitalAdminUser = { id: 1, username: 'hospital_admin_user', is_superuser: false };
    renderWithAuth('/hospitals', hospitalAdminUser, 'HOSPITAL_ADMIN', ['SUPER_ADMIN']);

    expect(screen.getByText('Dashboard View')).toBeInTheDocument();
    expect(screen.queryByText('Hospitals Admin View')).not.toBeInTheDocument();
  });

  it('allows authorized SUPER_ADMIN to access /hospitals', () => {
    const superAdminUser = { id: 2, username: 'superadmin_user', is_superuser: true };
    renderWithAuth('/hospitals', superAdminUser, 'SUPER_ADMIN', ['SUPER_ADMIN']);

    expect(screen.getByText('Hospitals Admin View')).toBeInTheDocument();
  });
});
