import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Calendar, Search, Ticket, CheckCircle2, RotateCcw } from 'lucide-react';
import { appointmentApi } from '../../api/appointmentApi';
import { Badge } from '../../components/ui/Badge';

export const PatientHistoryPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await appointmentApi.getAppointments();
      setAppointments(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load appointment history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredHistory = appointments.filter((apt) => {
    const docName = apt.doctor_name || '';
    const memberName = apt.member_name || '';
    const reason = apt.visit_reason || '';
    return (
      docName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reason.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>My Appointment History & Tokens</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Complete history of website online bookings and counter physical appointments.
          </p>
        </div>
      </div>

      {error && <div className="alert-box alert-error">{error}</div>}

      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', maxWidth: 360 }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search by doctor, patient, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%' }}
          />
        </div>

        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading appointment history...</div>
        ) : filteredHistory.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <ClipboardList size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
            <p>No appointment records found.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Token Number</th>
                  <th>Patient Name</th>
                  <th>Consulting Doctor</th>
                  <th>Date & Visit Reason</th>
                  <th>Payment Status</th>
                  <th>Consultation Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((apt) => (
                  <tr key={apt.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Ticket size={16} color="var(--accent-blue)" />
                        <span style={{ fontWeight: 800, color: 'var(--accent-blue)' }}>
                          Token #{apt.token_number || apt.id}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700 }}>{apt.member_name || 'Patient'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{apt.doctor_name}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{apt.appointment_date}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{apt.visit_reason}</div>
                    </td>
                    <td>
                      <Badge variant={apt.payment_status === 'PAID' ? 'active' : 'inactive'}>
                        {apt.payment_status}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={apt.status === 'COMPLETED' ? 'active' : apt.status === 'REVISIT' ? 'receptionist' : 'hospital_admin'}>
                        {apt.status}
                      </Badge>
                      {apt.revisit_date && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', marginTop: '0.2rem' }}>
                          Follow-up Revisit: {apt.revisit_date}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PatientHistoryPage;
