import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Calendar, Search, CheckCircle, Clock, RotateCcw, User } from 'lucide-react';
import { appointmentApi } from '../../api/appointmentApi';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const AppointmentsPage = () => {
  const { user, activeRole } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const isDoctor = activeRole === 'DOCTOR';

  const fetchAppointments = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await appointmentApi.getAppointments({ date: selectedDate });
      setAppointments(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load appointments queue.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  const filteredAppointments = appointments.filter((apt) => {
    const name = apt.member_name || '';
    const phone = apt.member_phone || '';
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {isDoctor ? 'My Patient Appointment Queue' : 'Hospital Appointments Queue'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Appointments displayed in chronological token order (Token #1, Token #2, etc.).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Calendar size={18} color="var(--accent-blue)" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="form-input"
            style={{ width: 'auto', padding: '0.5rem 0.75rem' }}
          />
        </div>
      </div>

      {error && <div className="alert-box alert-error">{error}</div>}

      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', maxWidth: 360 }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search patient name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%' }}
          />
        </div>

        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading chronological queue...</div>
        ) : filteredAppointments.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <ClipboardList size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
            <p>No appointments found for {selectedDate}.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Token Order</th>
                  <th>Patient Details</th>
                  <th>Consulting Doctor</th>
                  <th>Reason for Visit</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((apt, idx) => (
                  <tr key={apt.id}>
                    <td>
                      <span style={{ fontWeight: 800, color: 'var(--accent-blue)', background: 'rgba(56, 189, 248, 0.1)', padding: '0.35rem 0.75rem', borderRadius: 8, fontSize: '0.9rem' }}>
                        Token #{apt.token_number || idx + 1}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{apt.member_name || 'Patient'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {apt.member_phone} ({apt.member_gender === 'M' ? 'Male' : 'Female'})
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{apt.doctor_name}</td>
                    <td style={{ fontSize: '0.85rem' }}>{apt.visit_reason}</td>
                    <td>
                      <Badge variant={apt.payment_status === 'PAID' ? 'active' : 'inactive'}>
                        {apt.payment_status}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={apt.status === 'COMPLETED' ? 'active' : apt.status === 'REVISIT' ? 'receptionist' : 'hospital_admin'}>
                        {apt.status}
                      </Badge>
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

export default AppointmentsPage;
