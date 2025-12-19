
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SupportPage from './pages/SupportPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import Dashboard from './pages/Dashboard';
import EditorPage from './pages/EditorPage';
import PublicViewPage from './pages/PublicViewPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminLoginPage from './pages/AdminLoginPage';
import PaymentStatusPage from './pages/PaymentStatusPage';
import { User } from './lib/types';

// Protected Route Wrapper
// Protected Route Wrapper
const ProtectedRoute: React.FC<{ user: User | null; children: React.ReactNode }> = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Admin Protected Route
const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = sessionStorage.getItem('orbio_admin_token') || localStorage.getItem('orbio_admin_token'); // Support both for now but prefer session
  if (!token) {
    return <Navigate to="/admin-login" replace />;
  }
  return <>{children}</>;
};



const AppRoutes: React.FC = () => {
  // Initialize from LocalStorage if available
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('streamtheme_user');
    return saved ? JSON.parse(saved) : null;
  });
  const navigate = useNavigate();

  // Persist Login
  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('streamtheme_user', JSON.stringify(loggedInUser));
    navigate('/dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('streamtheme_user');
    navigate('/');
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPage onLoginClick={() => navigate('/login')} />} />
      <Route path="/support" element={<SupportPage onLoginClick={() => navigate('/login')} />} />

      <Route path="/login" element={
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onBack={() => navigate('/')}
          onRegisterClick={() => navigate('/register')}
          onForgotPasswordClick={() => navigate('/forgot-password')}
        />
      } />

      <Route path="/register" element={
        <RegisterPage
          onRegisterSuccess={handleLoginSuccess}
          onLoginClick={() => navigate('/login')}
        />
      } />

      <Route path="/forgot-password" element={
        <ForgotPasswordPage onBack={() => navigate('/login')} />
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute user={user}>
          <Dashboard
            user={user!}
            onLogout={handleLogout}
            onSelectLayout={(id) => navigate(`/editor/${id}`)}
            onUserUpdate={(updatedUser) => {
              setUser(updatedUser);
              localStorage.setItem('streamtheme_user', JSON.stringify(updatedUser));
            }}
          />
        </ProtectedRoute>
      } />

      <Route path="/editor/:layoutId" element={
        <ProtectedRoute user={user}>
          <EditorPage
            user={user}
            onUserUpdate={(updatedUser) => {
              setUser(updatedUser);
              localStorage.setItem('streamtheme_user', JSON.stringify(updatedUser));
            }}
          />
        </ProtectedRoute>
      } />

      <Route path="/payment/status" element={
        <ProtectedRoute user={user}>
          <PaymentStatusPage onUserUpdate={(updatedUser) => {
            setUser(updatedUser);
            localStorage.setItem('streamtheme_user', JSON.stringify(updatedUser));
          }}
          />
        </ProtectedRoute>
      } />

      <Route path="/view/:token" element={<PublicViewPage />} />

      {/* ADMIN ROUTES */}
      <Route path="/admin-login" element={<AdminLoginPage />} />
      <Route path="/admin" element={
        <AdminProtectedRoute>
          <AdminDashboard />
        </AdminProtectedRoute>
      } />
      <Route path="/Orbioadmin" element={<Navigate to="/admin" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;