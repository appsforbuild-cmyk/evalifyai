import React from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Building2, 
  BarChart3, 
  Shield, 
  Settings, 
  LogOut, 
  FileText,
  HeadphonesIcon,
  Activity,
  Bell,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/superadmin/dashboard', icon: LayoutDashboard },
  { name: 'Organizations', href: '/superadmin/organizations', icon: Building2 },
  { name: 'Analytics', href: '/superadmin/analytics', icon: BarChart3 },
  { name: 'Support', href: '/superadmin/support', icon: HeadphonesIcon },
  { name: 'Audit Logs', href: '/superadmin/audit', icon: FileText },
  { name: 'System', href: '/superadmin/system', icon: Settings },
];

export default function SuperAdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { superAdmin, signOut, impersonationSession, endImpersonation, isLoading, isSuperAdmin } = useSuperAdmin();

  React.useEffect(() => {
    if (!isLoading && !isSuperAdmin) {
      navigate('/superadmin/login');
    }
  }, [isSuperAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  const handleEndImpersonation = async () => {
    await endImpersonation();
    navigate('/superadmin/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Impersonation Banner */}
      {impersonationSession && (
        <div className="bg-amber-500 text-black px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="font-medium">
              Viewing as {impersonationSession.user_name} from {impersonationSession.organization_name}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="bg-black/10 border-black/20 text-black hover:bg-black/20"
            onClick={handleEndImpersonation}
          >
            <X className="h-4 w-4 mr-1" />
            Exit Impersonation
          </Button>
        </div>
      )}

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-slate-800 border-r border-slate-700">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white">EvalifyAI</h1>
                <p className="text-xs text-slate-400">Super Admin</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-amber-500/10 text-amber-500'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm font-medium">
                {superAdmin?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{superAdmin?.email}</p>
                <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-500">
                  Super Admin
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-700/50"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <header className="h-16 border-b border-slate-700 bg-slate-800/50 backdrop-blur flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Activity className="h-5 w-5 text-green-500" />
            <span className="text-sm text-slate-400">All systems operational</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
