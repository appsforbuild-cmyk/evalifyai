import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { roles, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      // Redirect based on user's role
      if (roles.includes('hr')) {
        navigate('/hr', { replace: true });
      } else if (roles.includes('manager')) {
        navigate('/manager', { replace: true });
      } else if (roles.includes('employee')) {
        navigate('/employee', { replace: true });
      } else {
        // Default to employee if no role found
        navigate('/employee', { replace: true });
      }
    }
  }, [roles, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
};

export default Dashboard;
