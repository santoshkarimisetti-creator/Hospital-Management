import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Building2, Search, Edit2, Trash2, Phone, Mail } from 'lucide-react';
import { hospitalApi } from '../../api/hospitalApi';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { HospitalModal } from './HospitalModal';

export const HospitalsPage = () => {
  const [hospitals, setHospitals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchHospitals = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await hospitalApi.getHospitals();
      setHospitals(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load hospitals from backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const handleCreate = () => {
    setSelectedHospital(null);
    setIsModalOpen(true);
  };

  const handleEdit = (hospital) => {
    setSelectedHospital(hospital);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this hospital?')) return;
    try {
      await hospitalApi.deleteHospital(id);
      fetchHospitals();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete hospital.');
    }
  };

  const handleSave = async (formData, id) => {
    if (id) {
      await hospitalApi.updateHospital(id, formData);
    } else {
      await hospitalApi.createHospital(formData);
    }
    fetchHospitals();
  };

  const filteredHospitals = hospitals.filter(
    (h) =>
      h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Hospital Organizations</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage hospital entities and multi-tenant scoping.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleCreate}>
          Add Hospital
        </Button>
      </div>

      {error && <div className="alert-box alert-error">{error}</div>}

      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', maxWidth: 360 }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%' }}
          />
        </div>

        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading hospitals...</div>
        ) : filteredHospitals.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Building2 size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
            <p>No hospitals found in database.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hospital Name</th>
                  <th>Code</th>
                  <th>Contact Info</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHospitals.map((hospital) => (
                  <motion.tr
                    key={hospital.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    <td style={{ fontWeight: 700 }}>{hospital.name}</td>
                    <td>
                      <code style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: 4 }}>
                        {hospital.code}
                      </code>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {hospital.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Phone size={14} />
                          <span>{hospital.phone}</span>
                        </div>
                      )}
                      {hospital.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Mail size={14} />
                          <span>{hospital.email}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <Badge variant={hospital.is_active ? 'active' : 'inactive'}>
                        {hospital.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleEdit(hospital)}
                          style={{ padding: '0.4rem', color: 'var(--accent-blue)', borderRadius: 6, background: 'rgba(56, 189, 248, 0.1)' }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(hospital.id)}
                          style={{ padding: '0.4rem', color: 'var(--accent-rose)', borderRadius: 6, background: 'rgba(244, 63, 94, 0.1)' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <HospitalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        hospital={selectedHospital}
      />
    </motion.div>
  );
};

export default HospitalsPage;
