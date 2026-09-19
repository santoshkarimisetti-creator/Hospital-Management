import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, CheckCircle2, UserPlus, Calendar, CreditCard, Stethoscope,
  QrCode, Smartphone, ArrowRight, ArrowLeft, ShieldCheck,
  Sparkles, Ticket, Receipt, Check, AlertCircle, Copy
} from 'lucide-react';
import { memberApi } from '../../api/memberApi';
import { doctorApi } from '../../api/doctorApi';
import { paymentApi } from '../../api/paymentApi';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

export const BookingModal = ({
  isOpen,
  onClose,
  initialDoctor = null,
  initialDepartment = null,
  onBookingSuccess
}) => {
  // Steps:
  // 1: Select Doctor
  // 2: Patient Details
  // 3: Select Date & Reason
  // 4: Payment Method (UPI, Card, QR)
  // 5: Confirmed & Token Issued
  const [step, setStep] = useState(initialDoctor ? 2 : 1);

  const [members, setMembers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(initialDoctor);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    full_name: '',
    phone: '',
    gender: 'M',
    custom_relation: 'Self',
  });

  const [appointmentDate, setAppointmentDate] = useState(
    () => new Date(Date.now() + 86400000).toISOString().split('T')[0] // default tomorrow
  );
  const [visitReason, setVisitReason] = useState('General Consultation');

  // Payment State
  const [paymentTab, setPaymentTab] = useState('UPI'); // 'UPI' | 'CARD' | 'QR'
  const [selectedUpiApp, setSelectedUpiApp] = useState('Google Pay');
  const [upiId, setUpiId] = useState('patient@okaxis');
  const [cardData, setCardData] = useState({
    number: '4242 •••• •••• 4242',
    name: 'Emily Smith',
    expiry: '08/29',
    cvv: '888',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);
  const [error, setError] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const maxDateStr = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  useEffect(() => {
    if (isOpen) {
      setError('');
      setPaymentSuccessData(null);
      setStep(initialDoctor ? 2 : 1);
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
      } else if (doctorsData.length > 0) {
        setSelectedDoctor(doctorsData[0]);
      }
    } catch {
      setError('Unable to load doctors and patient profiles.');
    }
  };

  if (!isOpen) return null;

  // Execute Demo Payment
  const handleProcessPayment = async () => {
    setIsProcessing(true);
    setError('');

    try {
      let paymentRef = '';
      if (paymentTab === 'UPI') {
        paymentRef = `${selectedUpiApp}: ${upiId}`;
      } else if (paymentTab === 'CARD') {
        paymentRef = `Card ending ${cardData.number.slice(-4)}`;
      } else {
        paymentRef = 'QR Code Scan & Pay';
      }

      const payload = {
        doctor_id: selectedDoctor.id,
        appointment_date: appointmentDate,
        visit_reason: visitReason,
        payment_method: paymentTab,
        payment_reference: paymentRef,
      };

      if (isNewPatient || !selectedMemberId) {
        if (!newPatientData.full_name) {
          setError('Please provide the patient full name.');
          setIsProcessing(false);
          return;
        }
        payload.new_member_name = newPatientData.full_name;
        payload.new_member_phone = newPatientData.phone;
        payload.new_member_gender = newPatientData.gender;
        payload.new_member_relation = newPatientData.custom_relation;
      } else {
        payload.member_id = parseInt(selectedMemberId, 10);
      }

      // Simulated network latency for realistic demo experience
      await new Promise((r) => setTimeout(r, 700));

      const result = await paymentApi.demoCheckout(payload);
      setPaymentSuccessData(result);
      setStep(5); // Show Confirmation & Token

      if (onBookingSuccess) {
        onBookingSuccess(result);
      }
    } catch (err) {
      const errDetail =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        (typeof err.response?.data === 'object' ? Object.values(err.response?.data).flat().join(' ') : null);
      setError(errDetail || 'Payment transaction failed. Please check date or doctor availability.');
    } finally {
      setIsProcessing(false);
    }
  };

  const consultationFee = selectedDoctor?.consultation_fee
    ? parseFloat(selectedDoctor.consultation_fee).toFixed(2)
    : '50.00';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          background: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '1.25rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          color: '#f8fafc',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(30, 41, 59, 0.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ticket size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                {step === 5 ? 'Appointment Confirmed' : 'Book Doctor Appointment'}
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Instant token allocation & simulated checkout
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '0.375rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Step Progression Bar (1 to 4) */}
        {step < 5 && (
          <div
            style={{
              display: 'flex',
              padding: '0.75rem 1.5rem',
              background: 'rgba(15, 23, 42, 0.9)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '0.75rem',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ color: step >= 1 ? '#34d399' : '#64748b', fontWeight: 700 }}>
              1. Doctor
            </span>
            <span style={{ color: step >= 2 ? '#34d399' : '#64748b', fontWeight: 700 }}>
              2. Patient
            </span>
            <span style={{ color: step >= 3 ? '#34d399' : '#64748b', fontWeight: 700 }}>
              3. Date
            </span>
            <span style={{ color: step >= 4 ? '#34d399' : '#64748b', fontWeight: 700 }}>
              4. Payment
            </span>
          </div>
        )}

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', maxHeight: '75vh', overflowY: 'auto' }}>
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                fontSize: '0.825rem',
                marginBottom: '1.25rem',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Select Doctor */}
          {step === 1 && (
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.85rem' }}>
                Choose Consulting Doctor
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {doctors.map((doc) => {
                  const isSelected = selectedDoctor?.id === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoctor(doc)}
                      style={{
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        border: isSelected
                          ? '2px solid #10b981'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                        background: isSelected
                          ? 'rgba(16, 185, 129, 0.1)'
                          : 'rgba(30, 41, 59, 0.4)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: 'rgba(16, 185, 129, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#34d399',
                          }}
                        >
                          <Stethoscope size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.925rem' }}>
                            {doc.doctor_name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            {doc.department_name} · {doc.qualification || 'Specialist'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '0.2rem' }}>
                            Today's Tokens: {doc.today_capacity_display || '0/60'}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#34d399' }}>
                          ${doc.consultation_fee || '50.00'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Fee</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <Button
                  variant="primary"
                  onClick={() => setStep(2)}
                  disabled={!selectedDoctor}
                >
                  Next: Patient Details →
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Patient / Family Member Details */}
          {step === 2 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                  Patient Information
                </h4>
                {members.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsNewPatient(!isNewPatient)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#34d399',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {isNewPatient ? 'Select existing member' : '+ Add New Member'}
                  </button>
                )}
              </div>

              {!isNewPatient && members.length > 0 ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.825rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                    Select Patient Profile *
                  </label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="form-select"
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '0.75rem',
                      color: '#fff',
                      fontSize: '0.9rem',
                    }}
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.custom_relation || 'Family Member'})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <Input
                    label="Patient Full Name *"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={newPatientData.full_name}
                    onChange={(e) => setNewPatientData({ ...newPatientData, full_name: e.target.value })}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <Input
                      label="Contact Mobile *"
                      placeholder="e.g. 9876543210"
                      value={newPatientData.phone}
                      onChange={(e) => setNewPatientData({ ...newPatientData, phone: e.target.value })}
                    />
                    <div>
                      <label style={{ display: 'block', fontSize: '0.825rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                        Relationship
                      </label>
                      <select
                        value={newPatientData.custom_relation}
                        onChange={(e) => setNewPatientData({ ...newPatientData, custom_relation: e.target.value })}
                        style={{
                          width: '100%',
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '0.75rem',
                          color: '#fff',
                          fontSize: '0.9rem',
                        }}
                      >
                        <option value="Self">Self</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Child">Child</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                <Button variant="secondary" onClick={() => setStep(1)}>
                  ← Back
                </Button>
                <Button variant="primary" onClick={() => setStep(3)}>
                  Next: Choose Date →
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Select Date & Symptoms */}
          {step === 3 && (
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>
                Consultation Date & Symptoms
              </h4>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.825rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  Select Consultation Date (Next 7 Days) *
                </label>
                <input
                  type="date"
                  min={todayStr}
                  max={maxDateStr}
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <Input
                  label="Reason for Consultation / Symptoms"
                  placeholder="e.g. Chest discomfort, routine checkup, fever"
                  value={visitReason}
                  onChange={(e) => setVisitReason(e.target.value)}
                />
              </div>

              {/* Consultation Summary Card */}
              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.4)',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    {selectedDoctor?.doctor_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {selectedDoctor?.department_name} · {selectedDoctor?.hospital_name || 'Hospital'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>
                    ${consultationFee}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Consultation Fee</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                <Button variant="secondary" onClick={() => setStep(2)}>
                  ← Back
                </Button>
                <Button variant="primary" onClick={() => setStep(4)}>
                  Proceed to Payment →
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Payment Method (UPI, Card, QR Code) */}
          {step === 4 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>
                  Demo Payment Gateway
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#34d399', fontSize: '0.75rem', fontWeight: 600 }}>
                  <ShieldCheck size={16} />
                  <span>Demo Mode (No Real Money)</span>
                </div>
              </div>

              {/* Payment Tabs */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '0.5rem',
                  background: 'rgba(15, 23, 42, 0.8)',
                  padding: '0.35rem',
                  borderRadius: '0.75rem',
                  marginBottom: '1.25rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => setPaymentTab('UPI')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    padding: '0.6rem 0.5rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: paymentTab === 'UPI' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                    color: paymentTab === 'UPI' ? '#fff' : '#94a3b8',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <Smartphone size={15} />
                  <span>UPI Apps</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentTab('CARD')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    padding: '0.6rem 0.5rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: paymentTab === 'CARD' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                    color: paymentTab === 'CARD' ? '#fff' : '#94a3b8',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <CreditCard size={15} />
                  <span>Debit / Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentTab('QR')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    padding: '0.6rem 0.5rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: paymentTab === 'QR' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                    color: paymentTab === 'QR' ? '#fff' : '#94a3b8',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <QrCode size={15} />
                  <span>Generate QR</span>
                </button>
              </div>

              {/* Tab 1: UPI Apps */}
              {paymentTab === 'UPI' && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                    Select your preferred UPI application:
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => {
                      const isSelected = selectedUpiApp === app;
                      return (
                        <div
                          key={app}
                          onClick={() => setSelectedUpiApp(app)}
                          style={{
                            padding: '0.65rem 0.35rem',
                            textAlign: 'center',
                            borderRadius: '0.75rem',
                            border: isSelected
                              ? '2px solid #10b981'
                              : '1px solid rgba(255, 255, 255, 0.08)',
                            background: isSelected
                              ? 'rgba(16, 185, 129, 0.15)'
                              : 'rgba(30, 41, 59, 0.4)',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: isSelected ? '#34d399' : '#cbd5e1',
                          }}
                        >
                          {app}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <Input
                      label="UPI ID / VPA *"
                      placeholder="e.g. mobile@okhdfcbank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Credit / Debit Card */}
              {paymentTab === 'CARD' && (
                <div>
                  <div style={{ marginBottom: '0.85rem' }}>
                    <Input
                      label="Card Number *"
                      placeholder="4242 4242 4242 4242"
                      value={cardData.number}
                      onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
                    <Input
                      label="Expiry (MM/YY) *"
                      placeholder="12/28"
                      value={cardData.expiry}
                      onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                    />
                    <Input
                      label="CVV *"
                      placeholder="123"
                      type="password"
                      maxLength={4}
                      value={cardData.cvv}
                      onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                    />
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <Input
                      label="Cardholder Name *"
                      placeholder="Name on card"
                      value={cardData.name}
                      onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Tab 3: Generate QR Code */}
              {paymentTab === 'QR' && (
                <div style={{ textAlign: 'center', padding: '0.75rem 0' }}>
                  <div
                    style={{
                      width: '180px',
                      height: '180px',
                      margin: '0 auto 1rem auto',
                      background: '#fff',
                      padding: '12px',
                      borderRadius: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    }}
                  >
                    {/* Simulated Clean SVG QR Code */}
                    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ display: 'block' }}>
                      <rect width="100" height="100" fill="#fff" />
                      {/* Top-left position block */}
                      <rect x="10" y="10" width="24" height="24" fill="#0f172a" />
                      <rect x="14" y="14" width="16" height="16" fill="#fff" />
                      <rect x="18" y="18" width="8" height="8" fill="#0f172a" />
                      {/* Top-right position block */}
                      <rect x="66" y="10" width="24" height="24" fill="#0f172a" />
                      <rect x="70" y="14" width="16" height="16" fill="#fff" />
                      <rect x="74" y="18" width="8" height="8" fill="#0f172a" />
                      {/* Bottom-left position block */}
                      <rect x="10" y="66" width="24" height="24" fill="#0f172a" />
                      <rect x="14" y="70" width="16" height="16" fill="#fff" />
                      <rect x="18" y="74" width="8" height="8" fill="#0f172a" />
                      {/* Data dots */}
                      <rect x="42" y="14" width="6" height="6" fill="#0f172a" />
                      <rect x="52" y="20" width="6" height="6" fill="#0f172a" />
                      <rect x="42" y="42" width="16" height="16" fill="#0f172a" />
                      <rect x="66" y="44" width="8" height="8" fill="#0f172a" />
                      <rect x="78" y="56" width="6" height="6" fill="#0f172a" />
                      <rect x="44" y="68" width="6" height="12" fill="#0f172a" />
                      <rect x="60" y="76" width="12" height="6" fill="#0f172a" />
                      <rect x="76" y="76" width="8" height="8" fill="#0f172a" />
                    </svg>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                    Scan with any UPI App (Demo)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                    GPay · PhonePe · Paytm · Amazon Pay
                  </div>
                </div>
              )}

              {/* Amount Breakdown & Pay Action */}
              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '0.75rem',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Payable Amount</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399' }}>
                    ${consultationFee}
                  </div>
                </div>
                <Badge variant="active">100% Demo Simulation</Badge>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Button variant="secondary" onClick={() => setStep(3)}>
                  ← Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleProcessPayment}
                  disabled={isProcessing}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    fontWeight: 700,
                  }}
                >
                  {isProcessing
                    ? 'Processing Demo Payment…'
                    : `Complete Demo Payment ($${consultationFee})`}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: Payment Successful, Appointment Confirmed & Token Generated */}
          {step === 5 && paymentSuccessData && (
            <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
              {/* Success Checkmark Circle */}
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '2px solid #10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34d399',
                  margin: '0 auto 1.25rem auto',
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.35rem 0' }}>
                Demo Payment Successful!
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: '0 0 1.5rem 0' }}>
                Your appointment is confirmed and queue token has been generated.
              </p>

              {/* Digital Token Card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                      Consultation Token Number
                    </span>
                    <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#34d399', lineHeight: 1.1 }}>
                      Token #{paymentSuccessData.token?.token_number || 1}
                    </div>
                  </div>
                  <Badge variant="active">STATUS: CONFIRMED</Badge>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.85rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.85rem' }}>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Doctor:</span>
                    <div style={{ fontWeight: 700 }}>{selectedDoctor?.doctor_name}</div>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Department:</span>
                    <div style={{ fontWeight: 700 }}>{selectedDoctor?.department_name}</div>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Date:</span>
                    <div style={{ fontWeight: 700 }}>{appointmentDate}</div>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Hospital:</span>
                    <div style={{ fontWeight: 700 }}>{selectedDoctor?.hospital_name || 'Hospital Center'}</div>
                  </div>
                </div>

                {/* Transaction Ledger Info */}
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(15, 23, 42, 0.6)',
                    fontSize: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: '#94a3b8' }}>
                    Txn ID: <strong style={{ color: '#e2e8f0' }}>{paymentSuccessData.payment?.transaction_id}</strong>
                  </span>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>
                    PAID (${paymentSuccessData.payment?.amount})
                  </span>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={onClose}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  fontWeight: 700,
                  padding: '0.85rem',
                }}
              >
                View Appointment in My Visits
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default BookingModal;
