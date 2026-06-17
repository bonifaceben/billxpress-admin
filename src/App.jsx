import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Admins from './pages/Admins';
import Notifications from './pages/Notifications';
import ReferralRewards from './pages/ReferralRewards';
import DataPlans from './pages/DataPlans';
import DataSettings from './pages/DataSettings';
import AirtimeSettings from './pages/AirtimeSettings';
import SocialGrowthSettings from './pages/SocialGrowthSettings';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/admins" element={<Admins />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/referral-rewards" element={<ReferralRewards />} />
          <Route path="/services/data-plans" element={<DataPlans />} />
          <Route path="/services/data-settings" element={<DataSettings />} />
          <Route path="/services/airtime-settings" element={<AirtimeSettings />} />
          <Route path="/services/social-growth-settings" element={<SocialGrowthSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
