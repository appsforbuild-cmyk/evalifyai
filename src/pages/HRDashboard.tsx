import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, FileText, TrendingUp, BarChart3, Clock, CheckCircle, Download, RefreshCw, PieChart as PieChartIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface SkillGap {
  skill: string;
  count: number;
}

interface Aggregate {
  id: string;
  team: string | null;
  org_unit: string | null;
  avg_sentiment: number | null;
  avg_fairness: number | null;
  feedback_count: number;
  skill_gaps: SkillGap[];
  metadata: Record<string, any>;
  period_start: string;
  period_end: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#63A4FF', '#002D62'];

const HRDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalSessions: 0,
    publishedFeedback: 0,
    pendingSessions: 0,
    totalUsers: 0,
  });
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [aggregates, setAggregates] = useState<Aggregate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchRecentSessions();
    fetchAggregates();
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

    // Get employee count from employees_directory (sample data)
    const { count: employeesCount } = await supabase
      .from('employees_directory')
      .select('*', { count: 'exact', head: true });

    setStats({
      totalSessions: sessionsCount || 0,
      publishedFeedback: publishedCount || 0,
      pendingSessions: pendingCount || 0,
      totalUsers: employeesCount || 0,
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

  const fetchAggregates = async () => {
    const { data, error } = await supabase
      .from('analytics_feedback_aggregate')
      .select('*')
      .order('computed_at', { ascending: false });

    if (error) {
      console.error('Error fetching aggregates:', error);
    } else {
      setAggregates((data as unknown as Aggregate[]) || []);
    }
  };

  const refreshAnalytics = async () => {
    setRefreshing(true);
    try {
      const { error } = await supabase.functions.invoke('compute-analytics');
      if (error) throw error;
      
      await fetchAggregates();
      toast({ title: 'Analytics refreshed', description: 'Data has been recomputed successfully.' });
    } catch (error) {
      console.error('Error refreshing analytics:', error);
      toast({ title: 'Refresh failed', description: 'Could not refresh analytics.', variant: 'destructive' });
    } finally {
      setRefreshing(false);
    }
  };

  const exportToCSV = () => {
    const teamData = aggregates.filter(a => a.metadata?.type === 'team');
    const orgData = aggregates.filter(a => a.metadata?.type === 'org_unit');
    const globalData = aggregates.find(a => a.metadata?.type === 'global');

    let csv = 'HR Analytics Report\n\n';
    
    // Team metrics
    csv += 'Team Metrics\n';
    csv += 'Team,Avg Fairness,Avg Sentiment,Feedback Count\n';
    teamData.forEach(t => {
      csv += `${t.team},${t.avg_fairness?.toFixed(2) || 'N/A'},${t.avg_sentiment?.toFixed(2) || 'N/A'},${t.feedback_count}\n`;
    });
    
    csv += '\nOrg Unit Feedback Count\n';
    csv += 'Org Unit,Feedback Count\n';
    orgData.forEach(o => {
      csv += `${o.org_unit},${o.feedback_count}\n`;
    });

    csv += '\nTop Skill Gaps\n';
    csv += 'Skill,Mentions\n';
    const skillGaps = globalData?.skill_gaps || [];
    skillGaps.forEach((s: SkillGap) => {
      csv += `${s.skill},${s.count}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hr-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const statCards = [
    { title: 'Total Sessions', value: stats.totalSessions, icon: FileText, color: 'text-blue-600' },
    { title: 'Published Feedback', value: stats.publishedFeedback, icon: CheckCircle, color: 'text-green-600' },
    { title: 'Pending Reviews', value: stats.pendingSessions, icon: Clock, color: 'text-yellow-600' },
    { title: 'Total Employees', value: stats.totalUsers, icon: Users, color: 'text-purple-600' },
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

  // Prepare chart data
  const teamData = aggregates.filter(a => a.metadata?.type === 'team');
  const orgData = aggregates.filter(a => a.metadata?.type === 'org_unit');
  const globalData = aggregates.find(a => a.metadata?.type === 'global');
  const skillGaps = (globalData?.skill_gaps || []) as SkillGap[];

  const fairnessChartData = teamData.map(t => ({
    name: t.team || 'Unknown',
    fairness: Number((t.avg_fairness || 0).toFixed(2)) * 100,
  }));

  const orgUnitChartData = orgData.map(o => ({
    name: o.org_unit || 'Unknown',
    count: o.feedback_count,
  }));

  const skillGapsChartData = skillGaps.map(s => ({
    name: s.skill,
    value: s.count,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-primary">HR Analytics Dashboard</h1>
            <p className="text-muted-foreground">Organization-wide feedback analytics</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/hr-analytics')} className="gap-2">
              <PieChartIcon className="w-4 h-4" /> Detailed Analytics
            </Button>
            <Button variant="outline" onClick={refreshAnalytics} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
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

        {/* Analytics Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Average Fairness by Team */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Average Fairness by Team
              </CardTitle>
              <CardDescription>Fairness scores (0-100%) over last 90 days</CardDescription>
            </CardHeader>
            <CardContent>
              {fairnessChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={fairnessChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="fairness" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No team data available. Click "Refresh" to compute analytics.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feedback Count by Org Unit */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" /> Feedback by Org Unit
              </CardTitle>
              <CardDescription>Distribution across organizational units</CardDescription>
            </CardHeader>
            <CardContent>
              {orgUnitChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={orgUnitChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="count" fill="#63A4FF" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No org unit data available.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top 5 Skill Gaps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" /> Top 5 Skill Gaps
              </CardTitle>
              <CardDescription>Most mentioned competencies needing development</CardDescription>
            </CardHeader>
            <CardContent>
              {skillGapsChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={skillGapsChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {skillGapsChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No skill gap data available.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" /> Recent Sessions
              </CardTitle>
              <CardDescription>Latest feedback sessions across the organization</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : recentSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No sessions yet</div>
              ) : (
                <div className="space-y-3 max-h-[250px] overflow-y-auto">
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
        </div>

        {/* DEI & Fairness Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> DEI & Fairness Summary
            </CardTitle>
            <CardDescription>Bias detection and fairness metrics (last 90 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <p className="font-medium text-green-800 dark:text-green-200">Overall Bias Score</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {teamData.length > 0 
                    ? `${Math.round((teamData.reduce((acc, t) => acc + (t.avg_fairness || 0), 0) / teamData.length) * 100)}%` 
                    : 'N/A'}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">AI-calibrated feedback fairness</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="font-medium text-blue-800 dark:text-blue-200">Avg Sentiment</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {teamData.length > 0 
                    ? (teamData.reduce((acc, t) => acc + (t.avg_sentiment || 0), 0) / teamData.length).toFixed(2)
                    : 'N/A'}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">Score range: -1 to 1</p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="font-medium text-purple-800 dark:text-purple-200">Total Published</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {globalData?.feedback_count || stats.publishedFeedback}
                </p>
                <p className="text-sm text-purple-600 dark:text-purple-400">Feedback entries analyzed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default HRDashboard;
