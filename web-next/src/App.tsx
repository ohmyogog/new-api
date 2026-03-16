import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PrivateRoute, AdminRoute, AuthRedirect } from '@/components/guards/AuthGuards';
import { Placeholder } from '@/pages/Placeholder';
import Dashboard from '@/pages/Dashboard';
import LoginPage from '@/pages/Login';
import RegisterPage from '@/pages/Register';
import TokenPage from '@/pages/Token';
import LogPage from '@/pages/Log';
import TopUpPage from '@/pages/TopUp';
import PersonalSettingsPage from '@/pages/PersonalSettings';
import ChannelPage from '@/pages/admin/Channel';
import SubscriptionPage from '@/pages/admin/Subscription';
import ModelPage from '@/pages/admin/Model';
import DeploymentPage from '@/pages/admin/Deployment';
import RedemptionPage from '@/pages/admin/Redemption';
import UserPage from '@/pages/admin/User';
import SettingsPage from '@/pages/admin/Settings';
import MidjourneyPage from '@/pages/Midjourney';
import TaskPage from '@/pages/Task';
import PricingPage from '@/pages/Pricing';
import OAuthCallback from '@/pages/OAuthCallback';
import PasswordResetPage from '@/pages/PasswordReset';
import PasswordResetConfirmPage from '@/pages/PasswordResetConfirm';
import AboutPage from '@/pages/About';
import UserAgreementPage from '@/pages/UserAgreement';
import PrivacyPolicyPage from '@/pages/PrivacyPolicy';
import ForbiddenPage from '@/pages/Forbidden';
import NotFoundPage from '@/pages/NotFound';

// DEV: 取消注释下面这行可自动注入开发用户（跳过登录）
// if (import.meta.env.DEV && !localStorage.getItem('user')) {
//   localStorage.setItem('user', JSON.stringify({ id: 1, username: 'Dev', role: 100 }));
// }

function App() {
  return (
    <Routes>
      {/* Public routes (no sidebar layout) */}
      <Route path="/" element={<Navigate to="/console" replace />} />
      <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />
      <Route path="/register" element={<AuthRedirect><RegisterPage /></AuthRedirect>} />
      <Route path="/reset" element={<PasswordResetPage />} />
      <Route path="/user/reset" element={<PasswordResetConfirmPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/user-agreement" element={<UserAgreementPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/oauth/:provider" element={<OAuthCallback />} />
      <Route path="/setup" element={<Placeholder />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />

      {/* Console routes (with sidebar layout) */}
      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route path="/console" element={<Dashboard />} />
        <Route path="/console/token" element={<TokenPage />} />
        <Route path="/console/log" element={<LogPage />} />
        <Route path="/console/playground" element={<Placeholder />} />
        <Route path="/console/topup" element={<TopUpPage />} />
        <Route path="/console/personal" element={<PersonalSettingsPage />} />
        <Route path="/console/midjourney" element={<MidjourneyPage />} />
        <Route path="/console/task" element={<TaskPage />} />
        <Route path="/console/chat/:id?" element={<Placeholder />} />
      </Route>

      {/* Admin console routes */}
      <Route element={<AdminRoute><AppLayout /></AdminRoute>}>
        <Route path="/console/channel" element={<ChannelPage />} />
        <Route path="/console/user" element={<UserPage />} />
        <Route path="/console/redemption" element={<RedemptionPage />} />
        <Route path="/console/setting" element={<SettingsPage />} />
        <Route path="/console/models" element={<ModelPage />} />
        <Route path="/console/deployment" element={<DeploymentPage />} />
        <Route path="/console/subscription" element={<SubscriptionPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
