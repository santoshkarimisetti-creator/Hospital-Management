import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserCheck, CheckCircle2, RotateCcw, Search, Clock, FileText } from 'lucide-react';
import { appointmentApi } from '../../api/appointmentApi';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { RevisitModal } from './RevisitModal';

export const PatientsPage = () => {
  const { activeRole } = useAuth();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isRevisitModalOpen, setIsRevisitModalOpen] = useState(false);

  const fetchPatients = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await appointmentApi.getAppointments();
      setPatients(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load patient consultation records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleMarkCompleted = async (id) => {
    try {
      await appointmentApi.markCompleted(id);
      fetchPatients();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to mark visit completed.');
    }
  };

  const handleOpenRevisitModal = (patient) => {
    setSelectedPatient(patient);
    setIsRevisitModalOpen(true);
  };

  const handleSaveRevisit = async (id, revisitDate, notes) => {
    await appointmentApi.markRevisit(id, revisitDate, notes);
    fetchPatients();
  };

  const filteredPatients = patients.filter((p) => {
    const name = p.member_name || '';
    const phone = p.member_phone || '';
    const reason = p.visit_reason || '';
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Doctor Patient Consultation Records</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Patient details, visit reasons, clinical status, and historical revisit tracking.
          </p>
        </div>
      </div>

      {error && <div className="alert-box alert-error">{error}</div>}

      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', maxWidth: 360 }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search patient, phone, or visit reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%' }}
          />
        </div>

        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading patient records...</div>
        ) : filteredPatients.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <UserCheck size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
            <p>No patient records found.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient Name & Info</th>
                  <th>Visit Reason / Cause</th>
                  <th>Appointment Date</th>
                  <th>Status & Notes</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr key={patient.id}>
                    <td style={{ fontWeight: 700 }}>
                      {patient.member_name || 'Patient'}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                        {patient.member_phone} ({patient.member_gender === 'M' ? 'Male' : 'Female'})
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{patient.visit_reason}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                        <Clock size={14} color="var(--accent-blue)" />
                        <span>{patient.appointment_date}</span>
                      </div>
                    </td>
                    <td>
                      <Badge variant={patient.status === 'COMPLETED' ? 'active' : patient.status === 'REVISIT' ? 'receptionist' : 'hospital_admin'}>
                        {patient.status}
                      </Badge>
                      {patient.revisit_date && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', marginTop: '0.2rem' }}>
                          Revisit Date: {patient.revisit_date}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        {patient.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleMarkCompleted(patient.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.65rem', color: 'var(--accent-emerald)', borderRadius: 6, background: 'rgba(16, 185, 129, 0.1)', fontSize: '0.8rem', cursor: 'pointer' }}
                          >
                            <CheckCircle2 size={14} />
                            <span>Completed</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenRevisitModal(patient)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.65rem', color: 'var(--accent-blue)', borderRadius: 6, background: 'rgba(56, 189, 248, 0.1)', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          <RotateCcw size={14} />
                          <span>Revisit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RevisitModal
        isOpen={isRevisitModalOpen}
        onClose={() => setIsRevisitModalOpen(false)}
        onSave={handleSaveRevisit}
        patient={selectedPatient}
      />
    </motion.div>
  );
};

export default PatientsPage;
