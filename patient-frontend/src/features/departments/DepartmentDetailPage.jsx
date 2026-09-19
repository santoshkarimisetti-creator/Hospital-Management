import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Stethoscope, Award, Calendar, Users,
  Heart, Brain, Bone, Eye, Scan, Baby, HeartPulse, Building,
  Pencil, Clock,
} from 'lucide-react';
import { departmentApi } from '../../api/departmentApi';
import { doctorApi } from '../../api/doctorApi';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/Badge';
import { BookingModal } from '../../components/booking/BookingModal';

/* Re-use same config from DepartmentsManagePage */
const getDeptConfig = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('cardio') || n.includes('heart'))
    return { Icon: Heart,       accent: '#ef4444', image: '/dept_cardiology.jpg',    desc: 'Diagnosis and treatment of cardiovascular diseases — heart failure, arrhythmias, coronary artery disease, hypertension, and preventive cardiology.' };
  if (n.includes('neuro') || n.includes('brain'))
    return { Icon: Brain,       accent: '#8b5cf6', image: '/dept_neurology.jpg',     desc: 'Disorders of the nervous system, brain, and spinal cord — epilepsy, stroke, Parkinson\'s disease, migraines, neuropathy, and dementia care.' };
  if (n.includes('ortho') || n.includes('bone') || n.includes('joint'))
    return { Icon: Bone,        accent: '#f97316', image: '/dept_orthopedics.jpg',   desc: 'Musculoskeletal conditions — fractures, joint replacements, sports injuries, arthritis, spinal disorders, and bone diseases.' };
  if (n.includes('derma') || n.includes('skin'))
    return { Icon: Scan,        accent: '#ec4899', image: '/dept_dermatology.jpg',   desc: 'Skin conditions — eczema, psoriasis, acne, rashes, skin cancer screening, cosmetic dermatology, and hair/nail disorders.' };
  if (n.includes('ophthal') || n.includes('eye') || n.includes('vision'))
    return { Icon: Eye,         accent: '#0891b2', image: '/dept_ophthalmology.jpg', desc: 'Eye care — glaucoma, cataracts, retinal disorders, corneal conditions, diabetic eye disease, and LASIK consultations.' };
  if (n.includes('pedia') || n.includes('child'))
    return { Icon: Baby,        accent: '#f59e0b', image: '/dept_general.jpg',       desc: 'Healthcare for infants, children, and adolescents — growth monitoring, vaccinations, infections, and developmental disorders.' };
  if (n.includes('gynae') || n.includes('gyneco') || n.includes('obstet'))
    return { Icon: HeartPulse,  accent: '#e11d48', image: '/dept_general.jpg',       desc: 'Women\'s reproductive health — antenatal care, labour and delivery, gynaecological surgeries, menstrual disorders, and menopause management.' };
  if (n.includes('general') || n.includes('medicine') || n.includes('internal'))
    return { Icon: Stethoscope, accent: '#0891b2', image: '/dept_general.jpg',       desc: 'General clinical medicine — primary care consultations, chronic disease management, health screening, and referrals to specialists.' };
  return   { Icon: Building,    accent: '#64748b', image: '/dept_general.jpg',       desc: 'Specialised medical care and clinical services delivered by expert medical professionals.' };
};

