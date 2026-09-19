import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Users, Search, Trash2, Calendar, Eye, Edit2, Phone, MapPin, Cake, User } from 'lucide-react';
import { memberApi } from '../../api/memberApi';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { BookingModal } from '../../components/booking/BookingModal';

export const MembersPage = () => {
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const initialFormState = {
    full_name: '',
    date_of_birth: '',
    age: '',
    gender: 'M',
    phone: '',
    address: '',
    custom_relation: 'Self',
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchMembers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await memberApi.getMembers();
      setMembers(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load family members.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const calculateAge = (dobString) => {
    if (!dobString) return '';
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? age : 0;
  };

  const handleDobChange = (e) => {
    const dob = e.target.value;
    const computedAge = calculateAge(dob);
    setFormData((prev) => ({
      ...prev,
      date_of_birth: dob,
      age: computedAge !== '' ? computedAge : prev.age,
    }));
  };

  const handleOpenAddModal = () => {
    setFormData(initialFormState);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (member, e) => {
    if (e) e.stopPropagation();
    setSelectedMember(member);
    setFormData({
      full_name: member.full_name || '',
      date_of_birth: member.date_of_birth || '',
      age: member.age || (member.date_of_birth ? calculateAge(member.date_of_birth) : ''),
      gender: member.gender || 'M',
      phone: member.phone || '',
      address: member.address || '',
      custom_relation: member.custom_relation || member.relationship_type || 'Self',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDetailModal = (member) => {
    setSelectedMember(member);
    setIsDetailModalOpen(true);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await memberApi.createMember(formData);
      setIsAddModalOpen(false);
      setFormData(initialFormState);
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add member details.');
    }
  };

  const handleUpdateMember = async (e) => {
    e.preventDefault();
    if (!selectedMember) return;
    try {
      await memberApi.updateMember(selectedMember.id, formData);
      setIsEditModalOpen(false);
      setSelectedMember(null);
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update member details.');
    }
  };

  const handleDeleteMember = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Remove this family member profile?')) return;
    try {
      await memberApi.deleteMember(id);
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to remove member.');
    }
  };

  const filteredMembers = members.filter((m) =>
    m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.custom_relation || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Family Members & Dependents</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage family member profiles for appointment bookings.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="secondary" icon={Calendar} onClick={() => setIsBookingModalOpen(true)}>
            Book Appointment
          </Button>
          <Button variant="primary" icon={UserPlus} onClick={handleOpenAddModal}>
            Add Member
          </Button>
        </div>
      </div>

      {error && <div className="alert-box alert-error">{error}</div>}

      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', maxWidth: 360 }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search by name or relationship..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '100%' }}
          />
        </div>

        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading family members...</div>
        ) : filteredMembers.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Users size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
            <p>No family members registered yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Relationship</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    onClick={() => handleOpenDetailModal(member)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontWeight: 700, fontSize: '1rem' }}>{member.full_name}</td>
                    <td>
                      <Badge variant="hospital_admin">
                        {member.custom_relation || member.relationship_type || 'Self'}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenDetailModal(member)}
                          title="View Full Details"
                          style={{ padding: '0.4rem 0.6rem', color: 'var(--accent-blue)', borderRadius: 6, background: 'rgba(56, 189, 248, 0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 600 }}
                        >
                          <Eye size={15} />
                          <span>View</span>
                        </button>

                        <button
                          onClick={(e) => handleOpenEditModal(member, e)}
                          title="Edit Details"
                          style={{ padding: '0.4rem 0.6rem', color: 'var(--accent-amber)', borderRadius: 6, background: 'rgba(245, 158, 11, 0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 600 }}
                        >
                          <Edit2 size={15} />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={(e) => handleDeleteMember(member.id, e)}
                          title="Delete Member"
                          style={{ padding: '0.4rem 0.6rem', color: 'var(--accent-rose)', borderRadius: 6, background: 'rgba(244, 63, 94, 0.1)', cursor: 'pointer' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Member Details View Modal */}
      {selectedMember && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Member Profile: ${selectedMember.full_name}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(30, 41, 59, 0.5)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '1.25rem' }}>
                {selectedMember.full_name.charAt(0)}
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{selectedMember.full_name}</h3>
                <Badge variant="hospital_admin">{selectedMember.custom_relation || selectedMember.relationship_type || 'Self'}</Badge>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}>
                  <Cake size={14} /> DOB & Age
                </div>
                <div style={{ fontWeight: 700 }}>
                  {selectedMember.date_of_birth || 'N/A'} {selectedMember.age !== null && selectedMember.age !== undefined ? `(${selectedMember.age} yrs)` : ''}
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}>
                  <User size={14} /> Gender
                </div>
                <div style={{ fontWeight: 700 }}>
                  {selectedMember.gender === 'M' ? 'Male' : selectedMember.gender === 'F' ? 'Female' : 'Other'}
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}>
                <Phone size={14} /> Mobile Phone Number
              </div>
              <div style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                {selectedMember.phone || 'N/A'}
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}>
                <MapPin size={14} /> Residential Address
              </div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                {selectedMember.address || 'Not provided'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
              <Button variant="primary" icon={Edit2} onClick={(e) => { setIsDetailModalOpen(false); handleOpenEditModal(selectedMember, e); }}>
                Edit Details
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Member Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Family Member Details (* Required)">
        <form onSubmit={handleAddMember}>
          <Input
            label="Full Name *"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
            placeholder="e.g. Sarah Smith"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Relationship *</label>
              <select
                value={formData.custom_relation}
                onChange={(e) => setFormData({ ...formData, custom_relation: e.target.value })}
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
                <option value="Aunty">Aunty</option>
                <option value="Uncle">Uncle</option>
                <option value="Friend">Friend</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Gender *</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="form-select"
                required
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Date of Birth (DOB) *"
              type="date"
              value={formData.date_of_birth}
              onChange={handleDobChange}
              required
            />

            <Input
              label="Age (Years) *"
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              required
              placeholder="e.g. 28"
            />
          </div>

          <Input
            label="Mobile Number *"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
            placeholder="e.g. +91 9876543210"
          />

          <div className="form-group">
            <label className="form-label">Address *</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              rows={3}
              className="form-input"
              placeholder="Full home or residential address..."
              style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Member Details
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Member Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Member Details">
        <form onSubmit={handleUpdateMember}>
          <Input
            label="Full Name *"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
            placeholder="e.g. Sarah Smith"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Relationship *</label>
              <select
                value={formData.custom_relation}
                onChange={(e) => setFormData({ ...formData, custom_relation: e.target.value })}
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
                <option value="Aunty">Aunty</option>
                <option value="Uncle">Uncle</option>
                <option value="Friend">Friend</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Gender *</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="form-select"
                required
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input
              label="Date of Birth (DOB) *"
              type="date"
              value={formData.date_of_birth}
              onChange={handleDobChange}
              required
            />

            <Input
              label="Age (Years) *"
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              required
              placeholder="e.g. 28"
            />
          </div>

          <Input
            label="Mobile Number *"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
            placeholder="e.g. +91 9876543210"
          />

          <div className="form-group">
            <label className="form-label">Address *</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              rows={3}
              className="form-input"
              placeholder="Full home or residential address..."
              style={{ background: 'rgba(15, 23, 42, 0.6)', color: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Update Details
            </Button>
          </div>
        </form>
      </Modal>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onBookingSuccess={fetchMembers}
      />
    </motion.div>
  );
};

export default MembersPage;
