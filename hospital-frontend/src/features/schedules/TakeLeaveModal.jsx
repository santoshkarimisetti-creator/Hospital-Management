import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const TakeLeaveModal = ({ isOpen, onClose, onSave, doctorId }) => {
  const [formData, setFormData] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!doctorId) {
      setError('Please select or assign a Doctor profile to submit leave.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onSave({
        doctor: doctorId,
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason,
        is_approved: true,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.end_date || err.response?.data?.detail || 'Failed to submit leave.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request / Schedule Doctor Leave">
      {error && <div className="alert-box alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label="Start Date"
            name="start_date"
            type="date"
            value={formData.start_date}
            onChange={handleChange}
            required
          />
          <Input
            label="End Date"
            name="end_date"
            type="date"
            value={formData.end_date}
            onChange={handleChange}
            required
          />
        </div>

        <Input
          label="Leave Reason / Remarks"
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          placeholder="e.g. Medical Conference / Personal Leave"
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading}>
            Submit Leave Request
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TakeLeaveModal;
