import { Suspense, lazy, type ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute, AdminRoute, AuthRedirect } from '@/components/guards/AuthGuards';

const AppLayout = lazy(() =>
  import('@/components/layout/AppLayout').then((module) => ({
    default: module.AppLayout,
  })),
);
const Placeholder = lazy(() =>
  import('@/pages/Placeholder').then((module) => ({
    default: module.Placeholder,
  })),
);
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const LoginPage = lazy(() => import('@/pages/Login'));
const RegisterPage = lazy(() => import('@/pages/Register'));
const TokenPage = lazy(() => import('@/pages/Token'));
const LogPage = lazy(() => import('@/pages/Log'));
const TopUpPage = lazy(() => import('@/pages/TopUp'));
const PersonalSettingsPage = lazy(() => import('@/pages/PersonalSettings'));
const ChannelPage = lazy(() => import('@/pages/admin/Channel'));
const SubscriptionPage = lazy(() => import('@/pages/admin/Subscription'));
const ModelPage = lazy(() => import('@/pages/admin/Model'));
const DeploymentPage = lazy(() => import('@/pages/admin/Deployment'));
const RedemptionPage = lazy(() => import('@/pages/admin/Redemption'));
const UserPage = lazy(() => import('@/pages/admin/User'));
const SettingsPage = lazy(() => import('@/pages/admin/Settings'));
const MidjourneyPage = lazy(() => import('@/pages/Midjourney'));
const TaskPage = lazy(() => import('@/pages/Task'));
const PricingPage = lazy(() => import('@/pages/Pricing'));
const OAuthCallback = lazy(() => import('@/pages/OAuthCallback'));
const PasswordResetPage = lazy(() => import('@/pages/PasswordReset'));
const PasswordResetConfirmPage = lazy(() => import('@/pages/PasswordResetConfirm'));
const AboutPage = lazy(() => import('@/pages/About'));
const UserAgreementPage = lazy(() => import('@/pages/UserAgreement'));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicy'));
const ForbiddenPage = lazy(() => import('@/pages/Forbidden'));
const NotFoundPage = lazy(() => import('@/pages/NotFound'));

// DEV: 取消注释下面这行可自动注入开发用户（跳过登录）
// if (import.meta.env.DEV && !localStorage.getItem('user')) {
//   localStorage.setItem('user', JSON.stringify({ id: 1, username: 'Dev', role: 100 }));
// }

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6 py-16 text-sm text-muted-foreground">
      正在加载页面...
    </div>
  );
}

function withRouteSuspense(children: ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

function App() {
  return (
    <Routes>
      {/* Public routes (no sidebar layout) */}
      <Route path="/" element={<Navigate to="/console" replace />} />
      <Route
        path="/login"
        element={withRouteSuspense(
          <AuthRedirect>
            <LoginPage />
          </AuthRedirect>,
        )}
      />
      <Route
        path="/register"
        element={withRouteSuspense(
          <AuthRedirect>
            <RegisterPage />
          </AuthRedirect>,
        )}
      />
      <Route path="/reset" element={withRouteSuspense(<PasswordResetPage />)} />
      <Route
        path="/user/reset"
        element={withRouteSuspense(<PasswordResetConfirmPage />)}
      />
      <Route path="/pricing" element={withRouteSuspense(<PricingPage />)} />
      <Route path="/about" element={withRouteSuspense(<AboutPage />)} />
      <Route
        path="/user-agreement"
        element={withRouteSuspense(<UserAgreementPage />)}
      />
      <Route
        path="/privacy-policy"
        element={withRouteSuspense(<PrivacyPolicyPage />)}
      />
      <Route path="/oauth/:provider" element={withRouteSuspense(<OAuthCallback />)} />
      <Route path="/setup" element={withRouteSuspense(<Placeholder />)} />
      <Route path="/forbidden" element={withRouteSuspense(<ForbiddenPage />)} />

      {/* Console routes (with sidebar layout) */}
      <Route
        element={withRouteSuspense(
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>,
        )}
      >
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
      <Route
        element={withRouteSuspense(
          <AdminRoute>
            <AppLayout />
          </AdminRoute>,
        )}
      >
        <Route path="/console/channel" element={<ChannelPage />} />
        <Route path="/console/user" element={<UserPage />} />
        <Route path="/console/redemption" element={<RedemptionPage />} />
        <Route path="/console/setting" element={<SettingsPage />} />
        <Route path="/console/models" element={<ModelPage />} />
        <Route path="/console/deployment" element={<DeploymentPage />} />
        <Route path="/console/subscription" element={<SubscriptionPage />} />
      </Route>

      <Route path="*" element={withRouteSuspense(<NotFoundPage />)} />
    </Routes>
  );
}

export default App;
