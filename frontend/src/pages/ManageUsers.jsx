import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './ManageClassrooms.css';

const ManageUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionInProgress, setActionInProgress] = useState(null); // track which user ID is being acted on

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // Auto-clear messages after 4 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleApprove = async (id, name) => {
    try {
      setError('');
      setSuccess('');
      setActionInProgress(id);
      const res = await api.put(`/admin/users/${id}/approve`);
      setSuccess(res.data.message);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve user');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (id, name) => {
    if (!window.confirm(`Reject and remove user "${name}"?\n\nThis will permanently delete their pending account.`)) return;
    try {
      setError('');
      setSuccess('');
      setActionInProgress(id);
      const res = await api.delete(`/admin/users/${id}/reject`);
      setSuccess(res.data.message);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject user');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (id, name) => {
    // Prevent admin from deleting themselves
    if (id === currentUser?.id) {
      setError('You cannot delete your own account.');
      return;
    }
    if (!window.confirm(`Delete user "${name}"?\n\nThis action cannot be undone. All data associated with this user may be affected.`)) return;
    try {
      setError('');
      setSuccess('');
      setActionInProgress(id);
      await api.delete(`/admin/users/${id}`);
      setSuccess(`User "${name}" has been deleted.`);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionInProgress(null);
    }
  };

  if (loading) return <div className="loading-spinner"></div>;

  const pendingUsers = users.filter(u => !u.approved);
  const approvedUsers = users.filter(u => u.approved);

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">Manage Users</h1>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          {users.length} registered users · {pendingUsers.length} pending
        </span>
      </div>

      {error && <div className="msg-error">{error}</div>}
      {success && <div className="msg-success">{success}</div>}

      {/* Pending Approvals Section */}
      {pendingUsers.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #f59e0b' }}>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⏳</span> Pending Approvals ({pendingUsers.length})
          </h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Auth ID</th>
                <th>Department</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map(u => (
                <tr key={u._id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                  <td><code style={{ fontSize: '0.78rem' }}>{u.authId}</code></td>
                  <td>{u.department?.name || '-'}</td>
                  <td className="actions">
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleApprove(u._id, u.name)}
                      disabled={actionInProgress === u._id}
                    >
                      {actionInProgress === u._id ? '...' : '✓ Approve'}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleReject(u._id, u.name)}
                      disabled={actionInProgress === u._id}
                    >
                      {actionInProgress === u._id ? '...' : '✗ Reject'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Approved Users Section */}
      <div className="card">
        <h2 className="section-title">Approved Users ({approvedUsers.length})</h2>
        {approvedUsers.length === 0 ? (
          <div className="empty-state"><p>No approved users yet</p></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Auth ID</th>
                <th>Department</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {approvedUsers.map(u => (
                <tr key={u._id}>
                  <td>
                    <strong>{u.name}</strong>
                    {u._id === currentUser?.id && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--primary)', marginLeft: '0.4rem' }}>(you)</span>
                    )}
                  </td>
                  <td>{u.email}</td>
                  <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                  <td><code style={{ fontSize: '0.78rem' }}>{u.authId}</code></td>
                  <td>{u.department?.name || '-'}</td>
                  <td>
                    {u._id === currentUser?.id ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                    ) : (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(u._id, u.name)}
                        disabled={actionInProgress === u._id}
                      >
                        {actionInProgress === u._id ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ManageUsers;
