import { useAuth } from '../context/AuthContext';
import './Login.css';

const AwaitingApproval = () => {
  const { user, logout } = useAuth();

  return (
    <div className="awaiting-page">
      <div className="card awaiting-card fade-in">
        <span className="awaiting-icon">⏳</span>
        <h2>Awaiting Admin Approval</h2>
        <div className={`awaiting-role-badge ${user?.role}`}>
          {user?.role}
        </div>
        <p>
          Your account <strong>({user?.name})</strong> has been created but is not yet approved by an administrator.
        </p>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Once approved, you will gain full access to the timetable management system
          based on your role permissions.
        </p>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Auth ID: <code style={{ fontWeight: 600 }}>{user?.authId}</code>
        </p>
        <button
          className="btn btn-secondary"
          onClick={logout}
          style={{ marginTop: '1.5rem' }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default AwaitingApproval;
