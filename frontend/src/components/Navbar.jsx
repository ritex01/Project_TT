import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-inner">
        <Link to="/dashboard" className="navbar-brand">
          <span className="brand-icon">📅</span>
          <span className="brand-text">TimeTable</span>
        </Link>

        <div className="navbar-links">
          <Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
          <Link to="/timetable" className={isActive('/timetable')}>Timetable</Link>

          {(user?.role === 'faculty' || user?.role === 'hod') && (
            <Link to="/my-schedule" className={isActive('/my-schedule')}>My Schedule</Link>
          )}

          {user?.role === 'admin' && (
            <>
              <Link to="/manage/classrooms" className={isActive('/manage/classrooms')}>Classrooms</Link>
              <Link to="/manage/departments" className={isActive('/manage/departments')}>Departments</Link>
              <Link to="/manage/users" className={isActive('/manage/users')}>Users</Link>
            </>
          )}
        </div>

        <div className="navbar-user">
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className={`badge badge-${user?.role}`}>{user?.role}</span>
          </div>
          <button onClick={logout} className="btn-logout" id="btn-logout">Logout</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
