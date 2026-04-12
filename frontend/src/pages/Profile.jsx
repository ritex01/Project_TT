import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Profile.css';

const DESIGNATIONS = ['Mr', 'Mrs', 'Ms', 'Dr', 'Prof'];

const Profile = () => {
  const { user, login } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    designation: user?.designation || '',
    phone: user?.phone || ''
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    setLoading(true);
    try {
      const res = await api.put('/auth/profile', {
        name: form.name,
        designation: form.designation || null,
        phone: form.phone || null
      });
      setMessage(res.data.message);
      // Refresh user in context by re-fetching
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 4) {
      setError('New password must be at least 4 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await api.put('/auth/profile', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      });
      setMessage(res.data.message + ' Password changed successfully.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'hod': return 'Head of Department';
      case 'faculty': return 'Faculty Member';
      default: return role;
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
      </div>

      {message && <div className="msg-success">{message}</div>}
      {error && <div className="msg-error">{error}</div>}

      <div className="profile-grid">
        {/* Profile Info Card */}
        <div className="profile-card">
          <div className="profile-card-header">
            <div className="profile-avatar-large">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="profile-header-info">
              <h2>{user?.designation ? `${user.designation}. ` : ''}{user?.name}</h2>
              <p className="profile-role">{getRoleLabel(user?.role)}</p>
              {user?.department && <p className="profile-dept">{user.department.name} Department</p>}
              <span className="profile-authid">{user?.authId}</span>
            </div>
          </div>

          <form onSubmit={handleProfileSave} className="profile-form">
            <h3 className="profile-section-title">Personal Information</h3>

            <div className="profile-form-row">
              <div className="form-group">
                <label htmlFor="profile-name">Full Name</label>
                <input
                  id="profile-name"
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="profile-designation">Designation</label>
                <select
                  id="profile-designation"
                  value={form.designation}
                  onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
                >
                  <option value="">None</option>
                  {DESIGNATIONS.map(d => (
                    <option key={d} value={d}>{d}.</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="profile-form-row">
              <div className="form-group">
                <label htmlFor="profile-phone">Phone Number</label>
                <input
                  id="profile-phone"
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="profile-email">Email</label>
                <input id="profile-email" type="email" value={user?.email || ''} disabled className="input-disabled" />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Password Card */}
        <div className="profile-card profile-password-card">
          <h3 className="profile-section-title">Change Password</h3>
          <form onSubmit={handlePasswordChange} className="profile-form">
            <div className="form-group">
              <label htmlFor="pw-current">Current Password</label>
              <input
                id="pw-current"
                type="password"
                placeholder="••••••••"
                value={pwForm.currentPassword}
                onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="pw-new">New Password</label>
              <input
                id="pw-new"
                type="password"
                placeholder="••••••••"
                value={pwForm.newPassword}
                onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                required
                minLength={4}
              />
            </div>
            <div className="form-group">
              <label htmlFor="pw-confirm">Confirm New Password</label>
              <input
                id="pw-confirm"
                type="password"
                placeholder="••••••••"
                value={pwForm.confirmPassword}
                onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                required
                minLength={4}
              />
            </div>
            <button type="submit" className="btn btn-secondary" disabled={loading} style={{ marginTop: '1rem' }}>
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