export const DepartmentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeRole } = useAuth();
  const isAdmin = activeRole === 'HOSPITAL_ADMIN';
  const isPatient = activeRole === 'PATIENT';

  const [dept, setDept] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [deptData, docsData] = await Promise.all([
          departmentApi.getDepartment(id),
          doctorApi.getDoctors(id),
        ]);
        setDept(deptData);
        setDoctors(docsData);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load department.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  if (isLoading) {
    return (
      <div className="loading-state" style={{ paddingTop: '4rem' }}>
        <div className="spinner" />
        <span>Loading department…</span>
      </div>
    );
  }

  if (error || !dept) {
    return (
      <div style={{ padding: '2rem' }}>
        <div className="alert-box alert-error">{error || 'Department not found.'}</div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginTop: '1rem' }}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>
    );
  }

  const { Icon, accent, image, desc } = getDeptConfig(dept.name);
  const pct = 0; // dept-level capacity not applicable directly

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      {/* Back navigation */}
      <button
        className="btn btn-ghost"
        onClick={() => navigate(-1)}
        style={{ marginBottom: '1.25rem', paddingLeft: 0 }}
      >
        <ArrowLeft size={16} /> Back to Departments
      </button>

      {/* Department Banner */}
      <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '1.5rem', position: 'relative', border: '1px solid var(--border-color)' }}>
        <img
          src={image}
          alt={dept.name}
          style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        {/* Overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,17,23,0.9) 30%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="icon-box" style={{ background: `${accent}30`, color: accent, width: 44, height: 44 }}>
              <Icon size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{dept.name}</h1>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)', marginTop: '0.15rem' }}>
                {dept.hospital_name || 'City Hospital'}
              </p>
            </div>
            {isAdmin && (
              <button
                className="btn btn-secondary"
                style={{ marginLeft: 'auto', fontSize: '0.8rem' }}
                onClick={() => navigate('/departments')}
              >
                <Pencil size={13} /> Manage
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.8 }}>{desc}</p>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Users size={14} color={accent} />
            <span><strong style={{ color: 'var(--text-main)' }}>{dept.doctor_count || doctors.length}</strong> Active Doctors</span>
          </div>
          <Badge variant="active">Active</Badge>
        </div>
      </div>

      {/* Doctors Section */}
      <div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Stethoscope size={18} color="var(--accent-primary)" />
          Doctors in {dept.name}
        </h2>

        {doctors.length === 0 ? (
          <div className="empty-state">
            <Stethoscope size={36} style={{ opacity: 0.3 }} />
            <p>No active doctors in this department currently.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {doctors.map((doc) => {
              const fill = Math.min(100, Math.round(
                ((doc.daily_capacity_limit - (doc.today_remaining ?? doc.daily_capacity_limit)) / (doc.daily_capacity_limit || 60)) * 100
              ));
              return (
                <motion.div key={doc.id} className="doctor-card" whileHover={{ y: -2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{doc.doctor_name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {doc.qualification || 'MBBS, MD'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: 'var(--status-success)', fontSize: '1rem' }}>₹{doc.consultation_fee}</div>
                      <Badge variant={doc.is_active !== false ? 'active' : 'inactive'} style={{ marginTop: '0.2rem' }}>
                        {doc.is_active !== false ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>
                  </div>

                  {doc.specialization && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '0.5rem 0.7rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent-primary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Specializes in</span>
                      {doc.specialization}
                    </div>
                  )}

                  {/* Token capacity */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={11} /> Today: <strong style={{ color: 'var(--text-muted)' }}>{doc.today_capacity_display || `0/${doc.daily_capacity_limit || 60}`}</strong>
                      </span>
                      <span style={{ fontWeight: 600, color: (doc.today_remaining ?? 60) > 0 ? 'var(--status-success)' : 'var(--status-danger)' }}>
                        {(doc.today_remaining ?? 60) > 0 ? `${doc.today_remaining} slots left` : 'Full today'}
                      </span>
                    </div>
                    <div className="capacity-bar">
                      <div className={`capacity-bar-fill ${fill >= 100 ? 'full' : fill >= 75 ? 'warn' : ''}`} style={{ width: `${fill}%` }} />
                    </div>
                  </div>

                  {/* Patient booking action */}
                  {isPatient && (
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', marginTop: '0.85rem' }}
                      onClick={() => { setSelectedDoctor(doc); setIsBookingOpen(true); }}
                    >
                      <Calendar size={14} /> Book Appointment
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        initialDoctor={selectedDoctor}
      />
    </motion.div>
  );
};

export default DepartmentDetailPage;
