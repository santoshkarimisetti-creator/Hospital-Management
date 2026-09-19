import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Stethoscope, Search, Calendar, Award, Plus,
  Pencil, Trash2, X, ChevronDown,
} from 'lucide-react';
import { doctorApi } from '../../api/doctorApi';
import { departmentApi } from '../../api/departmentApi';
import { hospitalApi } from '../../api/hospitalApi';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/Badge';
import { BookingModal } from '../../components/booking/BookingModal';

/* ─── Doctor Form Modal ─── */
const DoctorFormModal = ({ isOpen, onClose, onSave, departments, hospitals, existing }) => {
  const emptyForm = {
    username: '', first_name: '', last_name: '',
    department: '', hospital: '',
    qualification: '', specialization: '',
    consultation_fee: '', daily_capacity_limit: 60,
    is_active: true,
  };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existing) {
      setForm({
        username: existing.user?.username || existing.username || '',
        first_name: existing.user?.first_name || '',
        last_name: existing.user?.last_name || '',
        department: existing.department || '',
        hospital: existing.hospital || '',
        qualification: existing.qualification || '',
        specialization: existing.specialization || '',
        consultation_fee: existing.consultation_fee || '',
        daily_capacity_limit: existing.daily_capacity_limit || 60,
        is_active: existing.is_active !== false,
      });
    } else {
      setForm({ ...emptyForm, hospital: hospitals[0]?.id || '' });
    }
    setError('');
  }, [existing, hospitals, isOpen]);

  if (!isOpen) return null;

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      // For edit, we only send updatable doctor-profile fields
      const payload = {
        department: form.department,
        hospital: form.hospital,
        qualification: form.qualification,
        specialization: form.specialization,
        consultation_fee: form.consultation_fee,
        daily_capacity_limit: form.daily_capacity_limit,
        is_active: form.is_active,
      };
      if (!existing) {
        payload.username = form.username;
      }
      await onSave(payload);
      onClose();
    } catch (err) {
      const errData = err.response?.data;
      setError(
        errData?.detail ||
        Object.values(errData || {}).flat().join(' ') ||
        'Failed to save doctor.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{existing ? 'Edit Doctor Profile' : 'Add Doctor'}</span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        {error && <div className="alert-box alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            {!existing && (
              <>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Username (existing user account) *</label>
                  <input className="form-input" required placeholder="Enter existing user's username" value={form.username} onChange={set('username')} />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>The user must already be registered in the system.</span>
                </div>
              </>
            )}

            {hospitals.length > 1 && (
              <div className="form-group">
                <label className="form-label">Hospital *</label>
                <select className="form-select" required value={form.hospital} onChange={set('hospital')}>
                  <option value="">Select…</option>
                  {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Department *</label>
              <select className="form-select" required value={form.department} onChange={set('department')}>
                <option value="">Select…</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Qualification</label>
              <input className="form-input" placeholder="e.g. MBBS, MD" value={form.qualification} onChange={set('qualification')} />
            </div>

            <div className="form-group">
              <label className="form-label">Consultation Fee (₹)</label>
              <input className="form-input" type="number" min="0" placeholder="500" value={form.consultation_fee} onChange={set('consultation_fee')} />
            </div>

            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Specialization / Treats</label>
              <input className="form-input" placeholder="e.g. Heart failure, Arrhythmia, Bypass surgery" value={form.specialization} onChange={set('specialization')} />
            </div>

            <div className="form-group">
              <label className="form-label">Daily Token Limit</label>
              <input className="form-input" type="number" min="1" max="500" value={form.daily_capacity_limit} onChange={set('daily_capacity_limit')} />
            </div>

            <div className="form-group" style={{ justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="is_active" checked={form.is_active} onChange={set('is_active')} style={{ width: 16, height: 16, accentColor: 'var(--accent-primary)' }} />
              <label htmlFor="is_active" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>Active</label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : existing ? 'Save Changes' : 'Add Doctor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Main Page ─── */
export const DoctorsPage = () => {
  const { activeRole } = useAuth();
  const isAdmin = activeRole === 'HOSPITAL_ADMIN' || activeRole === 'SUPER_ADMIN';
  const canBook  = activeRole === 'PATIENT';

  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [docData, deptData] = await Promise.all([
        doctorApi.getDoctors(),
        departmentApi.getDepartments(),
      ]);
      setDoctors(docData);
      setDepartments(deptData);
      if (isAdmin) {
        const h = await hospitalApi.getHospitals();
        setHospitals(h);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load doctors.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveDoctor = async (payload) => {
    if (editingDoctor) {
      await doctorApi.updateDoctor(editingDoctor.id, payload);
    } else {
      await doctorApi.createDoctor(payload);
    }
    fetchData();
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Remove Dr. ${doc.doctor_name}? This cannot be undone.`)) return;
    try {
      await doctorApi.deleteDoctor(doc.id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to remove doctor.');
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    const q = searchTerm.toLowerCase();
    return (
      (doc.doctor_name || '').toLowerCase().includes(q) ||
      (doc.department_name || '').toLowerCase().includes(q) ||
      (doc.specialization || '').toLowerCase().includes(q)
    );
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Medical Specialists & Doctors</h1>
          <p className="page-subtitle">
            {isAdmin
              ? 'Manage doctor profiles — add, edit, and assign to departments.'
              : 'Find doctors by specialization and book appointments.'}
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setEditingDoctor(null); setIsFormOpen(true); }}>
            <Plus size={16} /> Add Doctor
          </button>
        )}
      </div>

      {error && <div className="alert-box alert-error">{error}</div>}

      {/* Search */}
      <div className="search-bar" style={{ maxWidth: 400, marginBottom: '1.5rem' }}>
        <Search size={16} color="var(--text-dim)" />
        <input
          placeholder="Search doctor, department, or specialization…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="loading-state"><div className="spinner" /><span>Loading doctors…</span></div>
      ) : filteredDoctors.length === 0 ? (
        <div className="empty-state">
          <Stethoscope size={40} style={{ opacity: 0.3 }} />
          <p>No doctors found matching your search.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {filteredDoctors.map((doctor) => {
            const pct = Math.min(100, Math.round(
              ((doctor.daily_capacity_limit - (doctor.today_remaining ?? doctor.daily_capacity_limit)) / (doctor.daily_capacity_limit || 60)) * 100
            ));
            return (
              <motion.div key={doctor.id} className="doctor-card" whileHover={{ y: -2 }}>
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{doctor.doctor_name}</h3>
                    <Badge variant="hospital_admin" style={{ marginTop: '0.25rem' }}>
                      {doctor.department_name || 'General'}
                    </Badge>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                    <span style={{ fontWeight: 800, color: 'var(--status-success)', fontSize: '1rem' }}>
                      ₹{doctor.consultation_fee}
                    </span>
                    <Badge variant={doctor.is_active !== false ? 'active' : 'inactive'}>
                      {doctor.is_active !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                {/* Qualification */}
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.6rem' }}>
                  <Award size={13} color="var(--accent-primary)" />
                  <span>{doctor.qualification || 'MBBS, MD'}</span>
                </div>

                {/* Specialization */}
                <div style={{ fontSize: '0.8rem', background: 'var(--bg-hover)', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-muted)', marginBottom: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--accent-primary)', display: 'block', marginBottom: '0.15rem' }}>
                    Specializes In
                  </span>
                  {doctor.specialization || 'General Clinical Medicine & Healthcare Services'}
                </div>

                {/* Token capacity */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
                    <span>Today: <strong style={{ color: 'var(--text-muted)' }}>{doctor.today_capacity_display || `0/${doctor.daily_capacity_limit || 60}`}</strong></span>
                    <span style={{ fontWeight: 600, color: (doctor.today_remaining ?? 60) > 0 ? 'var(--status-success)' : 'var(--status-danger)' }}>
                      {(doctor.today_remaining ?? 60) > 0 ? `${doctor.today_remaining} slots left` : 'Full today'}
                    </span>
                  </div>
                  <div className="capacity-bar">
                    <div className={`capacity-bar-fill ${pct >= 100 ? 'full' : pct >= 75 ? 'warn' : ''}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {canBook && (
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      onClick={() => { setSelectedDoctor(doctor); setIsBookingOpen(true); }}
                    >
                      <Calendar size={15} /> Book Appointment
                    </button>
                  )}
                  {isAdmin && (
                    <>
                      <button
                        className="btn btn-secondary"
                        style={{ flex: 1 }}
                        onClick={() => { setEditingDoctor(doctor); setIsFormOpen(true); }}
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        className="btn btn-danger btn-icon"
                        title="Remove doctor"
                        onClick={() => handleDelete(doctor)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Doctor Form Modal */}
      <DoctorFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingDoctor(null); }}
        onSave={handleSaveDoctor}
        departments={departments}
        hospitals={hospitals}
        existing={editingDoctor}
      />

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        initialDoctor={selectedDoctor}
      />
    </motion.div>
  );
};

export default DoctorsPage;
