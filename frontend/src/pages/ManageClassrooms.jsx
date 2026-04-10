import { useState, useEffect } from 'react';
import api from '../services/api';
import './ManageClassrooms.css';

const ManageClassrooms = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [form, setForm] = useState({ name: '', building: '', capacity: 60 });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchClassrooms = async () => {
    try {
      const res = await api.get('/common/classrooms');
      setClassrooms(res.data);
    } catch (err) {
      setError('Failed to load classrooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClassrooms(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editing) {
        await api.put(`/admin/classrooms/${editing}`, form);
        setSuccess('Classroom updated');
      } else {
        await api.post('/admin/classrooms', form);
        setSuccess('Classroom created');
      }
      setForm({ name: '', building: '', capacity: 60 });
      setEditing(null);
      fetchClassrooms();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleEdit = (cr) => {
    setForm({ name: cr.name, building: cr.building || '', capacity: cr.capacity || 60 });
    setEditing(cr._id);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this classroom? All associated timetable entries will also be removed.')) return;
    try {
      await api.delete(`/admin/classrooms/${id}`);
      setSuccess('Classroom deleted');
      fetchClassrooms();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) return <div className="loading-spinner"></div>;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">Manage Classrooms</h1>
      </div>

      {error && <div className="msg-error">{error}</div>}
      {success && <div className="msg-success">{success}</div>}

      <div className="manage-layout">
        <div className="card manage-form-card">
          <h2 className="section-title">{editing ? 'Edit Classroom' : 'Add Classroom'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="cr-name">Name *</label>
              <input
                id="cr-name"
                placeholder="e.g., CR-101"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="cr-building">Building</label>
              <input
                id="cr-building"
                placeholder="e.g., Block A"
                value={form.building}
                onChange={e => setForm(f => ({ ...f, building: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="cr-capacity">Capacity</label>
              <input
                id="cr-capacity"
                type="number"
                min="1"
                value={form.capacity}
                onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))}
              />
            </div>
            <div style={{ display: 'flex', gap: '2%' }}>
              <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add'}</button>
              {editing && (
                <button type="button" className="btn btn-secondary" onClick={() => { setEditing(null); setForm({ name: '', building: '', capacity: 60 }); }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="card manage-list-card">
          <h2 className="section-title">Classrooms ({classrooms.length})</h2>
          {classrooms.length === 0 ? (
            <div className="empty-state"><p>No classrooms yet</p></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Building</th>
                  <th>Capacity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classrooms.map(cr => (
                  <tr key={cr._id}>
                    <td><strong>{cr.name}</strong></td>
                    <td>{cr.building || '-'}</td>
                    <td>{cr.capacity}</td>
                    <td className="actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(cr)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(cr._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageClassrooms;
