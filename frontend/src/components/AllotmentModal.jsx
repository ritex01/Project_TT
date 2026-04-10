import { useState } from 'react';
import './EntryModal.css';

const TIME_LABELS = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

const AllotmentModal = ({ isOpen, onClose, day, timeSlot, departments, existingAllotment, onSave, onRemove }) => {
  const [selectedDept, setSelectedDept] = useState(existingAllotment?.department?._id || '');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!selectedDept) return;
    setLoading(true);
    try {
      await onSave(day, timeSlot, selectedDept);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!existingAllotment) return;
    setLoading(true);
    try {
      await onRemove(existingAllotment._id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content entry-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2>{existingAllotment ? 'Edit Allotment' : 'Allot Slot'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="entry-meta">
          <span className="meta-badge">{day}</span>
          <span className="meta-badge">{TIME_LABELS[timeSlot] || `Slot ${timeSlot}`}</span>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Department *</label>
            <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
              <option value="">Select Department</option>
              {departments.map(d => (
                <option key={d._id} value={d._id}>
                  {d.name} - {d.fullName}
                </option>
              ))}
            </select>
          </div>

          {existingAllotment && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Currently allotted to: <strong style={{ color: existingAllotment.department?.color }}>
                {existingAllotment.department?.name}
              </strong>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {existingAllotment && (
            <button className="btn btn-danger" onClick={handleRemove} disabled={loading}>
              Remove
            </button>
          )}
          <div style={{ flex: 1 }}></div>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading || !selectedDept}>
            {loading ? 'Saving...' : (existingAllotment ? 'Update' : 'Allot')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AllotmentModal;
