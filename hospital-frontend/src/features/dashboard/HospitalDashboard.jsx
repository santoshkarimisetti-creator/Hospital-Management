import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Stethoscope, Calendar, ClipboardList, UserCheck, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/Badge';

const ROLE_CONFIG = {
  HOSPITAL_ADMIN: {
    title: 'Hospital Dashboard',
    subtitle: 'Manage your hospital — departments, doctors, staff, and appointments.',
    stats: [
      { label: 'Manage Doctors',    icon: Stethoscope,   color: 'var(--status-warning)',  tip: 'Add and update doctor profiles' },
      { label: 'Daily Visits',      icon: Calendar,      color: 'var(--accent-primary)',  tip: 'View visit history by date' },
      { label: 'Appointments',      icon: ClipboardList, color: 'var(--status-success)',  tip: 'Track all booked appointments' },
    ],
  },
  DOCTOR: {
    title: 'Doctor Portal',
    subtitle: 'Manage your appointments, patient records, and leave schedule.',
    stats: [
      { label: "Today's Patients",  icon: UserCheck,     color: 'var(--status-success)',  tip: 'View your queue for today' },
      { label: 'Appointments',      icon: ClipboardList, color: 'var(--accent-primary)',  tip: 'All booked appointments' },
      { label: 'Schedules',         icon: Clock,         color: 'var(--status-warning)',  tip: 'Your availability schedule' },
    ],
  },
  RECEPTIONIST: {
    title: 'Reception Desk',
    subtitle: 'Manage walk-in tokens, appointments, and patient check-ins.',
    stats: [
      { label: 'Token Allocation',  icon: ClipboardList, color: 'var(--status-success)',  tip: 'Issue walk-in tokens' },
      { label: 'Appointments',      icon: Calendar,      color: 'var(--accent-primary)',  tip: 'View & manage appointments' },
      { label: 'Visit History',     icon: Clock,         color: 'var(--status-warning)',  tip: 'Check visits by date' },
    ],
  },
};

export const HospitalDashboard = () => {
  const { user, activeRole } = useAuth();
  const config = ROLE_CONFIG[activeRole] || ROLE_CONFIG.HOSPITAL_ADMIN;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{config.title}</h1>
          <p className="page-subtitle">{config.subtitle}</p>
        </div>
        <Badge variant={activeRole}>{activeRole.replace('_', ' ')}</Badge>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        {config.stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</span>
                <div className="icon-box" style={{ background: 'rgba(255,255,255,0.05)', color: s.color }}>
                  <Icon size={18} />
                </div>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{s.tip}</div>
            </div>
          );
        })}
      </div>

      <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
          <Activity size={16} color="var(--accent-primary)" />
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Welcome back, {user?.first_name || user?.username}</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.7 }}>
          Use the navigation on the left to access your hospital sections. All access is enforced and scoped to your assigned hospital by the backend.
        </p>
      </div>
    </motion.div>
  );
};

export default HospitalDashboard;
