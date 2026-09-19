import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Users, Search, Trash2, ShieldCheck, Building2 } from 'lucide-react';
import { staffApi } from '../../api/staffApi';
import { hospitalApi } from '../../api/hospitalApi';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StaffModal } from './StaffModal';

export const StaffPage = () => {
  const [staffList, setStaffList] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [staffData, hospitalData] = await Promise.all([
        staffApi.getStaff(),
        hospitalApi.getHospitals(),
      ]);
      setStaffList(staffData);
      setHospitals(hospitalData);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load staff list from backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this staff assignment?')) return;
    try {
      await staffApi.deleteStaff(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to remove staff assignment.');
    }
  };

  const handleSave = async (formData) => {
    await staffApi.createStaff(formData);
    fetchData();
  };

  const filteredStaff = staffList.filter((s) => {
    const username = s.user_detail?.username || '';
    const hospitalName = s.hospital_detail?.name || '';
    return (
      username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospitalName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Hospital Staff Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Assign staff users to hospitals with role-based scoping permissions.
          </p>
        </div>
        <Button variant="primary" icon={UserPlus} onClick={() => setIsModalOpen(true)}>
          Assign Staff
        </Button>
      </div>

      {error && <div className="alert-box alert-error">{error}</div>}

      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', maxWidth: 360 }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search by staff username or hospital..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%' }}
          />
        </div>

        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading staff assignments...</div>
        ) : filteredStaff.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Users size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
            <p>No staff assignments found.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Assigned Hospital</th>
                  <th>Assigned Role</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((staff) => (
                  <motion.tr
                    key={staff.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    <td style={{ fontWeight: 700 }}>
                      {staff.user_detail?.username || `User #${staff.user}`}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                        {staff.user_detail?.mobile_number}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Building2 size={16} color="var(--accent-blue)" />
                        <span>{staff.hospital_detail?.name || `Hospital #${staff.hospital}`}</span>
                      </div>
                    </td>
                    <td>
                      <Badge variant={staff.role_detail?.name || 'HOSPITAL_ADMIN'}>
                        {staff.role_detail?.name || 'Staff Role'}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={staff.is_active ? 'active' : 'inactive'}>
                        {staff.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleDelete(staff.id)}
                        style={{ padding: '0.4rem', color: 'var(--accent-rose)', borderRadius: 6, background: 'rgba(244, 63, 94, 0.1)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <StaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        hospitals={hospitals}
      />
    </motion.div>
  );
};

export default StaffPage;
