import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Ticket, ClipboardList, Search, Eye, Sparkles, Phone, MapPin, Cake, User, ShieldCheck, Stethoscope, Building, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { appointmentApi } from '../../api/appointmentApi';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { BookingModal } from '../../components/booking/BookingModal';
import { useNavigate } from 'react-router-dom';

export const PatientHomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchAppointments = async () => {
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
    fetchAppointments();
  }, []);

  const handleOpenDetailModal = (apt) => {
    setSelectedAppointment(apt);
    setIsDetailModalOpen(true);
  };

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

  const displayName = user?.full_name || user?.first_name || user?.username || 'Patient';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Welcome Banner */}
      <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-blue)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              <Sparkles size={16} />
              <span>Digital Health Portal</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Welcome, {displayName}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.4rem', maxWidth: 600 }}>
              Easily book online hospital tokens, manage your family members, and view your complete appointment history.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="primary" icon={Calendar} onClick={() => setIsBookingModalOpen(true)}>
              Book New Appointment
            </Button>
            <Button variant="secondary" icon={Users} onClick={() => navigate('/members')}>
              Manage Members
            </Button>
          </div>
        </div>
      </div>

      {/* Appointment History & Tokens Section */}
      <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ClipboardList size={22} color="var(--accent-blue)" />
              <span>My Appointment History & Tokens</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Click any appointment record to view full patient, payment, and doctor consultation details.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', minWidth: 260 }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {error && <div className="alert-box alert-error">{error}</div>}

        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading appointment history...</div>
        ) : filteredHistory.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Ticket size={44} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
            <p style={{ fontSize: '1rem', fontWeight: 600 }}>No appointments booked yet.</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>Click "Book New Appointment" to schedule a visit.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Token #</th>
                  <th>Consulting Doctor</th>
                  <th>Appointment Date</th>
                  <th>Patient Name</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((apt) => (
                  <tr
                    key={apt.id}
                    onClick={() => handleOpenDetailModal(apt)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Ticket size={16} color="var(--accent-blue)" />
                        <span style={{ fontWeight: 800, color: 'var(--accent-blue)' }}>
                          Token #{apt.token_number || apt.id}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700 }}>{apt.doctor_name || 'Doctor'}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{apt.appointment_date}</div>
                    </td>
                    <td style={{ color: 'var(--text-main)' }}>{apt.member_name || 'Patient'}</td>
                    <td>
                      <Badge variant={apt.status === 'COMPLETED' ? 'active' : apt.status === 'REVISIT' ? 'receptionist' : 'hospital_admin'}>
                        {apt.status}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenDetailModal(apt); }}
                        style={{ padding: '0.35rem 0.75rem', color: 'var(--accent-blue)', borderRadius: 6, background: 'rgba(56, 189, 248, 0.1)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 600 }}
                      >
                        <Eye size={15} />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Appointment Full Details Modal */}
      {selectedAppointment && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Appointment Details: Token #${selectedAppointment.token_number || selectedAppointment.id}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header Token Card */}
            <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', tracking: '0.05em' }}>Token Number</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-blue)', margin: '0.25rem 0' }}>
                Token #{selectedAppointment.token_number || selectedAppointment.id}
              </div>
              <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'center' }}>
                <Badge variant={selectedAppointment.payment_status === 'PAID' ? 'active' : 'inactive'}>
                  Payment: {selectedAppointment.payment_status}
                </Badge>
                <Badge variant={selectedAppointment.status === 'COMPLETED' ? 'active' : selectedAppointment.status === 'REVISIT' ? 'receptionist' : 'hospital_admin'}>
                  Status: {selectedAppointment.status}
                </Badge>
              </div>
            </div>

            {/* Doctor Info */}
            <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem' }}>
                <Stethoscope size={14} /> Consulting Doctor & Hospital
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{selectedAppointment.doctor_name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--accent-blue)' }}>{selectedAppointment.hospital_name || 'City Central Hospital'}</div>
            </div>

            {/* Patient Details */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.5rem' }}>
                <User size={14} /> Patient Record
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Patient Name: </span>
                  <strong style={{ color: '#fff' }}>{selectedAppointment.member_name || 'Patient'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Date of Visit: </span>
                  <strong>{selectedAppointment.appointment_date}</strong>
                </div>
              </div>
            </div>

            {/* Visit Reason & Notes */}
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Reason for Visit
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {selectedAppointment.visit_reason || 'General Consultation'}
              </div>

              {selectedAppointment.visit_notes && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Doctor Notes</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>{selectedAppointment.visit_notes}</div>
                </div>
              )}

              {selectedAppointment.revisit_date && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--accent-amber)', fontWeight: 700 }}>
                  Scheduled Follow-up Revisit: {selectedAppointment.revisit_date}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
                Close Details
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onBookingSuccess={fetchAppointments}
      />
    </motion.div>
  );
};

export default PatientHomePage;
