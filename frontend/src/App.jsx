import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TimetableView from './pages/TimetableView';
import ManageClassrooms from './pages/ManageClassrooms';
import ManageDepartments from './pages/ManageDepartments';
import ManageUsers from './pages/ManageUsers';
import MySchedule from './pages/MySchedule';
import AwaitingApproval from './pages/AwaitingApproval';
import './App.css';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // User is logged in but not approved
  const isPending = user && !user.approved;

  return (
    <div className="app-layout">
      {user && <Navbar />}
      <main className="app-main">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              {isPending ? <AwaitingApproval /> : <Dashboard />}
            </ProtectedRoute>
          } />
          <Route path="/timetable" element={
            <ProtectedRoute>
              {isPending ? <AwaitingApproval /> : <TimetableView />}
            </ProtectedRoute>
          } />
          <Route path="/my-schedule" element={
            <ProtectedRoute roles={['faculty', 'hod']}>
              {isPending ? <AwaitingApproval /> : <MySchedule />}
            </ProtectedRoute>
          } />

          <Route path="/manage/classrooms" element={<ProtectedRoute roles={['admin']}>{isPending ? <AwaitingApproval /> : <ManageClassrooms />}</ProtectedRoute>} />
          <Route path="/manage/departments" element={<ProtectedRoute roles={['admin']}>{isPending ? <AwaitingApproval /> : <ManageDepartments />}</ProtectedRoute>} />
          <Route path="/manage/users" element={<ProtectedRoute roles={['admin']}>{isPending ? <AwaitingApproval /> : <ManageUsers />}</ProtectedRoute>} />

          <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
