import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';

export const HospitalLoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter your username and password.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      // Step 1: Get tokens via username+password
      const tokenData = await authApi.loginWithPassword(username, password);
      // Step 2: Fetch full user profile
      const userData = await authApi.getMe();
      // Step 3: Store in context
      login(userData, { access: tokenData.access, refresh: tokenData.refresh });
      navigate('/dashboard');
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0];
      setError(detail || 'Invalid username or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="hospital-login-bg">
      <motion.div
        className="hospital-login-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Brand */}
        <div className="hospital-login-brand">
          <div className="hospital-login-logo">
            <Heart size={22} />
          </div>
          <h1 className="hospital-login-title">MedFlow OS</h1>
          <p className="hospital-login-subtitle">Hospital Staff Portal</p>
        </div>

        {/* Security badge */}
        <div className="hospital-login-security">
          <ShieldCheck size={13} />
          <span>Secured hospital staff access only</span>
        </div>

        {error && (
          <div className="alert-box alert-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{ paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.7rem' }}
          >
            {isLoading ? (
              <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /><span>Signing in…</span></>
            ) : (
              <><LogIn size={16} /><span>Sign In to Hospital Portal</span></>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
          Patient? Use the{' '}
          <a href="http://localhost:5174" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
            Patient Portal
          </a>
        </p>
      </motion.div>
    </div>
  );
};

export default HospitalLoginPage;
