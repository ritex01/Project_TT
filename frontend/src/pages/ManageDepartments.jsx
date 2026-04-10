import { useState, useEffect } from 'react';
import api from '../services/api';
import './ManageClassrooms.css';

const ManageDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ name: '', fullName: '', color: '#6366f1', batches: [] });
  const [newBatch, setNewBatch] = useState({ name: '' });
  const [newSection, setNewSection] = useState({ batchIdx: -1, name: '', sub1: '', sub2: '' });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/common/departments');
      setDepartments(res.data);
    } catch (err) {
      setError('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  // ─── BATCH MANAGEMENT ───
  const addBatch = () => {
    if (!newBatch.name) return;
    setForm(f => ({
      ...f,
      batches: [...f.batches, { name: newBatch.name.toUpperCase(), sections: [] }]
    }));
    setNewBatch({ name: '' });
  };

  const removeBatch = (idx) => {
    setForm(f => ({ ...f, batches: f.batches.filter((_, i) => i !== idx) }));
  };

  // ─── SECTION MANAGEMENT (within a batch) ───
  const addSection = (batchIdx) => {
    if (newSection.batchIdx !== batchIdx || !newSection.name) return;
    const subs = [newSection.sub1, newSection.sub2].filter(Boolean);
    setForm(f => {
      const updatedBatches = [...f.batches];
      updatedBatches[batchIdx] = {
        ...updatedBatches[batchIdx],
        sections: [...updatedBatches[batchIdx].sections, { name: newSection.name.toUpperCase(), subsections: subs }]
      };
      return { ...f, batches: updatedBatches };
    });
    setNewSection({ batchIdx: -1, name: '', sub1: '', sub2: '' });
  };

  const removeSection = (batchIdx, secIdx) => {
    setForm(f => {
      const updatedBatches = [...f.batches];
      updatedBatches[batchIdx] = {
        ...updatedBatches[batchIdx],
        sections: updatedBatches[batchIdx].sections.filter((_, i) => i !== secIdx)
      };
      return { ...f, batches: updatedBatches };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editing) {
        await api.put(`/admin/departments/${editing}`, form);
        setSuccess('Department updated');
      } else {
        await api.post('/admin/departments', form);
        setSuccess('Department created');
      }
      setForm({ name: '', fullName: '', color: '#6366f1', batches: [] });
      setEditing(null);
      fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleEdit = (dept) => {
    setForm({
      name: dept.name,
      fullName: dept.fullName,
      color: dept.color,
      batches: dept.batches || []
    });
    setEditing(dept._id);
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this department? All associated timetable entries and allotments will also be removed.')) return;
    try {
      await api.delete(`/admin/departments/${id}`);
      setSuccess('Department deleted');
      fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) return <div className="loading-spinner"></div>;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">Manage Departments</h1>
      </div>

      {error && <div className="msg-error">{error}</div>}
      {success && <div className="msg-success">{success}</div>}

      <div className="manage-layout">
        <div className="card manage-form-card">
          <h2 className="section-title">{editing ? 'Edit Department' : 'Add Department'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="dept-name">Short Name *</label>
              <input
                id="dept-name"
                placeholder="e.g., CSE"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="dept-full">Full Name *</label>
              <input
                id="dept-full"
                placeholder="e.g., Computer Science & Engineering"
                value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="dept-color">Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2%' }}>
                <input
                  id="dept-color"
                  type="color"
                  value={form.color}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  style={{ width: '3rem', height: '2.2rem', padding: '0.1rem', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{form.color}</span>
              </div>
            </div>

            {/* ─── BATCHES ─── */}
            <div className="form-group">
              <label>Batches</label>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.5rem 0' }}>
                Add batches (e.g., CSE, IT) — each batch has its own sections
              </p>

              {form.batches.map((batch, bIdx) => (
                <div key={bIdx} className="batch-block" style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '0.8rem',
                  marginBottom: '0.8rem',
                  background: 'var(--bg-secondary)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <strong style={{ fontSize: '0.9rem' }}>📦 {batch.name}</strong>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeBatch(bIdx)}>×</button>
                  </div>

                  {/* Sections within batch */}
                  <div className="section-builder">
                    {batch.sections.map((sec, sIdx) => (
                      <div key={sIdx} className="section-row">
                        <span style={{ fontWeight: 600 }}>{sec.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {sec.subsections.length > 0 ? `(${sec.subsections.join(', ')})` : '(No subsections)'}
                        </span>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => removeSection(bIdx, sIdx)}>×</button>
                      </div>
                    ))}

                    <div style={{ display: 'flex', gap: '2%', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                      <input
                        placeholder="Section (e.g., A)"
                        value={newSection.batchIdx === bIdx ? newSection.name : ''}
                        onFocus={() => setNewSection(s => ({ ...s, batchIdx: bIdx }))}
                        onChange={e => setNewSection(s => ({ ...s, batchIdx: bIdx, name: e.target.value }))}
                        style={{ width: '25%', minWidth: '60px' }}
                      />
                      <input
                        placeholder="Sub 1 (e.g., A1)"
                        value={newSection.batchIdx === bIdx ? newSection.sub1 : ''}
                        onFocus={() => setNewSection(s => ({ ...s, batchIdx: bIdx }))}
                        onChange={e => setNewSection(s => ({ ...s, batchIdx: bIdx, sub1: e.target.value }))}
                        style={{ width: '25%', minWidth: '60px' }}
                      />
                      <input
                        placeholder="Sub 2 (e.g., A2)"
                        value={newSection.batchIdx === bIdx ? newSection.sub2 : ''}
                        onFocus={() => setNewSection(s => ({ ...s, batchIdx: bIdx }))}
                        onChange={e => setNewSection(s => ({ ...s, batchIdx: bIdx, sub2: e.target.value }))}
                        style={{ width: '25%', minWidth: '60px' }}
                      />
                      <button type="button" className="btn btn-success btn-sm" onClick={() => addSection(bIdx)}>+ Sec</button>
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', gap: '2%', marginTop: '0.4rem' }}>
                <input
                  placeholder="Batch name (e.g., IT)"
                  value={newBatch.name}
                  onChange={e => setNewBatch({ name: e.target.value })}
                  style={{ flex: 1 }}
                />
                <button type="button" className="btn btn-success btn-sm" onClick={addBatch}>+ Batch</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '2%' }}>
              <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add'}</button>
              {editing && (
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setEditing(null);
                  setForm({ name: '', fullName: '', color: '#6366f1', batches: [] });
                }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="card manage-list-card">
          <h2 className="section-title">Departments ({departments.length})</h2>
          {departments.length === 0 ? (
            <div className="empty-state"><p>No departments yet</p></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Color</th>
                  <th>Name</th>
                  <th>Full Name</th>
                  <th>Batches</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map(d => (
                  <tr key={d._id}>
                    <td><span className="dept-color-swatch" style={{ background: d.color }}></span></td>
                    <td><strong>{d.name}</strong></td>
                    <td>{d.fullName}</td>
                    <td>
                      <div className="section-tags">
                        {d.batches?.map((b, i) => (
                          <span key={i} className="section-tag" style={{ borderLeft: `3px solid ${d.color}` }}>
                            <strong>{b.name}</strong>
                            {b.sections?.length > 0 && (
                              <span className="sub" style={{ marginLeft: '0.3rem' }}>
                                [{b.sections.map(s => s.name).join(', ')}]
                              </span>
                            )}
                          </span>
                        ))}
                        {(!d.batches || d.batches.length === 0) && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None</span>}
                      </div>
                    </td>
                    <td className="actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(d)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d._id)}>Delete</button>
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

export default ManageDepartments;
