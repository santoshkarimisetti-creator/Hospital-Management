import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Brain, Bone, Eye, Scan, Stethoscope, Baby,
  HeartPulse, Building, Search, Plus, Pencil, Trash2,
  X, Calendar, ChevronDown, ChevronUp, Users,
} from 'lucide-react';
import { departmentApi } from '../../api/departmentApi';
import { doctorApi } from '../../api/doctorApi';
import { hospitalApi } from '../../api/hospitalApi';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/Badge';
import { BookingModal } from '../../components/booking/BookingModal';

/* ─── Department config: icon + colour + image ─── */
const getDeptConfig = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('cardio') || n.includes('heart'))
    return { Icon: Heart,       accent: '#ef4444', image: '/dept_cardiology.jpg',    desc: 'Diagnosis and treatment of heart and cardiovascular diseases.' };
  if (n.includes('neuro') || n.includes('brain'))
    return { Icon: Brain,       accent: '#8b5cf6', image: '/dept_neurology.jpg',     desc: 'Disorders of the nervous system, brain, and spinal cord.' };
  if (n.includes('ortho') || n.includes('bone') || n.includes('joint'))
    return { Icon: Bone,        accent: '#f97316', image: '/dept_orthopedics.jpg',   desc: 'Musculoskeletal system — bones, joints, ligaments, and fractures.' };
  if (n.includes('derma') || n.includes('skin'))
    return { Icon: Scan,        accent: '#ec4899', image: '/dept_dermatology.jpg',   desc: 'Skin conditions, rashes, cosmetic and surgical dermatology.' };
  if (n.includes('ophthal') || n.includes('eye') || n.includes('vision'))
    return { Icon: Eye,         accent: '#0891b2', image: '/dept_ophthalmology.jpg', desc: 'Diagnosis and treatment of eye disorders and vision problems.' };
  if (n.includes('pedia') || n.includes('child'))
    return { Icon: Baby,        accent: '#f59e0b', image: '/dept_general.jpg',       desc: 'Healthcare for infants, children, and adolescents.' };
  if (n.includes('gynae') || n.includes('gyneco') || n.includes('obstet'))
    return { Icon: HeartPulse,  accent: '#e11d48', image: '/dept_general.jpg',       desc: 'Women\'s reproductive health, obstetrics, and gynaecology.' };
  if (n.includes('general') || n.includes('medicine') || n.includes('internal'))
    return { Icon: Stethoscope, accent: '#0891b2', image: '/dept_general.jpg',       desc: 'General clinical medicine and primary healthcare consultations.' };
  return   { Icon: Building,    accent: '#64748b', image: '/dept_general.jpg',       desc: 'Specialised medical care and clinical services.' };
};

