import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, TrendingUp, BarChart3, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';

const HRDashboard = () => {
  const [stats, setStats] = useState({
    totalSessions: 0,
    publishedFeedback: 0,
    pendingSessions: 0,
    totalUsers: 0,
  });
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentSessions();
  }, []);

  const fetchStats = async () => {
    const { count: sessionsCount } = await supabase
      .from('voice_sessions')
      .select('*', { count: 'exact', head: true });

    const { count: publishedCount } = await supabase
      .from('feedback_entries')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true);

    const { count: pendingCount } = await supabase
      .from('voice_sessions')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'recording', 'processing', 'draft']);

    const { count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    setStats({
      totalSessions: sessionsCount || 0,
      publishedFeedback: publishedCount || 0,
      pendingSessions: pendingCount || 0,
      totalUsers: usersCount || 0,
    });
  };

  const fetchRecentSessions = async () => {
    const { data } = await supabase
      .from('voice_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setRecentSessions(data);
    }
    setLoading(false);
  };

  const statCards = [
    { title: 'Total Sessions', value: stats.totalSessions, icon: FileText, color: 'text-blue-600' },
    { title: 'Published Feedback', value: stats.publishedFeedback, icon: CheckCircle, color: 'text-green-600' },
    { title: 'Pending Reviews', value: stats.pendingSessions, icon: Clock, color: 'text-yellow-600' },
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-purple-600' },
  ];

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-muted text-muted-foreground',
      recording: 'bg-red-100 text-red-700',
      processing: 'bg-yellow-100 text-yellow-700',
      draft: 'bg-blue-100 text-blue-700',
      published: 'bg-green-100 text-green-700',
    };
    return <Badge className={colors[status] || colors.pending}>{status}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">HR Analytics Dashboard</h1>
          <p className="text-muted-foreground">Organization-wide feedback analytics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" /> Recent Sessions
              </CardTitle>
              <CardDescription>Latest feedback sessions across the organization</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : recentSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No sessions yet</div>
              ) : (
                <div className="space-y-3">
                  {recentSessions.map((session) => (
                    <div key={session.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{session.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(session.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(session.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* DEI & Fairness Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> DEI & Fairness Analytics
              </CardTitle>
              <CardDescription>Bias detection and fairness metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="font-medium text-green-800">Bias Score: Low</p>
                  <p className="text-sm text-green-600">AI-calibrated feedback shows balanced tone</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Feedback Consistency</span>
                    <span className="font-medium">92%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Competency Coverage</span>
                    <span className="font-medium">87%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Actionability Score</span>
                    <span className="font-medium">85%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HRDashboard;
