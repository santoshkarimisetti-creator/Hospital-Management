import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const RevisitModal = ({ isOpen, onClose, onSave, patient }) => {
  const defaultRevisitDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [revisitDate, setRevisitDate] = useState(defaultRevisitDate);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!revisitDate) {
      setError('Please select a valid revisit date.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onSave(patient.id, revisitDate, notes);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Failed to record revisit.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Schedule Revisit for ${patient?.member_name || 'Patient'}`}>
      {error && <div className="alert-box alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <Input
          label="Revisit Date"
          type="date"
          value={revisitDate}
          onChange={(e) => setRevisitDate(e.target.value)}
          required
        />

        <div className="form-group">
          <label className="form-label">Doctor Clinical Notes / Instructions</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="form-input"
            rows={3}
            placeholder="e.g. Review blood test results; follow up on prescription response."
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading}>
            Schedule Revisit & Save History
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RevisitModal;
