import { Toaster } from "@/components/ui/toaster";
import RetentionAlerts from "./pages/RetentionAlerts";
import AttritionOverview from "./pages/AttritionOverview";
import Recognition from "./pages/Recognition";
import Leaderboards from "./pages/Leaderboards";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { GamificationProvider } from "@/components/gamification/GamificationProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import HRDashboard from "./pages/HRDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import VoiceSession from "./pages/VoiceSession";
import FeedbackDraft from "./pages/FeedbackDraft";
import EmployeeDirectory from "./pages/EmployeeDirectory";
import EmployeeProfile from "./pages/EmployeeProfile";
import TeamComparison from "./pages/TeamComparison";
import QuickFeedback from "./pages/QuickFeedback";
import Goals from "./pages/Goals";
import HRAnalytics from "./pages/HRAnalytics";
import QuestionTemplates from "./pages/QuestionTemplates";
import ImportUsers from "./pages/ImportUsers";
import SSOConfig from "./pages/SSOConfig";
import Notifications from "./pages/Notifications";
import NotificationSettings from "./pages/NotificationSettings";
import BiasAnalytics from "./pages/BiasAnalytics";
import Analytics from "./pages/Analytics";
import ScheduledReports from "./pages/ScheduledReports";
import OnboardingOrganization from "./pages/OnboardingOrganization";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// Auth route wrapper (redirect if already logged in)
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
    <Route path="/onboarding/organization" element={<ProtectedRoute><OnboardingOrganization /></ProtectedRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
    <Route path="/admin/question-templates" element={<ProtectedRoute><QuestionTemplates /></ProtectedRoute>} />
    <Route path="/admin/import-users" element={<ProtectedRoute><ImportUsers /></ProtectedRoute>} />
    <Route path="/admin/sso-config" element={<ProtectedRoute><SSOConfig /></ProtectedRoute>} />
    <Route path="/manager" element={<ProtectedRoute><ManagerDashboard /></ProtectedRoute>} />
    <Route path="/employee" element={<ProtectedRoute><EmployeeDashboard /></ProtectedRoute>} />
    <Route path="/hr" element={<ProtectedRoute><HRDashboard /></ProtectedRoute>} />
    <Route path="/session/:sessionId" element={<ProtectedRoute><VoiceSession /></ProtectedRoute>} />
    <Route path="/feedback/:sessionId" element={<ProtectedRoute><FeedbackDraft /></ProtectedRoute>} />
    <Route path="/employees" element={<ProtectedRoute><EmployeeDirectory /></ProtectedRoute>} />
    <Route path="/employee/:id" element={<ProtectedRoute><EmployeeProfile /></ProtectedRoute>} />
    <Route path="/team-comparison" element={<ProtectedRoute><TeamComparison /></ProtectedRoute>} />
    <Route path="/quick-feedback" element={<ProtectedRoute><QuickFeedback /></ProtectedRoute>} />
    <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
    <Route path="/hr-analytics" element={<ProtectedRoute><HRAnalytics /></ProtectedRoute>} />
    <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
    <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
    <Route path="/admin/bias-analytics" element={<ProtectedRoute><BiasAnalytics /></ProtectedRoute>} />
    <Route path="/manager/retention-alerts" element={<ProtectedRoute><RetentionAlerts /></ProtectedRoute>} />
    <Route path="/hr/attrition-overview" element={<ProtectedRoute><AttritionOverview /></ProtectedRoute>} />
    <Route path="/recognition" element={<ProtectedRoute><Recognition /></ProtectedRoute>} />
    <Route path="/leaderboards" element={<ProtectedRoute><Leaderboards /></ProtectedRoute>} />
    <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
    <Route path="/analytics/scheduled-reports" element={<ProtectedRoute><ScheduledReports /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <OrganizationProvider>
            <GamificationProvider>
              <AppRoutes />
            </GamificationProvider>
          </OrganizationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
