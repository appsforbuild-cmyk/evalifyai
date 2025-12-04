import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, LayoutDashboard, Users, Mic, BarChart3, Shield, MessageSquare, Target, TrendingUp } from 'lucide-react';
import logo from '@/assets/evalifyai-logo.png';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { path: '/admin', label: 'Admin', icon: Shield, roles: ['admin'] },
    { path: '/manager', label: 'Manager', icon: Mic, roles: ['manager'] },
    { path: '/employee', label: 'My Dashboard', icon: LayoutDashboard, roles: ['employee'] },
    { path: '/hr', label: 'HR Analytics', icon: BarChart3, roles: ['hr'] },
    { path: '/employees', label: 'Directory', icon: Users, roles: ['hr', 'admin', 'manager'] },
    { path: '/team-comparison', label: 'Team Compare', icon: TrendingUp, roles: ['manager', 'hr'] },
    { path: '/quick-feedback', label: 'Quick Feedback', icon: MessageSquare, roles: ['manager', 'employee'] },
    { path: '/goals', label: 'Goals', icon: Target, roles: ['manager', 'employee'] },
    { path: '/hr-analytics', label: 'Analytics', icon: BarChart3, roles: ['hr'] },
  ];

  const visibleNavItems = navItems.filter(item => 
    item.roles.some(role => (roles as string[]).includes(role))
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="EvalifyAI" className="h-8" />
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            {visibleNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  location.pathname === item.path 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
