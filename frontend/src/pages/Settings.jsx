import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './ManageClassrooms.css'; // Reuse basic manage styling

const Settings = () => {
  const { systemSettings, setSystemSettings } = useAuth();
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (systemSettings && systemSettings.timeSlots) {
      // Sort strictly to ensure they are sequential
      const sorted = [...systemSettings.timeSlots].sort((a,b)=>a.slot - b.slot);
      setTimeSlots(sorted);
    }
  }, [systemSettings]);

  const addSlot = () => {
    const nextSlotIdx = timeSlots.length > 0 ? Math.max(...timeSlots.map(t=>t.slot)) + 1 : 0;
    const newSlot = { slot: nextSlotIdx, label: `${nextSlotIdx + 9}:00` };
    setTimeSlots([...timeSlots, newSlot]);
  };

  const removeSlot = (slotIdx) => {
    setTimeSlots(timeSlots.filter(t => t.slot !== slotIdx));
  };

  const updateLabel = (slotIdx, label) => {
    setTimeSlots(timeSlots.map(t => t.slot === slotIdx ? { ...t, label } : t));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      // Ensure slots are sequential properly
      const formattedSlots = timeSlots
        .sort((a, b) => a.slot - b.slot)
        .map((t, idx) => ({ slot: idx, label: t.label }));
      
      const res = await api.put('/admin/settings', { timeSlots: formattedSlots });
      setSystemSettings(res.data);
      setTimeSlots(res.data.timeSlots);
      setMessage('Settings saved successfully!');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">System Settings</h1>
      </div>

      <div className="manage-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0 auto' }}>
        <div className="manage-card">
          <h2>Timetable Timeslots</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            Configure the daily timeslots available in the timetable grids across the system. 
            If you delete a timeslot, existing database entries mapped to that timeslot index will be hidden.
          </p>
          
          {message && <div style={{ marginBottom: '1rem', color: message.includes('success') ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{message}</div>}

          <form onSubmit={handleSave}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', background: 'var(--bg)', padding: '1rem', borderRadius: '8px' }}>
              {timeSlots.map((ts, idx) => (
                <div key={ts.slot} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, width: '60px' }}>Slot {idx}</span>
                  <input
                    type="text"
                    value={ts.label}
                    onChange={(e) => updateLabel(ts.slot, e.target.value)}
                    required
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }}
                  />
                  <button type="button" onClick={() => removeSlot(ts.slot)} className="action-btn delete-btn" title="Remove Slot">
                    🗑️
                  </button>
                </div>
              ))}
              
              <button type="button" onClick={addSlot} className="btn btn-secondary" style={{ marginTop: '1rem', alignSelf: 'flex-start' }}>
                + Add Timeslot
              </button>
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ marginTop: '2rem' }} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
