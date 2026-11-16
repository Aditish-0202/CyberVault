import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { setupApiClient } from './lib/apiClient';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import DevicesPage from './pages/DevicesPage';
import AlertsPage from './pages/AlertsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import LogsPage from './pages/LogsPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import DetectionPage from './pages/DetectionPage';
import NotFoundPage from './pages/NotFoundPage';
// Initialize custom fetch client interceptor
setupApiClient();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      
      {/* Protected Routes */}
      <Route path="/dashboard">
        <ProtectedRoute><DashboardPage /></ProtectedRoute>
      </Route>
      <Route path="/devices">
        <ProtectedRoute><DevicesPage /></ProtectedRoute>
      </Route>
      <Route path="/alerts">
        <ProtectedRoute><AlertsPage /></ProtectedRoute>
      </Route>
      <Route path="/analytics">
        <ProtectedRoute><AnalyticsPage /></ProtectedRoute>
      </Route>
      <Route path="/detection">
        <ProtectedRoute><DetectionPage /></ProtectedRoute>
      </Route>
      <Route path="/logs">
        <ProtectedRoute><LogsPage /></ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute><SettingsPage /></ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute><ProfilePage /></ProtectedRoute>
      </Route>
      
      <Route component={NotFoundPage} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;