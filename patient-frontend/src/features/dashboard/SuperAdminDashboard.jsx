import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Stethoscope, Users, ShieldCheck,
  Activity, TrendingUp, Globe, UserCheck,
} from 'lucide-react';
import { hospitalApi } from '../../api/hospitalApi';
import { doctorApi } from '../../api/doctorApi';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';

export const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      hospitalApi.getHospitals().catch(() => []),
      doctorApi.getDoctors().catch(() => []),
    ]).then(([h, d]) => {
      setHospitals(h);
      setDoctors(d);
    }).finally(() => setIsLoading(false));
  }, []);

  const stats = [
    { label: 'Total Hospitals', value: hospitals.length, Icon: Building2, color: 'var(--accent-primary)', desc: 'Registered on platform' },
    { label: 'Total Doctors', value: doctors.length, Icon: Stethoscope, color: 'var(--status-warning)', desc: 'Active across all hospitals' },
    { label: 'Active Departments', value: doctors.reduce((acc, d) => { if (d.department_name && !acc.includes(d.department_name)) acc.push(d.department_name); return acc; }, []).length, Icon: Globe, color: '#8b5cf6', desc: 'Unique departments in system' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform Overview</h1>
          <p className="page-subtitle">MedFlow OS — Global monitoring dashboard for Super Admin.</p>
        </div>
        <Badge variant="super_admin">Super Admin</Badge>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</span>
              <div className="icon-box" style={{ background: 'rgba(255,255,255,0.05)', color: s.color }}>
                <s.Icon size={18} />
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>
              {isLoading ? '—' : s.value}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Hospital List */}
      <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building2 size={16} color="var(--accent-primary)" /> Registered Hospitals
        </h2>
        {isLoading ? (
          <div className="loading-state" style={{ padding: '1.5rem' }}><div className="spinner" /></div>
        ) : hospitals.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No hospitals registered yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hospital Name</th>
                  <th>City / Location</th>
                  <th>Doctors</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {hospitals.map((h) => {
                  const hDoctors = doctors.filter(d => d.hospital === h.id || d.hospital_name === h.name);
                  return (
                    <tr key={h.id}>
                      <td style={{ fontWeight: 600 }}>{h.name}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{h.city || h.address || '—'}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{hDoctors.length}</span>
                      </td>
                      <td><Badge variant="active">Active</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info callout */}
      <div className="alert-box alert-info">
        <ShieldCheck size={16} />
        <div>
          <strong>Super Admin Scope</strong> — You have platform-level visibility. To manage a hospital's departments, doctors, or appointments, the assigned <strong>Hospital Admin</strong> must perform those actions from their account.
        </div>
      </div>
    </motion.div>
  );
};

export default SuperAdminDashboard;
