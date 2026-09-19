import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShieldCheck, User, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';

export const LoginPage = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleStaffLogin = async (e) => {
    e.preventDefault();
    if (!usernameOrEmail || !password) {
      setError('Please enter your email or username and password.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const tokenData = await authApi.loginWithPassword(usernameOrEmail, password);
      // tokenData may contain user directly or fetch via getMe()
      const userData = tokenData.user || await authApi.getMe();
      login(userData, { access: tokenData.access, refresh: tokenData.refresh });
      navigate('/dashboard');
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        (typeof err.response?.data === 'object' ? Object.values(err.response?.data).flat().join(' ') : null);
      setError(detail || 'Authentication failed. Please verify your staff credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top right, rgba(14, 165, 233, 0.15) 0%, rgba(15, 23, 42, 0.98) 70%), #090d16',
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
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              boxShadow: '0 8px 16px rgba(2, 132, 199, 0.35)',
              marginBottom: '1rem',
            }}
          >
            <Heart size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.025em', margin: 0 }}>
            MedFlow Hospital Portal
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.35rem' }}>
            Authorized Access for Doctors, Administrators & Staff
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

        {/* Staff Authentication Form */}
        <form onSubmit={handleStaffLogin}>
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
              Email or Username
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
                required
                placeholder="e.g. hosp_admin_david or admin@hospital.com"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 600, color: '#cbd5e1' }}>
                Password
              </label>
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
              <Lock size={18} color="#64748b" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  width: '100%',
                  fontSize: '0.925rem',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
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
              background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.35)',
              transition: 'all 0.2s',
            }}
          >
            <LogIn size={18} />
            <span>{isLoading ? 'Authenticating…' : 'Sign In to Hospital Portal'}</span>
          </button>
        </form>

        {/* Security / Portal Scoping Notice */}
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
          <ShieldCheck size={18} color="#38bdf8" style={{ flexShrink: 0 }} />
          <span>
            Strict role-based authorization enforced. Patients must log in via the Patient Portal (Mobile + OTP).
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
