import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Search, User, Stethoscope, Clock,
  Hash, ChevronDown, ChevronUp, FileText, CheckCircle2, RefreshCw,
} from 'lucide-react';
import { appointmentApi } from '../../api/appointmentApi';
import { Badge } from '../../components/ui/Badge';

const STATUS_CONFIG = {
  confirmed:  { label: 'Confirmed',  variant: 'active' },
  completed:  { label: 'Completed',  variant: 'active' },
  revisit:    { label: 'Revisit',    variant: 'pending' },
  cancelled:  { label: 'Cancelled',  variant: 'inactive' },
  pending:    { label: 'Pending',    variant: 'pending' },
};

const getStatusConfig = (s) => STATUS_CONFIG[s?.toLowerCase()] || { label: s || 'Unknown', variant: 'pending' };

export const VisitHistoryPage = () => {
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0]; // today
  });
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const fetchVisits = async (date) => {
    setIsLoading(true);
    setError('');
    setSearched(true);
    try {
      const data = await appointmentApi.getAppointmentsByDate(date);
      setAppointments(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load visit history.');
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-load today on mount
  useState(() => { fetchVisits(selectedDate); }, []);

  const filtered = appointments.filter((a) => {
    const q = searchTerm.toLowerCase();
    return !q ||
      (a.member_name || '').toLowerCase().includes(q) ||
      (a.doctor_name || '').toLowerCase().includes(q) ||
      (a.department_name || '').toLowerCase().includes(q) ||
      (a.visit_reason || '').toLowerCase().includes(q);
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Daily Visit History</h1>
          <p className="page-subtitle">View all patient visits for a selected date. Filter and review appointment details.</p>
        </div>
      </div>

      {/* Date Picker + Search Row */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
        <div className="form-group" style={{ margin: 0, flexDirection: 'row', alignItems: 'center', gap: '0.75rem' }}>
          <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Select Date</label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              className="form-input"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ width: 170 }}
            />
            <button
              className="btn btn-primary"
              onClick={() => fetchVisits(selectedDate)}
              disabled={isLoading}
            >
              <Calendar size={15} />
              {isLoading ? 'Loading…' : 'Load Visits'}
            </button>
          </div>
        </div>

        {searched && appointments.length > 0 && (
          <div className="search-bar" style={{ flex: 1, minWidth: 220 }}>
            <Search size={15} color="var(--text-dim)" />
            <input
              placeholder="Filter by patient, doctor, department…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

      {error && <div className="alert-box alert-error">{error}</div>}

      {/* Summary stats */}
      {searched && !isLoading && (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {[
            { label: 'Total Visits', value: appointments.length, color: 'var(--accent-primary)' },
            { label: 'Completed', value: appointments.filter(a => a.status === 'completed').length, color: 'var(--status-success)' },
            { label: 'Pending', value: appointments.filter(a => a.status === 'confirmed').length, color: 'var(--status-warning)' },
            { label: 'Revisit', value: appointments.filter(a => a.status === 'revisit').length, color: 'var(--status-info)' },
          ].map((s) => (
            <div key={s.label} className="stat-card" style={{ padding: '0.85rem 1.25rem', flex: '1 0 120px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="loading-state"><div className="spinner" /><span>Loading visits…</span></div>
      ) : searched && filtered.length === 0 ? (
        <div className="empty-state">
          <Calendar size={40} style={{ opacity: 0.3 }} />
          <p>{appointments.length === 0 ? `No visits recorded on ${selectedDate}.` : 'No results match your filter.'}</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Token</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Department</th>
                  <th>Visit Reason</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((appt, idx) => {
                  const { label, variant } = getStatusConfig(appt.status);
                  const isExpanded = expandedId === appt.id;
                  return (
                    <React.Fragment key={appt.id}>
                      <tr style={{ cursor: 'pointer' }} onClick={() => setExpandedId(isExpanded ? null : appt.id)}>
                        <td style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>{idx + 1}</td>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.95rem' }}>
                            <Hash size={12} style={{ verticalAlign: 'middle' }} />{appt.token_number || '—'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <User size={14} color="var(--accent-primary)" />
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{appt.member_name}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{appt.member_phone}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.875rem' }}>{appt.doctor_name}</td>
                        <td>
                          <Badge variant="hospital_admin" style={{ fontSize: '0.72rem' }}>
                            {appt.department_name || '—'}
                          </Badge>
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {appt.visit_reason || '—'}
                        </td>
                        <td><Badge variant={variant}>{label}</Badge></td>
                        <td>
                          {isExpanded ? <ChevronUp size={15} color="var(--text-dim)" /> : <ChevronDown size={15} color="var(--text-dim)" />}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={8} style={{ padding: 0 }}>
                            <div style={{ background: 'var(--bg-hover)', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-muted)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                              <div>
                                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>Patient Details</div>
                                <div style={{ fontSize: '0.85rem' }}>{appt.member_name} · {appt.member_gender || '—'}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{appt.member_phone}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>Appointment</div>
                                <div style={{ fontSize: '0.85rem' }}>ID #{appt.id} · Token #{appt.token_number || '—'}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Booked: {new Date(appt.created_at).toLocaleDateString()}</div>
                              </div>
                              {appt.visit_notes && (
                                <div style={{ gridColumn: '1/-1' }}>
                                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>Visit Notes</div>
                                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{appt.visit_notes}</div>
                                </div>
                              )}
                              {appt.revisit_date && (
                                <div>
                                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>Revisit Date</div>
                                  <div style={{ fontSize: '0.85rem', color: 'var(--status-warning)', fontWeight: 600 }}>{appt.revisit_date}</div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default VisitHistoryPage;
