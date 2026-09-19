import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Building, Stethoscope, Users,
  ClipboardList, Heart, CalendarCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
  const { user } = useAuth();

  const patientNavItems = [
    { label: 'Home',        path: '/dashboard',   icon: LayoutDashboard },
    { label: 'Departments', path: '/departments', icon: Building },
    { label: 'Doctors',     path: '/doctors',     icon: Stethoscope },
    { label: 'My Members',  path: '/members',     icon: Users },
    { label: 'My Visits',   path: '/history',     icon: ClipboardList },
  ];

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-header">
        <div className="brand-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
          <Heart size={17} />
        </div>
        <div>
          <div className="brand-title">MedFlow Care</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '1px' }}>
            Patient Portal
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-group-title">
          Patient Services
        </div>
        {patientNavItems.map((item) => {
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
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.25rem', fontWeight: 600 }}>
          {user?.first_name || user?.username || 'Patient Account'}
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textAlign: 'center' }}>
          Patient Portal v2.0
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
