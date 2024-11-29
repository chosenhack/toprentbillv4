import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './components/Sidebar';
import CustomersPage from './pages/CustomersPage';
import PaymentsPage from './pages/PaymentsPage';
import ReportsPage from './pages/ReportsPage';
import NotificationsPage from './pages/NotificationsPage';
import ActivityPage from './pages/ActivityPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import RequireAuth from './components/RequireAuth';
import type { RootState } from './store';

function App() {
  const { isInitialized } = useSelector((state: RootState) => state.auth);

  if (!isInitialized) {
    return null; // Don't show loading screen, just render nothing until initialized
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <div className="flex min-h-screen bg-gray-100">
                <Sidebar />
                <div className="flex-1 ml-64">
                  <Routes>
                    <Route path="/" element={<Navigate to="/customers" replace />} />
                    <Route path="/customers" element={<CustomersPage />} />
                    <Route path="/payments" element={<PaymentsPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/activity" element={<ActivityPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Routes>
                </div>
              </div>
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;