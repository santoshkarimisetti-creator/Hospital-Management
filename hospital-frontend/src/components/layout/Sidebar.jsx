import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users, Building,
  Stethoscope, Calendar, CalendarOff, Ticket,
  ClipboardList, UserCheck, CreditCard, Wallet,
  BarChart3, Heart, Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
  const { activeRole } = useAuth();

  // Navigation items strictly mapped to staff roles
  // If user does not have role permission, item is COMPLETELY HIDDEN
  const navItems = [
    { label: 'Dashboard',      path: '/dashboard',     icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR'] },
    { label: 'Hospitals',      path: '/hospitals',     icon: Building2,       roles: ['SUPER_ADMIN'] },
    { label: 'Hospital Staff', path: '/staff',         icon: Users,           roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN'] },
    { label: 'Departments',    path: '/departments',   icon: Building,        roles: ['HOSPITAL_ADMIN', 'RECEPTIONIST'] },
    { label: 'Doctors',        path: '/doctors',       icon: Stethoscope,     roles: ['HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR'] },
    { label: 'Schedules',      path: '/schedules',     icon: Calendar,        roles: ['HOSPITAL_ADMIN', 'DOCTOR'] },
    { label: 'Leaves',         path: '/leaves',        icon: CalendarOff,     roles: ['HOSPITAL_ADMIN', 'DOCTOR'] },
    { label: 'Token Queue',    path: '/tokens',        icon: Ticket,          roles: ['HOSPITAL_ADMIN', 'RECEPTIONIST'] },
    { label: 'Appointments',   path: '/appointments',  icon: ClipboardList,   roles: ['HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR'] },
    { label: 'Daily Visits',   path: '/visit-history', icon: Clock,           roles: ['HOSPITAL_ADMIN', 'RECEPTIONIST'] },
    { label: 'Patients',       path: '/patients',      icon: UserCheck,       roles: ['HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR'] },
    { label: 'Payments',       path: '/payments',      icon: CreditCard,      roles: ['HOSPITAL_ADMIN', 'RECEPTIONIST'] },
    { label: 'Credits Wallet', path: '/credits',       icon: Wallet,          roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN'] },
    { label: 'Reports',        path: '/reports',       icon: BarChart3,       roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN'] },
  ];

  const visibleNavItems = navItems.filter((item) =>
    item.roles.includes(activeRole)
  );

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-header">
        <div className="brand-icon">
          <Heart size={17} />
        </div>
        <div>
          <div className="brand-title">MedFlow OS</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '1px' }}>
            Hospital Staff Portal
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-group-title">
          Staff Navigation
        </div>
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-color)', flexShrink: 0 }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textAlign: 'center' }}>
          Hospital Portal · {activeRole?.replace('_', ' ')}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
