import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navItem = (path, icon, label) => (
    <Link
      to={path}
      className={`sidebar-link ${isActive(path) ? 'active' : ''}`}
      onClick={() => setMobileOpen(false)}
    >
      <span className="sidebar-link-icon">{icon}</span>
      <span className="sidebar-link-text">{label}</span>
    </Link>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button className="sidebar-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
        <span className={`hamburger ${mobileOpen ? 'open' : ''}`}>
          <span /><span /><span />
        </span>
      </button>

      {/* Overlay */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`} id="main-sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon">📅</span>
          <span className="sidebar-brand-text">TimeTable</span>
        </div>

        <div className="sidebar-divider" />

        {/* Main Nav */}
        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Main</span>
          {navItem('/dashboard', '📊', 'Dashboard')}
          {navItem('/timetable', '🗓️', 'Timetable')}

          {user?.role === 'admin' && (
            <>
              <span className="sidebar-section-label" style={{ marginTop: '1rem' }}>Admin</span>
              {navItem('/manage/classrooms', '🏫', 'Classrooms')}
              {navItem('/manage/departments', '🏛️', 'Departments')}
              {navItem('/manage/users', '👥', 'Users')}
              {navItem('/settings', '⚙️', 'Settings')}
            </>
          )}
        </nav>

        <div className="sidebar-divider" />

        {/* My Account */}
        <nav className="sidebar-nav sidebar-nav-bottom">
          <span className="sidebar-section-label">My Account</span>
          {(user?.role === 'faculty' || user?.role === 'hod') && (
            navItem('/my-schedule', '📋', 'My Schedule')
          )}
          {navItem('/profile', '👤', 'Profile')}
          <button className="sidebar-link sidebar-signout" onClick={() => { logout(); setMobileOpen(false); }}>
            <span className="sidebar-link-icon">🚪</span>
            <span className="sidebar-link-text">Sign Out</span>
          </button>
        </nav>

        {/* User card at bottom */}
        <div className="sidebar-user-card">
          <div className="sidebar-user-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.name}</span>
            <span className="sidebar-user-role">{user?.role}</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
