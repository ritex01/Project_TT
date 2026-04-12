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

  const isFacultyOrHod = user?.role === 'faculty' || user?.role === 'hod';
  const isAdmin = user?.role === 'admin';

  return (
    <div className="page-container fade-in">
      {/* Welcome */}
      <div className="dashboard-welcome">
        <div>
          <h1 className="page-title">Welcome back, {user?.name} 👋</h1>
          <p className="dashboard-subtitle">
            {getRoleLabel(user?.role)}
            {user?.department && ` · ${user.department.name} Department`}
          </p>
        </div>
      </div>

      {/* Top row: Stats + Next Class widget */}
      <div className="dashboard-top-row">
        {/* Stat Cards */}
        <div className="stats-grid">
          <div className="stat-card-v2">
            <div className="stat-icon-box" style={{ background: 'linear-gradient(310deg, #7928CA 0%, #FF0080 100%)' }}>🏫</div>
            <div className="stat-info">
              <span className="stat-label">Classrooms</span>
              <div className="stat-number-row">
                <span className="stat-number">{stats?.classrooms || 0}</span>
              </div>
            </div>
          </div>

          <div className="stat-card-v2">
            <div className="stat-icon-box" style={{ background: 'linear-gradient(310deg, #2152FF 0%, #21D4FD 100%)' }}>🏛️</div>
            <div className="stat-info">
              <span className="stat-label">Departments</span>
              <div className="stat-number-row">
                <span className="stat-number">{stats?.departments || 0}</span>
              </div>
            </div>
          </div>

          <div className="stat-card-v2">
            <div className="stat-icon-box" style={{ background: 'linear-gradient(310deg, #17ad37 0%, #98ec2d 100%)' }}>👥</div>
            <div className="stat-info">
              <span className="stat-label">Total Users</span>
              <div className="stat-number-row">
                <span className="stat-number">{stats?.users || 0}</span>
                {isAdmin && stats?.pendingUsers > 0 && (
                  <span className="stat-badge pending">{stats.pendingUsers} pending</span>
                )}
              </div>
            </div>
          </div>

          <div className="stat-card-v2">
            <div className="stat-icon-box" style={{ background: 'linear-gradient(310deg, #f53939 0%, #fbcf33 100%)' }}>📚</div>
            <div className="stat-info">
              <span className="stat-label">Timetable Entries</span>
              <div className="stat-number-row">
                <span className="stat-number">{stats?.entries || 0}</span>
              </div>
            </div>
          </div>

          {isAdmin && (
            <>
              <div className="stat-card-v2">
                <div className="stat-icon-box" style={{ background: 'linear-gradient(310deg, #627594 0%, #A8B8D8 100%)' }}>✅</div>
                <div className="stat-info">
                  <span className="stat-label">Approved Users</span>
                  <div className="stat-number-row">
                    <span className="stat-number">{stats?.approvedUsers || 0}</span>
                  </div>
                </div>
              </div>
              <div className="stat-card-v2">
                <div className="stat-icon-box" style={{ background: 'linear-gradient(310deg, #FF0080 0%, #7928CA 100%)' }}>📎</div>
                <div className="stat-info">
                  <span className="stat-label">Total Allotments</span>
                  <div className="stat-number-row">
                    <span className="stat-number">{stats?.totalAllotments || 0}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {user?.role === 'hod' && (
            <>
              <div className="stat-card-v2">
                <div className="stat-icon-box" style={{ background: 'linear-gradient(310deg, #2152FF 0%, #21D4FD 100%)' }}>📋</div>
                <div className="stat-info">
                  <span className="stat-label">Dept Entries</span>
                  <div className="stat-number-row">
                    <span className="stat-number">{stats?.deptEntries || 0}</span>
                  </div>
                </div>
              </div>
              <div className="stat-card-v2">
                <div className="stat-icon-box" style={{ background: 'linear-gradient(310deg, #17ad37 0%, #98ec2d 100%)' }}>👨‍🏫</div>
                <div className="stat-info">
                  <span className="stat-label">Dept Faculty</span>
                  <div className="stat-number-row">
                    <span className="stat-number">{stats?.deptFaculty || 0}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {isFacultyOrHod && (
            <>
              <div className="stat-card-v2">
                <div className="stat-icon-box" style={{ background: 'linear-gradient(310deg, #7928CA 0%, #FF0080 100%)' }}>📖</div>
                <div className="stat-info">
                  <span className="stat-label">My Classes</span>
                  <div className="stat-number-row">
                    <span className="stat-number">{stats?.myEntries || 0}</span>
                  </div>
                </div>
              </div>
              <div className="stat-card-v2">
                <div className="stat-icon-box" style={{ background: 'linear-gradient(310deg, #2152FF 0%, #21D4FD 100%)' }}>⏱️</div>
                <div className="stat-info">
                  <span className="stat-label">Weekly Hours</span>
                  <div className="stat-number-row">
                    <span className="stat-number">{stats?.myWeeklyHours || 0}</span>
                    <span className="stat-unit">hrs/week</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Faculty: Next Class Widget */}
        {isFacultyOrHod && (
          <div className="next-class-widget">
            <h3 className="widget-title">⏰ Next Class Today</h3>
            {stats?.myNextClass ? (
              <div className="next-class-content">
                <div className="next-class-subject">{stats.myNextClass.subject || 'No Subject'}</div>
                <div className="next-class-details">
                  <div className="next-class-row">
                    <span className="ncl">🏫</span>
                    <span>{stats.myNextClass.classroom?.name || '-'}</span>
                  </div>
                  <div className="next-class-row">
                    <span className="ncl">📅</span>
                    <span>
                      {stats.myNextClass.batch || stats.myNextClass.department?.name || ''}
                      {stats.myNextClass.section ? ` (${stats.myNextClass.section}${stats.myNextClass.subsection ? '-' + stats.myNextClass.subsection : ''})` : ''}
                    </span>
                  </div>
                  <div className="next-class-row">
                    <span className="ncl">🎓</span>
                    <span>Year {stats.myNextClass.year}</span>
                  </div>
                  <div className="next-class-row">
                    <span className="ncl">🕐</span>
                    <span>{stats.myNextClass.startTime} – {stats.myNextClass.endTime}</span>
                  </div>
                  {stats.myNextClass.type === 'lab' && (
                    <span className="next-class-lab-badge">LAB</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="next-class-empty">
                <span className="next-class-empty-icon">✅</span>
                <p>No classes remaining today</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Currently Ongoing Classes */}
      <div className="ongoing-section">
        <h2 className="section-title">🟢 Currently Ongoing Classes</h2>
        <p className="ongoing-meta">
          {stats?.currentDay || '—'} · Slot {stats?.currentSlot >= 0 ? stats.currentSlot : '—'}
          {stats?.timeSlots && stats.currentSlot >= 0 && ` (${stats.timeSlots[stats.currentSlot]?.label || ''})`}
        </p>
        <div className="ongoing-card">
          {(!stats?.ongoingClasses || stats.ongoingClasses.length === 0) ? (
            <div className="ongoing-empty">
              <span>😴</span>
              <p>No classes are currently in session</p>
            </div>
          ) : (
            <div className="ongoing-list">
              <div className="ongoing-header">
                <span>Classroom</span>
                <span>Year</span>
                <span>Batch / Section</span>
                <span>Type</span>
                <span>Faculty</span>
                <span>Time</span>
              </div>
              {stats.ongoingClasses.map((cls, idx) => (
                <div key={idx} className="ongoing-row">
                  <span className="ongoing-classroom">{cls.classroom?.name || '-'}</span>
                  <span>{cls.year || '-'}</span>
                  <span>
                    {cls.batch || cls.department?.name || '-'}
                    {cls.section ? ` (${cls.section}${cls.subsection ? '-' + cls.subsection : ''})` : ''}
                  </span>
                  <span>
                    <span className={`type-badge ${cls.type}`}>{cls.type}</span>
                  </span>
                  <span>{cls.faculty?.name || '-'}</span>
                  <span className="ongoing-time">{cls.startTime} – {cls.endTime}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2 className="section-title">Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/timetable" className="action-card">
            <span className="action-icon">📅</span>
            <span className="action-label">View Timetable</span>
          </Link>

          {isFacultyOrHod && (
            <Link to="/my-schedule" className="action-card">
              <span className="action-icon">🗓️</span>
              <span className="action-label">My Schedule</span>
            </Link>
          )}

          {isAdmin && (
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
