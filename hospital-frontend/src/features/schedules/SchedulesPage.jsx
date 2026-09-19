import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarOff, Clock, AlertCircle, Stethoscope, ShieldCheck } from 'lucide-react';
import { leaveApi } from '../../api/leaveApi';
import { doctorApi } from '../../api/doctorApi';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { TakeLeaveModal } from './TakeLeaveModal';

export const SchedulesPage = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [doctorsData, leavesData] = await Promise.all([
        doctorApi.getDoctors(),
        leaveApi.getLeaves(),
      ]);
      setDoctors(doctorsData);
      setLeaves(leavesData);

      if (doctorsData.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(doctorsData[0].id.toString());
        setSelectedDoctor(doctorsData[0]);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load doctor schedule and leave records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDoctorChange = (id) => {
    setSelectedDoctorId(id);
    const doc = doctors.find((d) => d.id.toString() === id.toString());
    setSelectedDoctor(doc);
  };

  const handleSaveLeave = async (leaveData) => {
    try {
      await leaveApi.createLeave(leaveData);
      setIsLeaveModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to schedule doctor leave.');
    }
  };

  const handleDeleteLeave = async (id) => {
    if (!window.confirm('Cancel this doctor leave schedule?')) return;
    try {
      await leaveApi.deleteLeave(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to cancel leave.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Doctor Schedules & Absence Leaves</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            View doctor independent token capacities and manage scheduled absence leaves.
          </p>
        </div>
        <Button variant="danger" icon={CalendarOff} onClick={() => setIsLeaveModalOpen(true)}>
          Schedule Doctor Leave
        </Button>
      </div>

      {error && <div className="alert-box alert-error">{error}</div>}

      {/* Doctor Selection & Capacity Card */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <label className="form-label" style={{ marginBottom: '0.3rem' }}>Select Consulting Doctor</label>
            <select
              value={selectedDoctorId}
              onChange={(e) => handleDoctorChange(e.target.value)}
              className="form-select"
              style={{ minWidth: 280, fontWeight: 700 }}
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.doctor_name} ({d.department_name} — Limit: {d.daily_capacity_limit || 60})
                </option>
              ))}
            </select>
          </div>

          {selectedDoctor && (
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Daily Capacity Limit</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                  {selectedDoctor.daily_capacity_limit || 60} Appointments
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Today Booked</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                  {selectedDoctor.today_capacity_display || '0/60'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Doctor Leaves Table */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CalendarOff size={18} color="var(--accent-rose)" />
          <span>Scheduled Absence Leaves</span>
        </h3>

        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading leave records...</div>
        ) : leaves.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <AlertCircle size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
            <p>No active doctor leaves scheduled.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave.id}>
                    <td style={{ fontWeight: 700 }}>{leave.doctor_name}</td>
                    <td>{leave.start_date}</td>
                    <td>{leave.end_date}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{leave.reason || 'Personal Leave'}</td>
                    <td>
                      <Badge variant={leave.is_approved ? 'active' : 'inactive'}>
                        {leave.is_approved ? 'Unavailable (On Leave)' : 'Pending'}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleDeleteLeave(leave.id)}
                        style={{ padding: '0.35rem 0.65rem', color: 'var(--accent-rose)', borderRadius: 6, background: 'rgba(244, 63, 94, 0.1)', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        Cancel Leave
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TakeLeaveModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onSave={handleSaveLeave}
        doctorId={selectedDoctorId || 1}
      />
    </motion.div>
  );
};

export default SchedulesPage;
