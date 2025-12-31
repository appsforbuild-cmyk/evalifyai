import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  CreditCard,
  Activity,
  Database,
  HardDrive,
  Clock,
  Zap
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format, subDays } from 'date-fns';

interface KPICardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  trend: 'up' | 'down';
}

function KPICard({ title, value, change, icon: Icon, trend }: KPICardProps) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1">{title}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
            <div className={`flex items-center mt-2 text-sm ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {trend === 'up' ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {Math.abs(change)}% vs last month
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
            <Icon className="h-6 w-6 text-amber-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const PLAN_COLORS = {
  starter: '#22c55e',
  professional: '#3b82f6',
  enterprise: '#a855f7'
};

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalOrgs: 0,
    activeSubscriptions: 0,
    totalUsers: 0,
    mrr: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [planDistribution, setPlanDistribution] = useState<any[]>([]);
  const [signupTrend, setSignupTrend] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch organizations count
      const { count: orgCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });

      // Fetch active subscriptions
      const { count: activeCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Fetch total users
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch plan distribution
      const { data: orgs } = await supabase
        .from('organizations')
        .select('plan');

      const planCounts = orgs?.reduce((acc: any, org) => {
        acc[org.plan] = (acc[org.plan] || 0) + 1;
        return acc;
      }, {}) || {};

      setPlanDistribution(
        Object.entries(planCounts).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          color: PLAN_COLORS[name as keyof typeof PLAN_COLORS] || '#94a3b8'
        }))
      );

      // Generate mock signup trend data
      const trend = Array.from({ length: 30 }, (_, i) => ({
        date: format(subDays(new Date(), 29 - i), 'MMM dd'),
        signups: Math.floor(Math.random() * 15) + 5
      }));
      setSignupTrend(trend);

      // Fetch recent activity from organizations
      const { data: recentOrgs } = await supabase
        .from('organizations')
        .select('id, name, status, plan, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentActivity(
        recentOrgs?.map(org => ({
          id: org.id,
          organization: org.name,
          event: org.status === 'trial' ? 'New signup' : 'Active',
          time: format(new Date(org.created_at), 'MMM dd, HH:mm'),
          plan: org.plan,
          status: org.status
        })) || []
      );

      setStats({
        totalOrgs: orgCount || 0,
        activeSubscriptions: activeCount || 0,
        totalUsers: userCount || 0,
        mrr: (activeCount || 0) * 199 // Mock MRR calculation
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-slate-400">Monitor your platform's health and performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Organizations"
          value={stats.totalOrgs}
          change={12.5}
          icon={Building2}
          trend="up"
        />
        <KPICard
          title="Active Subscriptions"
          value={stats.activeSubscriptions}
          change={8.2}
          icon={CreditCard}
          trend="up"
        />
        <KPICard
          title="Total Revenue (MRR)"
          value={`$${stats.mrr.toLocaleString()}`}
          change={15.3}
          icon={DollarSign}
          trend="up"
        />
        <KPICard
          title="Active Users"
          value={stats.totalUsers.toLocaleString()}
          change={22.1}
          icon={Users}
          trend="up"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signups Chart */}
        <Card className="lg:col-span-2 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">New Signups</CardTitle>
            <CardDescription className="text-slate-400">Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={signupTrend}>
                  <defs>
                    <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="signups"
                    stroke="#f59e0b"
                    fill="url(#signupGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Plan Distribution</CardTitle>
            <CardDescription className="text-slate-400">By subscription type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    labelLine={false}
                  >
                    {planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {planDistribution.map((plan, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: plan.color }}
                  />
                  <span className="text-sm text-slate-400">
                    {plan.name} ({plan.value})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Platform Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Recent Activity</CardTitle>
              <CardDescription className="text-slate-400">Latest platform events</CardDescription>
            </div>
            <Link to="/superadmin/organizations">
              <Button variant="ghost" size="sm" className="text-amber-500 hover:text-amber-400">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-400">Organization</TableHead>
                  <TableHead className="text-slate-400">Event</TableHead>
                  <TableHead className="text-slate-400">Plan</TableHead>
                  <TableHead className="text-slate-400">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity.map((activity, index) => (
                  <TableRow key={index} className="border-slate-700">
                    <TableCell className="font-medium text-white">
                      {activity.organization}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          activity.event === 'New signup'
                            ? 'border-green-500/30 text-green-500'
                            : 'border-blue-500/30 text-blue-500'
                        }
                      >
                        {activity.event}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: `${PLAN_COLORS[activity.plan as keyof typeof PLAN_COLORS]}40`,
                          color: PLAN_COLORS[activity.plan as keyof typeof PLAN_COLORS]
                        }}
                      >
                        {activity.plan}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400">{activity.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Platform Health */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Platform Health</CardTitle>
            <CardDescription className="text-slate-400">System status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-sm text-slate-300">Server Status</span>
              </div>
              <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                Operational
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-300">API Response</span>
              </div>
              <span className="text-sm text-slate-400">145ms avg</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-300">Error Rate</span>
              </div>
              <span className="text-sm text-green-500">0.02%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-300">DB Connections</span>
              </div>
              <span className="text-sm text-slate-400">45/100</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-300">Storage Used</span>
              </div>
              <span className="text-sm text-slate-400">2.3TB / 5TB</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-300">Uptime</span>
              </div>
              <span className="text-sm text-green-500">99.97%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/superadmin/organizations">
              <Button variant="outline" className="w-full h-auto py-4 flex-col border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700">
                <Building2 className="h-6 w-6 mb-2" />
                View Organizations
              </Button>
            </Link>
            <Link to="/superadmin/support">
              <Button variant="outline" className="w-full h-auto py-4 flex-col border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700">
                <AlertTriangle className="h-6 w-6 mb-2 text-amber-500" />
                Support Tickets
              </Button>
            </Link>
            <Link to="/superadmin/organizations?filter=payment_failed">
              <Button variant="outline" className="w-full h-auto py-4 flex-col border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700">
                <CreditCard className="h-6 w-6 mb-2 text-red-500" />
                Billing Issues
              </Button>
            </Link>
            <Link to="/superadmin/organizations?filter=near_limit">
              <Button variant="outline" className="w-full h-auto py-4 flex-col border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700">
                <Activity className="h-6 w-6 mb-2 text-orange-500" />
                Usage Alerts
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
