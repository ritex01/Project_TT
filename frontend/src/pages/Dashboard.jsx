import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/common/stats')
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'hod': return 'Head of Department';
      case 'faculty': return 'Faculty Member';
      default: return role;
    }
  };

  if (loading) return <div className="loading-spinner"></div>;

  return (
    <div className="page-container fade-in">
      <div className="dashboard-welcome">
        <div>
          <h1 className="page-title">Welcome back, {user?.name} 👋</h1>
          <p className="dashboard-subtitle">
            {getRoleLabel(user?.role)}
            {user?.department && ` · ${user.department.name} Department`}
          </p>
          <p className="dashboard-authid">ID: {user?.authId}</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏫</div>
          <div className="stat-info">
            <span className="stat-number">{stats?.classrooms || 0}</span>
            <span className="stat-label">Classrooms</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏛️</div>
          <div className="stat-info">
            <span className="stat-number">{stats?.departments || 0}</span>
            <span className="stat-label">Departments</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <span className="stat-number">{stats?.users || 0}</span>
            <span className="stat-label">Users</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-info">
            <span className="stat-number">{stats?.entries || 0}</span>
            <span className="stat-label">Total Entries</span>
          </div>
        </div>

        {user?.role === 'hod' && (
          <>
            <div className="stat-card accent">
              <div className="stat-icon">📋</div>
              <div className="stat-info">
                <span className="stat-number">{stats?.deptEntries || 0}</span>
                <span className="stat-label">Dept Entries</span>
              </div>
            </div>
            <div className="stat-card accent">
              <div className="stat-icon">👨‍🏫</div>
              <div className="stat-info">
                <span className="stat-number">{stats?.deptFaculty || 0}</span>
                <span className="stat-label">Dept Faculty</span>
              </div>
            </div>
          </>
        )}

        {user?.role === 'faculty' && (
          <div className="stat-card accent">
            <div className="stat-icon">📖</div>
            <div className="stat-info">
              <span className="stat-number">{stats?.myEntries || 0}</span>
              <span className="stat-label">My Classes</span>
            </div>
          </div>
        )}
      </div>

      <div className="quick-actions">
        <h2 className="section-title">Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/timetable" className="action-card">
            <span className="action-icon">📅</span>
            <span className="action-label">View Timetable</span>
          </Link>

          {(user?.role === 'faculty' || user?.role === 'hod') && (
            <Link to="/my-schedule" className="action-card">
              <span className="action-icon">🗓️</span>
              <span className="action-label">My Schedule</span>
            </Link>
          )}

          {user?.role === 'admin' && (
            <>
              <Link to="/manage/classrooms" className="action-card">
                <span className="action-icon">🏫</span>
                <span className="action-label">Manage Classrooms</span>
              </Link>
              <Link to="/manage/departments" className="action-card">
                <span className="action-icon">🏛️</span>
                <span className="action-label">Manage Departments</span>
              </Link>
              <Link to="/manage/users" className="action-card">
                <span className="action-icon">👥</span>
                <span className="action-label">Manage Users</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
