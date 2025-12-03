import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
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
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
    <Route path="/manager" element={<ProtectedRoute><ManagerDashboard /></ProtectedRoute>} />
    <Route path="/employee" element={<ProtectedRoute><EmployeeDashboard /></ProtectedRoute>} />
    <Route path="/hr" element={<ProtectedRoute><HRDashboard /></ProtectedRoute>} />
    <Route path="/session/:sessionId" element={<ProtectedRoute><VoiceSession /></ProtectedRoute>} />
    <Route path="/feedback/:sessionId" element={<ProtectedRoute><FeedbackDraft /></ProtectedRoute>} />
    <Route path="/employees" element={<ProtectedRoute><EmployeeDirectory /></ProtectedRoute>} />
    <Route path="/employee/:id" element={<ProtectedRoute><EmployeeProfile /></ProtectedRoute>} />
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
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
