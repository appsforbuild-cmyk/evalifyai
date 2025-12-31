import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Target,
  BarChart3,
  Activity,
  AlertTriangle
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Funnel,
  FunnelChart,
  LabelList
} from 'recharts';
import { format, subDays, subMonths } from 'date-fns';

const COLORS = ['#f59e0b', '#3b82f6', '#22c55e', '#a855f7', '#ef4444'];

export default function SuperAdminAnalytics() {
  const [stats, setStats] = useState({
    mrr: 0,
    arr: 0,
    arpa: 0,
    ltv: 0,
    churnRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for charts
  const revenueData = Array.from({ length: 12 }, (_, i) => ({
    month: format(subMonths(new Date(), 11 - i), 'MMM'),
    revenue: Math.floor(Math.random() * 50000) + 30000
  }));

  const planRevenue = [
    { name: 'Starter', value: 15000, color: '#22c55e' },
    { name: 'Professional', value: 45000, color: '#3b82f6' },
    { name: 'Enterprise', value: 80000, color: '#a855f7' }
  ];

  const churnData = Array.from({ length: 6 }, (_, i) => ({
    month: format(subMonths(new Date(), 5 - i), 'MMM'),
    rate: (Math.random() * 3 + 1).toFixed(1)
  }));

  const featureAdoption = [
    { name: 'Voice Feedback', adoption: 92 },
    { name: 'Goals', adoption: 78 },
    { name: 'Bias Detection', adoption: 65 },
    { name: 'Analytics', adoption: 58 },
    { name: 'Recognition', adoption: 45 },
    { name: 'Gamification', adoption: 32 }
  ];

  const funnelData = [
    { name: 'Landing Page Visits', value: 10000, fill: '#f59e0b' },
    { name: 'Signups', value: 2500, fill: '#3b82f6' },
    { name: 'Activations', value: 1200, fill: '#22c55e' },
    { name: 'Paid Conversions', value: 400, fill: '#a855f7' }
  ];

  const engagementScores = [
    { org: 'TechCorp', score: 95, status: 'healthy' },
    { org: 'StartupXYZ', score: 88, status: 'healthy' },
    { org: 'BigCo', score: 72, status: 'moderate' },
    { org: 'SmallBiz', score: 45, status: 'at-risk' },
    { org: 'NewClient', score: 23, status: 'critical' }
  ];

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { count: orgCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const mockMRR = (orgCount || 0) * 199;
      
      setStats({
        mrr: mockMRR,
        arr: mockMRR * 12,
        arpa: 199,
        ltv: 199 * 24,
        churnRate: 2.1
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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
        <h1 className="text-2xl font-bold text-white">Platform Analytics</h1>
        <p className="text-slate-400">Financial and usage analytics across all organizations</p>
      </div>

      <Tabs defaultValue="financial" className="space-y-6">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="financial" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500">
            Financial
          </TabsTrigger>
          <TabsTrigger value="usage" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500">
            Usage
          </TabsTrigger>
          <TabsTrigger value="growth" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500">
            Growth
          </TabsTrigger>
          <TabsTrigger value="engagement" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500">
            Engagement
          </TabsTrigger>
        </TabsList>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">MRR</p>
                    <p className="text-xl font-bold text-white">${stats.mrr.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-amber-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">ARR</p>
                    <p className="text-xl font-bold text-white">${stats.arr.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">ARPA</p>
                    <p className="text-xl font-bold text-white">${stats.arpa}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">LTV</p>
                    <p className="text-xl font-bold text-white">${stats.ltv.toLocaleString()}</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Churn Rate</p>
                    <p className="text-xl font-bold text-white">{stats.churnRate}%</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">MRR Trend</CardTitle>
                <CardDescription className="text-slate-400">Last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#f59e0b"
                        fill="url(#revenueGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Revenue by Plan</CardTitle>
                <CardDescription className="text-slate-400">Distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={planRevenue}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        labelLine={false}
                      >
                        {planRevenue.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  {planRevenue.map((plan, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: plan.color }}
                      />
                      <span className="text-sm text-slate-400">{plan.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Churn Analysis */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Churn Rate Trend</CardTitle>
              <CardDescription className="text-slate-400">Monthly churn percentage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={churnData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`${value}%`, 'Churn Rate']}
                    />
                    <Bar dataKey="rate" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Feature Adoption</CardTitle>
              <CardDescription className="text-slate-400">Percentage of organizations using each feature</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={featureAdoption} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={120} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`${value}%`, 'Adoption']}
                    />
                    <Bar dataKey="adoption" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Growth Tab */}
        <TabsContent value="growth" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Conversion Funnel</CardTitle>
              <CardDescription className="text-slate-400">From landing page to paid conversion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funnelData.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">{item.name}</span>
                      <span className="text-white font-medium">{item.value.toLocaleString()}</span>
                    </div>
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(item.value / funnelData[0].value) * 100}%`,
                          backgroundColor: item.fill
                        }}
                      />
                    </div>
                    {index < funnelData.length - 1 && (
                      <p className="text-xs text-slate-500">
                        {((funnelData[index + 1].value / item.value) * 100).toFixed(1)}% conversion
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Organization Health Scores</CardTitle>
              <CardDescription className="text-slate-400">Engagement and activity metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {engagementScores.map((org, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 rounded-lg bg-slate-700/50">
                    <div className="flex-1">
                      <p className="text-white font-medium">{org.org}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              org.status === 'healthy' ? 'bg-green-500' :
                              org.status === 'moderate' ? 'bg-yellow-500' :
                              org.status === 'at-risk' ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${org.score}%` }}
                          />
                        </div>
                        <span className="text-sm text-slate-400 w-12">{org.score}%</span>
                      </div>
                    </div>
                    <Badge
                      className={
                        org.status === 'healthy' ? 'bg-green-500/20 text-green-500 border-green-500/30' :
                        org.status === 'moderate' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' :
                        org.status === 'at-risk' ? 'bg-orange-500/20 text-orange-500 border-orange-500/30' :
                        'bg-red-500/20 text-red-500 border-red-500/30'
                      }
                    >
                      {org.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
