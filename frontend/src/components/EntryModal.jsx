import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './EntryModal.css';

const EntryModal = ({ isOpen, onClose, day, timeSlot, classroomId, existingEntry, departments, onSaved }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isHod = user?.role === 'hod';

  const [form, setForm] = useState({
    department: '',
    batch: '',
    year: 1,
    section: '',
    subsection: '',
    type: 'lecture',
    subject: '',
    faculty: ''
  });

  const [facultyList, setFacultyList] = useState([]);
  const [busyFacultyIds, setBusyFacultyIds] = useState([]);
  const [batches, setBatches] = useState([]);
  const [sections, setSections] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Pre-fill for HOD
  useEffect(() => {
    if (isOpen) {
      if (existingEntry) {
        setForm({
          department: existingEntry.department?._id || existingEntry.department || '',
          batch: existingEntry.batch || '',
          year: existingEntry.year || 1,
          section: existingEntry.section || '',
          subsection: existingEntry.subsection || '',
          type: existingEntry.type || 'lecture',
          subject: existingEntry.subject || '',
          faculty: existingEntry.faculty?._id || existingEntry.faculty || ''
        });
      } else {
        setForm(f => ({
          ...f,
          department: isHod ? (user.department?._id || '') : '',
          batch: '',
          section: '',
          subsection: '',
          faculty: '',
          subject: ''
        }));
      }
      setConflicts([]);
      setError('');
      setConfirmDelete(false);
    }
  }, [isOpen, existingEntry, isHod, user]);

  // Load department batches
  useEffect(() => {
    if (form.department) {
      const dept = departments.find(d => d._id === form.department);
      setBatches(dept?.batches || []);
    } else {
      setBatches([]);
    }
  }, [form.department, departments]);

  // Load batch sections
  useEffect(() => {
    if (form.batch) {
      const batch = batches.find(b => b._id === form.batch || b.name === form.batch);
      setSections(batch?.sections || []);
    } else {
      setSections([]);
    }
  }, [form.batch, batches]);

  // Load faculty for selected department
  useEffect(() => {
    if (form.department) {
      api.get(`/common/faculty?department=${form.department}`)
        .then(res => setFacultyList(res.data))
        .catch(() => setFacultyList([]));
    } else {
      api.get('/common/faculty')
        .then(res => setFacultyList(res.data))
        .catch(() => setFacultyList([]));
    }
  }, [form.department]);

  // Fetch busy faculty for this day+timeSlot (across all classrooms)
  // so HOD can't assign a faculty who already has a class at this time
  useEffect(() => {
    if (!isOpen || !day || timeSlot === undefined) {
      setBusyFacultyIds([]);
      return;
    }

    const slotsToCheck = form.type === 'lab' ? [timeSlot, timeSlot + 1] : [timeSlot];

    api.get('/common/timetable', { params: { day } })
      .then(res => {
        const entries = res.data || [];
        // Find faculty who are busy in any of the slots we need
        const busyIds = new Set();
        entries.forEach(e => {
          if (slotsToCheck.includes(e.timeSlot) && e.faculty) {
            const fId = e.faculty._id || e.faculty;
            // Don't mark as busy if editing an existing entry (self)
            if (existingEntry && (existingEntry._id === e._id)) return;
            busyIds.add(fId);
          }
        });
        setBusyFacultyIds([...busyIds]);
      })
      .catch(() => setBusyFacultyIds([]));
  }, [isOpen, day, timeSlot, form.type, existingEntry]);

  // Check conflicts when key fields change
  useEffect(() => {
    if (!isOpen || !classroomId || !day || timeSlot === undefined || !form.faculty) return;
    if (existingEntry) return; // Skip conflict check for existing entries

    const params = new URLSearchParams({
      classroom: classroomId,
      day,
      timeSlot,
      faculty: form.faculty,
      department: form.department,
      section: form.section,
      type: form.type
    });
    if (form.subsection) params.set('subsection', form.subsection);

    const endpoint = isAdmin ? null : '/hod/conflicts';
    if (!endpoint) { setConflicts([]); return; }

    api.get(`${endpoint}?${params}`)
      .then(res => setConflicts(res.data.conflicts || []))
      .catch(() => setConflicts([]));
  }, [form.faculty, form.section, form.subsection, form.type, classroomId, day, timeSlot, isOpen]);

  const handleChange = (field, value) => {
    setForm(f => {
      const updated = { ...f, [field]: value };
      if (field === 'type' && value === 'lecture') {
        updated.subsection = '';
      }
      if (field === 'department') {
        updated.batch = '';
        updated.section = '';
        updated.subsection = '';
        updated.faculty = '';
      }
      if (field === 'batch') {
        updated.section = '';
        updated.subsection = '';
      }
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!form.department || !form.section || !form.faculty) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Resolve batch name from batch id
      const selectedBatch = batches.find(b => b._id === form.batch);
      const batchName = selectedBatch?.name || form.batch || '';

      const payload = {
        classroom: classroomId,
        day,
        timeSlot,
        department: form.department,
        faculty: form.faculty,
        batch: batchName,
        section: form.section,
        subsection: form.subsection || null,
        subject: form.subject,
        year: Number(form.year),
        type: form.type
      };

      const endpoint = isAdmin ? '/admin/timetable' : '/hod/timetable';

      if (existingEntry) {
        await api.put(`/hod/timetable/${existingEntry._id}`, payload);
      } else {
        await api.post(endpoint, payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingEntry) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setLoading(true);
    try {
      const endpoint = isAdmin ? `/admin/timetable/${existingEntry._id}` : `/hod/timetable/${existingEntry._id}`;
      await api.delete(endpoint);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const conflictFacultyIds = conflicts.filter(c => c.type === 'faculty').map(c => c.facultyId);

  const selectedSection = sections.find(s => s.name === form.section);

  const TIME_LABELS = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content entry-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{existingEntry ? 'Edit Entry' : 'Add Timetable Entry'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="entry-meta">
          <span className="meta-badge">{day}</span>
          <span className="meta-badge">{TIME_LABELS[timeSlot] || `Slot ${timeSlot}`}</span>
        </div>

        {error && <div className="msg-error">{error}</div>}

        {conflicts.length > 0 && (
          <div className="msg-warning">
            <strong>⚠ Conflicts detected:</strong>
            <ul className="conflict-list">
              {conflicts.map((c, i) => <li key={i}>{c.message}</li>)}
            </ul>
          </div>
        )}

        <div className="modal-body">
          <div className="form-group">
            <label>Department *</label>
            <select
              value={form.department}
              onChange={e => handleChange('department', e.target.value)}
              disabled={isHod}
            >
              <option value="">Select Department</option>
              {departments.map(d => (
                <option key={d._id} value={d._id}>{d.name} - {d.fullName}</option>
              ))}
            </select>
          </div>

          {batches.length > 0 && (
            <div className="form-group">
              <label>Batch *</label>
              <select value={form.batch} onChange={e => handleChange('batch', e.target.value)}>
                <option value="">Select Batch</option>
                {batches.map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Year *</label>
              <select value={form.year} onChange={e => handleChange('year', e.target.value)}>
                {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Type *</label>
              <select value={form.type} onChange={e => handleChange('type', e.target.value)}>
                <option value="lecture">Lecture</option>
                <option value="lab">Lab (2 hours)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Section *</label>
              <select value={form.section} onChange={e => handleChange('section', e.target.value)}>
                <option value="">Select Section</option>
                {sections.map(s => (
                  <option key={s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            {form.type === 'lab' && selectedSection?.subsections?.length > 0 && (
              <div className="form-group">
                <label>Subsection</label>
                <select value={form.subsection} onChange={e => handleChange('subsection', e.target.value)}>
                  <option value="">Full Section</option>
                  {selectedSection.subsections.map(ss => (
                    <option key={ss} value={ss}>{ss}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Subject</label>
            <input
              type="text"
              placeholder="e.g., Data Structures"
              value={form.subject}
              onChange={e => handleChange('subject', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Faculty * {isHod && busyFacultyIds.length > 0 && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                ({busyFacultyIds.length} busy at this slot)
              </span>
            )}</label>
            <select value={form.faculty} onChange={e => handleChange('faculty', e.target.value)}>
              <option value="">Select Faculty</option>
              {facultyList
                .filter(f => {
                  // For HOD: hide faculty who are already busy at this day+timeslot
                  if (isHod && busyFacultyIds.includes(f._id)) return false;
                  return true;
                })
                .map(f => {
                  const hasConflict = conflictFacultyIds.includes(f._id);
                  // For admin: show all but mark conflicts
                  const isBusy = isAdmin && busyFacultyIds.includes(f._id);
                  return (
                    <option
                      key={f._id}
                      value={f._id}
                      disabled={hasConflict && !isAdmin}
                      style={(hasConflict || isBusy) ? { color: '#94a3b8' } : {}}
                    >
                      {f.name} ({f.authId}){hasConflict ? ' ⚠ Conflict' : ''}{isBusy ? ' ⏳ Busy' : ''}
                    </option>
                  );
                })}
            </select>
          </div>
        </div>

        <div className="modal-footer">
          {existingEntry && (
            <button
              className={`btn ${confirmDelete ? 'btn-danger' : 'btn-secondary'}`}
              onClick={handleDelete}
              disabled={loading}
            >
              {confirmDelete ? 'Confirm Delete?' : 'Delete'}
            </button>
          )}
          <div style={{ flex: 1 }}></div>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : (existingEntry ? 'Update' : 'Add Entry')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EntryModal;
