import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { memberApi } from '../../api/memberApi';
import { doctorApi } from '../../api/doctorApi';
import { appointmentApi } from '../../api/appointmentApi';
import { CheckCircle2, UserPlus, Calendar, CreditCard, Stethoscope, Sparkles } from 'lucide-react';

export const BookingModal = ({ isOpen, onClose, initialDoctor = null, initialDepartment = null, onBookingSuccess }) => {
  const [step, setStep] = useState(1);
  const [members, setMembers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    full_name: '',
    gender: 'M',
    phone: '',
    date_of_birth: '',
    custom_relation: '',
  });

  const [selectedDoctorId, setSelectedDoctorId] = useState(initialDoctor?.id?.toString() || '');
  const [selectedDoctor, setSelectedDoctor] = useState(initialDoctor);
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitReason, setVisitReason] = useState('General Consultation');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError('');
      setConfirmedBooking(null);
      fetchInitialData();
    }
  }, [isOpen, initialDoctor, initialDepartment]);

  const fetchInitialData = async () => {
    try {
      const [membersData, doctorsData] = await Promise.all([
        memberApi.getMembers(),
        doctorApi.getDoctors(initialDepartment?.id),
      ]);
      setMembers(membersData);
      setDoctors(doctorsData);

      if (membersData.length > 0) {
        setSelectedMemberId(membersData[0].id.toString());
      } else {
        setIsNewPatient(true);
      }

      if (initialDoctor) {
        setSelectedDoctor(initialDoctor);
        setSelectedDoctorId(initialDoctor.id.toString());
      } else if (doctorsData.length > 0) {
        setSelectedDoctor(doctorsData[0]);
        setSelectedDoctorId(doctorsData[0].id.toString());
      }
    } catch {
      setError('Failed to initialize booking options.');
    }
  };

  const handleDoctorChange = (docId) => {
    setSelectedDoctorId(docId);
    const doc = doctors.find((d) => d.id.toString() === docId.toString());
    setSelectedDoctor(doc);
  };

  const handleConfirmBooking = async () => {
    setIsLoading(true);
    setError('');
    try {
      let memberIdToUse = selectedMemberId;

      // Auto-Save New Patient to Members if entered
      if (isNewPatient || !memberIdToUse) {
        if (!newPatientData.full_name || !newPatientData.phone) {
          setError('Please enter patient full name and mobile number.');
          setIsLoading(false);
          return;
        }
        const createdMember = await memberApi.createMember(newPatientData);
        memberIdToUse = createdMember.id;
      }

      // Create Appointment on Backend (Auto-allocates capacity & issues Token #)
      const bookingResult = await appointmentApi.createAppointment({
        doctor: parseInt(selectedDoctorId, 10),
        hospital: selectedDoctor?.hospital || 1,
        member: parseInt(memberIdToUse, 10),
        appointment_date: appointmentDate,
        visit_reason: visitReason,
        payment_status: 'PAID',
        status: 'CONFIRMED',
      });

      setConfirmedBooking(bookingResult);
      setStep(5); // Confirmed Step
      if (onBookingSuccess) onBookingSuccess();
    } catch (err) {
      setError(
        err.response?.data?.appointment_date?.[0] ||
        err.response?.data?.detail ||
        'Failed to confirm appointment. Doctor may be on leave or capacity full.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const maxDateStr = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Digital Appointment & Token Booking">
      {error && <div className="alert-box alert-error">{error}</div>}

      {/* Step Indicator */}
      {step < 5 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', fontSize: '0.8rem' }}>
          <span style={{ color: step >= 1 ? 'var(--accent-blue)' : 'var(--text-muted)', fontWeight: 700 }}>1. Patient Details</span>
          <span style={{ color: step >= 2 ? 'var(--accent-blue)' : 'var(--text-muted)', fontWeight: 700 }}>2. Doctor</span>
          <span style={{ color: step >= 3 ? 'var(--accent-blue)' : 'var(--text-muted)', fontWeight: 700 }}>3. Date</span>
          <span style={{ color: step >= 4 ? 'var(--accent-blue)' : 'var(--text-muted)', fontWeight: 700 }}>4. Payment</span>
        </div>
      )}

      {/* STEP 1: Select or Add Member */}
      {step === 1 && (
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Select Patient Profile</h4>
          
          {members.length > 0 && !isNewPatient ? (
            <div>
              <div className="form-group">
                <label className="form-label">Choose Family Member / Patient</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="form-select"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.custom_relation || m.relationship_type || 'Family'})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setIsNewPatient(true)}
                style={{ color: 'var(--accent-blue)', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <UserPlus size={16} />
                <span>+ Add & Book for a New Patient Member</span>
              </button>
            </div>
          ) : (
            <div>
              <Input
                label="Patient Full Name *"
                value={newPatientData.full_name}
                onChange={(e) => setNewPatientData({ ...newPatientData, full_name: e.target.value })}
                required
                placeholder="e.g. Emily Smith"
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Input
                  label="Mobile Phone *"
                  value={newPatientData.phone}
                  onChange={(e) => setNewPatientData({ ...newPatientData, phone: e.target.value })}
                  required
                  placeholder="e.g. +91 9876543210"
                />
                <div className="form-group">
                  <label className="form-label">Relationship *</label>
                  <select
                    value={newPatientData.custom_relation}
                    onChange={(e) => setNewPatientData({ ...newPatientData, custom_relation: e.target.value })}
                    className="form-select"
                    required
                  >
                    <option value="Self">Self</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Sister">Sister</option>
                    <option value="Brother">Brother</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Cousin">Cousin</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="alert-box alert-info" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                <Sparkles size={14} style={{ display: 'inline', marginRight: 4 }} />
                New patient details will be automatically saved under <strong>Members</strong> for future one-click bookings.
              </div>

              {members.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsNewPatient(false)}
                  style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  ← Choose Existing Saved Member
                </button>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <Button variant="primary" onClick={() => setStep(2)}>
              Next: Select Doctor →
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Select Doctor */}
      {step === 2 && (
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Select Consulting Doctor</h4>
          <div className="form-group">
            <label className="form-label">Choose Doctor</label>
            <select
              value={selectedDoctorId}
              onChange={(e) => handleDoctorChange(e.target.value)}
              className="form-select"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.doctor_name} ({d.department_name} - ${d.consultation_fee})
                </option>
              ))}
            </select>
          </div>

          {selectedDoctor && (
            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selectedDoctor.doctor_name}</div>
              <div style={{ color: 'var(--accent-blue)', fontSize: '0.85rem' }}>{selectedDoctor.department_name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                Specializes in: {selectedDoctor.specialization || 'General Clinical Medicine'}
              </div>
              <div style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', background: 'rgba(30, 41, 59, 0.6)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span>Daily Token Limit: <strong>{selectedDoctor.today_capacity_display || `0/${selectedDoctor.daily_capacity_limit || 60}`}</strong></span>
                <span style={{ color: (selectedDoctor.today_remaining ?? 60) > 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 700 }}>
                  {(selectedDoctor.today_remaining ?? 60) > 0 ? `${selectedDoctor.today_remaining} remaining` : 'Capacity Full'}
                </span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <Button variant="secondary" onClick={() => setStep(1)}>
              ← Back
            </Button>
            <Button variant="primary" onClick={() => setStep(3)}>
              Next: Select Date →
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Select Date & Reason */}
      {step === 3 && (
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Appointment Date (7-Day Booking Window)</h4>
          <div className="form-group">
            <label className="form-label">Appointment Date (Next 7 Days Only)</label>
            <input
              type="date"
              className="form-input"
              value={appointmentDate}
              min={todayStr}
              max={maxDateStr}
              onChange={(e) => setAppointmentDate(e.target.value)}
              required
            />
          </div>

          <Input
            label="Reason for Visit / Symptoms"
            value={visitReason}
            onChange={(e) => setVisitReason(e.target.value)}
            placeholder="e.g. Routine Checkup / Fever & Cold"
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <Button variant="secondary" onClick={() => setStep(2)}>
              ← Back
            </Button>
            <Button variant="primary" onClick={() => setStep(4)}>
              Next: Payment →
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: Payment Summary & Confirmation */}
      {step === 4 && (
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Payment Summary</h4>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span>Doctor Consultation Fee:</span>
              <strong style={{ color: 'var(--accent-emerald)' }}>${selectedDoctor?.consultation_fee || '50.00'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span>Appointment Date:</span>
              <span>{appointmentDate}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span>Payment Method:</span>
              <Badge variant="active">Digital Gateway / Wallet</Badge>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <Button variant="secondary" onClick={() => setStep(3)}>
              ← Back
            </Button>
            <Button variant="primary" onClick={handleConfirmBooking} isLoading={isLoading}>
              Confirm & Pay ${selectedDoctor?.consultation_fee || '50.00'}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 5: Confirmed Success Screen */}
      {step === 5 && (
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-emerald)', margin: '0 auto 1rem auto' }}>
            <CheckCircle2 size={32} />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Appointment Confirmed!</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.25rem 0 1.5rem 0' }}>
            Your appointment has been registered and token issued.
          </p>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-blue)', marginBottom: '0.5rem' }}>
              Token #{confirmedBooking?.token_number || 1}
            </div>
            <div style={{ fontSize: '0.9rem' }}>{selectedDoctor?.doctor_name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{appointmentDate}</div>
          </div>

          <Button variant="primary" onClick={onClose} style={{ width: '100%' }}>
            Done
          </Button>
        </div>
      )}
    </Modal>
  );
};

export default BookingModal;
