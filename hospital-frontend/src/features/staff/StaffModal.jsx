import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const StaffModal = ({ isOpen, onClose, onSave, hospitals }) => {
  const [formData, setFormData] = useState({
    user_id: '',
    hospital_id: '',
    role_id: '2', // Default Hospital Admin
    is_active: true,
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (hospitals.length > 0) {
      setFormData((prev) => ({
        ...prev,
        hospital_id: prev.hospital_id || hospitals[0].id.toString(),
      }));
    }
  }, [hospitals, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave({
        user: parseInt(formData.user_id, 10),
        hospital: parseInt(formData.hospital_id, 10),
        role: parseInt(formData.role_id, 10),
        is_active: formData.is_active,
      });
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Hospital Staff Member"
    >
      <form onSubmit={handleSubmit}>
        <Input
          label="User ID"
          name="user_id"
          type="number"
          value={formData.user_id}
          onChange={handleChange}
          required
          placeholder="e.g. 1 (User ID from database)"
        />

        <div className="form-group">
          <label className="form-label">Hospital</label>
          <select
            name="hospital_id"
            value={formData.hospital_id}
            onChange={handleChange}
            className="form-select"
            required
          >
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.code})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">System Role</label>
          <select
            name="role_id"
            value={formData.role_id}
            onChange={handleChange}
            className="form-select"
            required
          >
            <option value="2">Hospital Admin</option>
            <option value="3">Receptionist</option>
            <option value="4">Doctor</option>
          </select>
        </div>

        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            id="staff_is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            style={{ width: 18, height: 18, cursor: 'pointer' }}
          />
          <label htmlFor="staff_is_active" className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>
            Staff Member Active Status
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading}>
            Assign Staff Member
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default StaffModal;
