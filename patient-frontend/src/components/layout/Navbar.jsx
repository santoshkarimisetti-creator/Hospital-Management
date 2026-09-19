import React, { useState, useEffect } from 'react';
import { LogOut, User as UserIcon, Coins } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';
import { creditApi } from '../../api/creditApi';

export const Navbar = () => {
  const { user, activeRole, demoRoleOverride, switchDemoRole, logout } = useAuth();
  const [creditsBalance, setCreditsBalance] = useState(null);

  useEffect(() => {
    if (activeRole === 'PATIENT') {
      creditApi.getWallet()
        .then((res) => {
          if (res && res.balance !== undefined) setCreditsBalance(res.balance);
          else setCreditsBalance(150);
        })
        .catch(() => setCreditsBalance(150));
    }
  }, [activeRole]);

  const getDisplayName = () => {
    if (demoRoleOverride) {
      const demoNames = {
        SUPER_ADMIN: 'Super Admin',
        HOSPITAL_ADMIN: 'Hospital Admin',
        DOCTOR: 'Dr. Sarah Jenkins',
        RECEPTIONIST: 'Reception Desk',
        PATIENT: user?.full_name || user?.username || 'Patient',
      };
      return demoNames[demoRoleOverride] || user?.username || 'User';
    }
    return user?.full_name || user?.first_name || user?.username || 'User';
  };

  const displayName = getDisplayName();

  return (
    <header className="navbar">
      {/* Left — greeting */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', border: '1px solid var(--border-color)', flexShrink: 0 }}>
          <UserIcon size={16} />
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
            {displayName}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            {user?.mobile_number || user?.username || ''}
          </div>
        </div>
      </div>

      {/* Right — controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>

        {/* Patient Credits */}
        {activeRole === 'PATIENT' && creditsBalance !== null && (
          <div className="credits-pill">
            <Coins size={14} />
            <span>{creditsBalance} Credits</span>
          </div>
        )}

        {/* Role Badge (non-patient) */}
        {activeRole !== 'PATIENT' && (
          <Badge variant={activeRole}>{activeRole.replace('_', ' ')}</Badge>
        )}

        {/* Demo Role Switcher */}
        <div className="demo-role-switcher">
          <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', fontWeight: 600 }}>Demo:</span>
          <select
            value={demoRoleOverride || ''}
            onChange={(e) => switchDemoRole(e.target.value || null)}
          >
            <option value="" style={{ background: '#161b22' }}>
              Actual ({user?.primary_role || 'PATIENT'})
            </option>
            <option value="SUPER_ADMIN"   style={{ background: '#161b22' }}>Super Admin</option>
            <option value="HOSPITAL_ADMIN"style={{ background: '#161b22' }}>Hospital Admin</option>
            <option value="DOCTOR"        style={{ background: '#161b22' }}>Doctor</option>
            <option value="RECEPTIONIST"  style={{ background: '#161b22' }}>Receptionist</option>
            <option value="PATIENT"       style={{ background: '#161b22' }}>Patient</option>
          </select>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="btn btn-ghost"
          style={{ color: 'var(--status-danger)', padding: '0.4rem 0.65rem', fontSize: '0.8rem' }}
        >
          <LogOut size={15} />
          <span style={{ marginLeft: '0.3rem' }}>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
