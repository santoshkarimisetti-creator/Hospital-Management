import React, { createContext, useContext, useState } from 'react';
import { authApi } from '../api/authApi';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [demoRoleOverride, setDemoRoleOverride] = useState(() => {
    return localStorage.getItem('demoRole') || null;
  });

  const [isLoading, setIsLoading] = useState(false);

  const switchDemoRole = (role) => {
    if (role) {
      localStorage.setItem('demoRole', role);
      setDemoRoleOverride(role);
    } else {
      localStorage.removeItem('demoRole');
      setDemoRoleOverride(null);
    }
  };

  // Derive active role with demo override support for evaluation
  const activeRole = demoRoleOverride || user?.primary_role || (user?.is_superuser ? 'SUPER_ADMIN' : 'PATIENT');
  const userRoles = demoRoleOverride ? [demoRoleOverride] : (user?.roles || [activeRole]);

  const login = (userData, tokens) => {
    localStorage.setItem('token', tokens.access);
    localStorage.setItem('refreshToken', tokens.refresh);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    setIsLoading(true);
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await authApi.logout(refreshToken);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('demoRole');
    setDemoRoleOverride(null);
    setUser(null);
    setIsLoading(false);
  };

  const hasRole = (allowedRoles) => {
    if (!user) return false;
    if (!allowedRoles || allowedRoles.length === 0) return true;
    if (activeRole === 'SUPER_ADMIN' || (user.is_superuser && !demoRoleOverride)) return true;
    return allowedRoles.includes(activeRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        activeRole,
        userRoles,
        demoRoleOverride,
        switchDemoRole,
        login,
        logout,
        isAuthenticated: !!user,
        hasRole,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