/* ─── Department Form Modal ─── */
const DeptFormModal = ({ isOpen, onClose, onSave, hospitals, existing }) => {
  const [form, setForm] = useState({ name: '', code: '', hospital: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existing) {
      setForm({ name: existing.name || '', code: existing.code || '', hospital: existing.hospital || '' });
    } else {
      setForm({ name: '', code: '', hospital: hospitals[0]?.id || '' });
    }
    setError('');
  }, [existing, hospitals, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.name?.[0] || 'Failed to save department.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{existing ? 'Edit Department' : 'Add Department'}</span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>
        {error && <div className="alert-box alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Department Name *</label>
            <input className="form-input" required placeholder="e.g. Cardiology" value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Code (optional)</label>
            <input className="form-input" placeholder="e.g. CARD" value={form.code}
              onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))} />
          </div>
          {hospitals.length > 1 && (
            <div className="form-group">
              <label className="form-label">Hospital *</label>
              <select className="form-select" required value={form.hospital}
                onChange={(e) => setForm(f => ({ ...f, hospital: e.target.value }))}>
                <option value="">Select hospital…</option>
                {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : existing ? 'Save Changes' : 'Add Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Main Page ─── */
export const DepartmentsManagePage = () => {
  const navigate = useNavigate();
  const { activeRole } = useAuth();
  const isAdmin = activeRole === 'HOSPITAL_ADMIN';
  const canBook  = activeRole === 'PATIENT';

  const [departments, setDepartments] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [doctorsInDept, setDoctorsInDept] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);

  // booking
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const fetchAll = async () => {
    setIsLoading(true);
    setError('');
    try {
      const depts = await departmentApi.getDepartments();
      setDepartments(depts);
      if (isAdmin) {
        const h = await hospitalApi.getHospitals();
        setHospitals(h);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load departments.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSelectDept = async (dept) => {
    if (selectedDept?.id === dept.id) { setSelectedDept(null); setDoctorsInDept([]); return; }
    setSelectedDept(dept);
    setLoadingDoctors(true);
    try {
      const docs = await doctorApi.getDoctors(dept.id);
      setDoctorsInDept(docs);
    } catch { setDoctorsInDept([]); }
    finally { setLoadingDoctors(false); }
  };

  const handleSaveDept = async (form) => {
    const payload = { name: form.name, code: form.code, hospital: form.hospital };
    if (editingDept) {
      await departmentApi.updateDepartment(editingDept.id, payload);
    } else {
      await departmentApi.createDepartment(payload);
    }
    fetchAll();
  };

  const handleDeleteDept = async (dept) => {
    if (!window.confirm(`Delete department "${dept.name}"? This cannot be undone.`)) return;
    try {
      await departmentApi.deleteDepartment(dept.id);
      if (selectedDept?.id === dept.id) setSelectedDept(null);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete department.');
    }
  };

  const filteredDepts = departments.filter(d =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Medical Departments</h1>
          <p className="page-subtitle">
            {isAdmin
              ? 'Manage hospital departments — add, edit, and view doctors per department.'
              : 'Browse departments and explore available doctors.'}
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setEditingDept(null); setIsFormOpen(true); }}>
            <Plus size={16} /> Add Department
          </button>
        )}
      </div>

      {error && <div className="alert-box alert-error">{error}</div>}

      {/* Search */}
      <div className="search-bar" style={{ maxWidth: 380, marginBottom: '1.5rem' }}>
        <Search size={16} color="var(--text-dim)" />
        <input
          placeholder="Search department name…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="loading-state">
          <div className="spinner" />
          <span>Loading departments…</span>
        </div>
      ) : filteredDepts.length === 0 ? (
        <div className="empty-state">
          <Building size={40} style={{ opacity: 0.3 }} />
          <p>No departments found.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
          {filteredDepts.map((dept) => {
            const { Icon, accent, image } = getDeptConfig(dept.name);
            return (
              <motion.div key={dept.id} layout whileHover={{ y: -2 }}>
                {/* Dept Card */}
                <div
                  className="dept-card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/departments/${dept.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="icon-box" style={{ background: `${accent}18`, color: accent }}>
                      <Icon size={20} />
                    </div>
                    <Badge variant="active" style={{ fontSize: '0.68rem' }}>
                      <Users size={10} style={{ marginRight: 3 }} />{dept.doctor_count} Doctors
                    </Badge>
                  </div>

                  <h3 style={{ marginTop: '0.85rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {dept.name}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {dept.hospital_name || 'City Hospital'}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                      View Department →
                    </span>

                    {/* Admin actions */}
                    {isAdmin && (
                      <div
                        style={{ display: 'flex', gap: '0.4rem' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="btn btn-ghost btn-icon"
                          title="Edit"
                          onClick={() => { setEditingDept(dept); setIsFormOpen(true); }}
                          style={{ color: 'var(--accent-primary)' }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon"
                          title="Delete"
                          onClick={() => handleDeleteDept(dept)}
                          style={{ color: 'var(--status-danger)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal (admin only) */}
      <DeptFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingDept(null); }}
        onSave={handleSaveDept}
        hospitals={hospitals}
        existing={editingDept}
      />

      {/* Booking Modal (patient) */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        initialDoctor={selectedDoctor}
        initialDepartment={selectedDept}
      />
    </motion.div>
  );
};

export default DepartmentsManagePage;
