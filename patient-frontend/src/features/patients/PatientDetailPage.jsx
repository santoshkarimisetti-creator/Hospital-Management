import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, User, Phone, MapPin, Calendar, Stethoscope,
  Building, Hash, FileText, CheckCircle2, RefreshCw, Clock,
  AlertCircle,
} from 'lucide-react';
import { appointmentApi } from '../../api/appointmentApi';
import { Badge } from '../../components/ui/Badge';

const STATUS_CONFIG = {
  confirmed:  { label: 'Confirmed',  variant: 'active',    Icon: Clock },
  completed:  { label: 'Completed',  variant: 'active',    Icon: CheckCircle2 },
  revisit:    { label: 'Revisit',    variant: 'pending',   Icon: RefreshCw },
  cancelled:  { label: 'Cancelled',  variant: 'inactive',  Icon: AlertCircle },
  pending:    { label: 'Pending',    variant: 'pending',   Icon: Clock },
};

const getStatusConfig = (s) => STATUS_CONFIG[s?.toLowerCase()] || { label: s || 'Unknown', variant: 'pending', Icon: Clock };

export const PatientDetailPage = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await appointmentApi.getAppointmentsByMember(memberId);
        setAppointments(data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load patient history.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [memberId]);

  if (isLoading) {
    return <div className="loading-state" style={{ paddingTop: '4rem' }}><div className="spinner" /><span>Loading patient history…</span></div>;
  }

  // Extract patient info from first appointment
  const patient = appointments[0] || null;
  const patientName = patient?.member_name || `Member #${memberId}`;
  const patientPhone = patient?.member_phone || '—';
  const patientGender = patient?.member_gender || '—';
  const patientAddress = patient?.member_address || '—';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: '1.25rem', paddingLeft: 0 }}>
        <ArrowLeft size={16} /> Back to Patients
      </button>

      {error && <div className="alert-box alert-error">{error}</div>}

      {/* Patient Profile Card */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-light)', border: '2px solid var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User size={24} color="var(--accent-primary)" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.01em' }}>{patientName}</h1>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
              <Badge variant="patient">Patient</Badge>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Member #{memberId}</span>
            </div>
          </div>
        </div>
        <div className="section-divider" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Phone size={15} color="var(--accent-primary)" />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Phone</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{patientPhone}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={15} color="var(--accent-primary)" />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Gender</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'capitalize' }}>{patientGender}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={15} color="var(--accent-primary)" />
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Visits</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{appointments.length}</div>
            </div>
          </div>
          {patientAddress && patientAddress !== '—' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={15} color="var(--accent-primary)" />
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Address</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{patientAddress}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Visit History */}
      <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FileText size={17} color="var(--accent-primary)" /> Complete Visit History
      </h2>

      {appointments.length === 0 ? (
        <div className="empty-state">
          <Calendar size={40} style={{ opacity: 0.3 }} />
          <p>No appointment history found for this patient.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {appointments.map((appt, idx) => {
            const { label, variant, Icon: StatusIcon } = getStatusConfig(appt.status);
            const isLatest = idx === 0;
            return (
              <motion.div
                key={appt.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                style={{ display: 'flex', gap: '1rem' }}
              >
                {/* Timeline line */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: isLatest ? 'var(--accent-primary)' : 'var(--bg-hover)', border: `2px solid ${isLatest ? 'var(--accent-primary)' : 'var(--border-color)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <StatusIcon size={14} color={isLatest ? '#fff' : 'var(--text-muted)'} />
                  </div>
                  {idx < appointments.length - 1 && (
                    <div style={{ width: 2, flex: 1, background: 'var(--border-muted)', marginTop: '0.25rem', minHeight: 24 }} />
                  )}
                </div>

                {/* Visit card */}
                <div className="glass-panel" style={{ flex: 1, padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '0', border: isLatest ? '1px solid var(--border-highlight)' : '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.65rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={13} color="var(--accent-primary)" />
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{appt.appointment_date}</span>
                        {isLatest && <Badge variant="active" style={{ fontSize: '0.65rem' }}>Latest</Badge>}
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Stethoscope size={12} /> {appt.doctor_name}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Building size={12} /> {appt.department_name || '—'}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Hash size={12} /> Token {appt.token_number || '—'}
                        </span>
                      </div>
                    </div>
                    <Badge variant={variant}>{label}</Badge>
                  </div>

                  {appt.visit_reason && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.15rem' }}>Visit Reason</span>
                      {appt.visit_reason}
                    </div>
                  )}

                  {appt.visit_notes && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.15rem' }}>Doctor's Notes</span>
                      {appt.visit_notes}
                    </div>
                  )}

                  {appt.revisit_date && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                      <RefreshCw size={12} color="var(--status-warning)" />
                      <span style={{ color: 'var(--status-warning)', fontWeight: 600 }}>Revisit scheduled: {appt.revisit_date}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default PatientDetailPage;
