import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const HospitalModal = ({ isOpen, onClose, onSave, hospital }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    phone: '',
    email: '',
    address: '',
    is_active: true,
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (hospital) {
      setFormData({
        name: hospital.name || '',
        code: hospital.code || '',
        phone: hospital.phone || '',
        email: hospital.email || '',
        address: hospital.address || '',
        is_active: hospital.is_active ?? true,
      });
    } else {
      setFormData({
        name: '',
        code: `HOSP_${Math.floor(100 + Math.random() * 900)}`,
        phone: '',
        email: '',
        address: '',
        is_active: true,
      });
    }
  }, [hospital, isOpen]);

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
      await onSave(formData, hospital?.id);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={hospital ? 'Edit Hospital Organization' : 'Register New Hospital'}
    >
      <form onSubmit={handleSubmit}>
        <Input
          label="Hospital Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="e.g. City General Hospital"
        />

        <Input
          label="Hospital Code"
          name="code"
          value={formData.code}
          onChange={handleChange}
          required
          placeholder="e.g. CITY_GEN_01"
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Contact phone"
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Contact email"
          />
        </div>

        <Input
          label="Address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          placeholder="Physical address"
        />

        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            style={{ width: 18, height: 18, cursor: 'pointer' }}
          />
          <label htmlFor="is_active" className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>
            Hospital Active Status
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading}>
            {hospital ? 'Update Hospital' : 'Create Hospital'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default HospitalModal;
