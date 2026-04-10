import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Login.css';

const ROLE_CARDS = [
  {
    role: 'admin',
    icon: '🛡️',
    title: 'Administrator',
    desc: 'Full system control. Manage classrooms, departments, users, and allotments.',
    color: '#ef4444'
  },
  {
    role: 'hod',
    icon: '🎓',
    title: 'Head of Department',
    desc: 'Manage timetable entries for your department within allotted blocks.',
    color: '#f59e0b'
  },
  {
    role: 'faculty',
    icon: '👩‍🏫',
    title: 'Faculty',
    desc: 'View timetable and your personal teaching schedule.',
    color: '#6366f1'
  }
];

const Register = () => {
  const [step, setStep] = useState('role'); // 'role' or 'details'
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: '', departmentId: ''
  });
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/auth/departments')
      .then(res => setDepartments(res.data))
      .catch(() => {});
  }, []);

  const selectRole = (role) => {
    setForm(f => ({ ...f, role }));
    setStep('details');
    setError('');
  };

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        departmentId: form.role !== 'admin' ? form.departmentId : undefined
      };
      const result = await register(data);
      setSuccess(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card fade-in">
          <div className="auth-success">
            <span className="auth-icon">✅</span>
            <h2>Registration Successful!</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '2% 0' }}>Your authorization ID is:</p>
            <div className="auth-id-display">{success.authId}</div>
            {!success.approved && (
              <div className="pending-notice">
                <span className="pending-icon">⏳</span>
                <p>Your account is <strong>pending admin approval</strong>.</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  You can log in, but access is limited until an administrator approves your account.
                </p>
              </div>
            )}
            {success.approved && (
              <p style={{ color: 'var(--success)', fontSize: '0.85rem', marginBottom: '4%' }}>
                ✓ Auto-approved as first system user
              </p>
            )}
            <Link to="/login" className="btn btn-primary auth-btn">Go to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Role selection
  if (step === 'role') {
    return (
      <div className="auth-page">
        <div className="auth-card auth-card-wide fade-in">
          <div className="auth-header">
            <span className="auth-icon">📅</span>
            <h1>Create Account</h1>
            <p>Select your role to get started</p>
          </div>

          <div className="role-cards">
            {ROLE_CARDS.map(r => (
              <button
                key={r.role}
                className="role-card"
                onClick={() => selectRole(r.role)}
                style={{ '--role-color': r.color }}
              >
                <span className="role-card-icon">{r.icon}</span>
                <h3 className="role-card-title">{r.title}</h3>
                <p className="role-card-desc">{r.desc}</p>
                <span className="role-card-arrow">→</span>
              </button>
            ))}
          </div>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    );
  }

  // Step 2: Details form
  const selectedRole = ROLE_CARDS.find(r => r.role === form.role);

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-header">
          <span className="auth-icon">{selectedRole?.icon || '📅'}</span>
          <h1>Register as {selectedRole?.title}</h1>
          <p>Fill in your details below</p>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => { setStep('role'); setError(''); }}
          style={{ marginBottom: '1rem', fontSize: '0.8rem' }}
        >
          ← Change Role
        </button>

        {error && <div className="msg-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="reg-name">Full Name</label>
            <input
              id="reg-name"
              type="text"
              placeholder="John Doe"
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              type="email"
              placeholder="you@college.edu"
              value={form.email}
              onChange={e => handleChange('email', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => handleChange('password', e.target.value)}
              required
              minLength={4}
            />
          </div>

          {form.role !== 'admin' && (
            <div className="form-group">
              <label htmlFor="reg-dept">Department</label>
              <select
                id="reg-dept"
                value={form.departmentId}
                onChange={e => handleChange('departmentId', e.target.value)}
                required
              >
                <option value="">Select Department</option>
                {departments.map(d => (
                  <option key={d._id} value={d._id}>{d.name} - {d.fullName}</option>
                ))}
              </select>
              {departments.length === 0 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>
                  No departments exist yet. An admin must create them first.
                </span>
              )}
            </div>
          )}

          <button type="submit" className="btn btn-primary auth-btn" disabled={loading} id="btn-register">
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
