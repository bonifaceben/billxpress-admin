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
import AdminDataPlans from './pages/AdminDataPlans';
import DataSettings from './pages/DataSettings';
import AirtimeSettings from './pages/AirtimeSettings';
import SocialGrowthSettings from './pages/SocialGrowthSettings';
import CardSettings from './pages/CardSettings';
import AdminCards from './pages/AdminCards';
import FundingSettings from './pages/FundingSettings';

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
          <Route path="/services/data-plan-management" element={<AdminDataPlans />} />
          <Route path="/services/data-settings" element={<DataSettings />} />
          <Route path="/services/airtime-settings" element={<AirtimeSettings />} />
          <Route path="/services/social-growth-settings" element={<SocialGrowthSettings />} />
          <Route path="/services/card-settings" element={<CardSettings />} />
          <Route path="/cards" element={<AdminCards />} />
          <Route path="/funding/settings" element={<FundingSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
