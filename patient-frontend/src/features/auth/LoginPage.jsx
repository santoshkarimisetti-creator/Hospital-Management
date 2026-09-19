import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Phone, KeyRound, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, User } from 'lucide-react';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';

export const LoginPage = () => {
  const [step, setStep] = useState(1); // 1: Mobile + Name, 2: OTP
  const [mobileNumber, setMobileNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtpHint, setDevOtpHint] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!mobileNumber || mobileNumber.length < 8) {
      setError('Please enter a valid mobile number.');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await authApi.sendOtp(mobileNumber);
      setMessage(`A 6-digit OTP verification code was sent to ${mobileNumber}`);
      if (response.otp) {
        setDevOtpHint(response.otp);
        setOtp(response.otp); // Demo auto-fill
      }
      setStep(2);
    } catch (err) {
      const errDetail = err.response?.data?.error || err.response?.data?.detail;
      setError(errDetail || 'Failed to send OTP. Please verify your mobile number.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.verifyOtp(mobileNumber, otp, '', fullName);
      login(response.user, response.tokens);
      navigate('/dashboard');
    } catch (err) {
      const errDetail = err.response?.data?.error || err.response?.data?.detail;
      setError(errDetail || 'Invalid OTP code. Please check and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top left, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.98) 70%), #090d16',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        color: '#f8fafc',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(30, 41, 59, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '1.25rem',
          padding: '2.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 8px 16px rgba(16, 185, 129, 0.35)',
              marginBottom: '1rem',
            }}
          >
            <Heart size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.025em', margin: 0 }}>
            MedFlow Patient Care
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.35rem' }}>
            Book Appointments & Manage Family Health
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              padding: '0.875rem 1rem',
              borderRadius: '0.75rem',
              fontSize: '0.85rem',
              lineHeight: 1.4,
              marginBottom: '1.5rem',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#6ee7b7',
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
            }}
          >
            <CheckCircle2 size={16} />
            <span>{message}</span>
          </div>
        )}

        {/* STEP 1: Mobile Number & Patient Name */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  color: '#cbd5e1',
                  marginBottom: '0.5rem',
                }}
              >
                Mobile Number *
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.75rem',
                  padding: '0.65rem 0.875rem',
                }}
              >
                <Phone size={18} color="#64748b" />
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#fff',
                    width: '100%',
                    fontSize: '0.925rem',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  color: '#cbd5e1',
                  marginBottom: '0.5rem',
                }}
              >
                Your Full Name (optional if existing patient)
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.75rem',
                  padding: '0.65rem 0.875rem',
                }}
              >
                <User size={18} color="#64748b" />
                <input
                  type="text"
                  placeholder="e.g. Emily Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#fff',
                    width: '100%',
                    fontSize: '0.925rem',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.8rem',
                borderRadius: '0.75rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                transition: 'all 0.2s',
              }}
            >
              <span>{isLoading ? 'Sending OTP…' : 'Get OTP Code'}</span>
              <ArrowRight size={18} />
            </button>
          </form>
        )}

        {/* STEP 2: Verify 6-digit OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.825rem', fontWeight: 600, color: '#cbd5e1' }}>
                  Enter 6-Digit OTP *
                </label>
                {devOtpHint && (
                  <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>
                    Demo OTP: {devOtpHint}
                  </span>
                )}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.75rem',
                  padding: '0.65rem 0.875rem',
                }}
              >
                <KeyRound size={18} color="#64748b" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#fff',
                    width: '100%',
                    fontSize: '1.2rem',
                    letterSpacing: '0.2em',
                    fontWeight: 700,
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => { setStep(1); setError(''); setMessage(''); }}
                style={{
                  padding: '0.8rem 1.25rem',
                  borderRadius: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#cbd5e1',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                Change Number
              </button>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.8rem',
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                }}
              >
                <span>{isLoading ? 'Verifying…' : 'Verify & Enter Portal'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Security & Scoping Notice */}
        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            color: '#94a3b8',
            fontSize: '0.75rem',
          }}
        >
          <ShieldCheck size={18} color="#34d399" style={{ flexShrink: 0 }} />
          <span>
            Dedicated Patient Portal. Hospital administrators and clinical staff must log in via the Hospital Portal.
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
