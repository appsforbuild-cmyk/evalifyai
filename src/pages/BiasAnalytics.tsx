import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Download, TrendingUp, TrendingDown, Award, AlertTriangle, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BIAS_TYPE_INFO } from '@/hooks/useBiasDetection';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface BiasAuditEntry {
  id: string;
  user_id: string;
  content_type: string;
  bias_score: number;
  issues: any;
  created_at: string;
}

interface ManagerScore {
  userId: string;
  name: string;
  avgScore: number;
  feedbackCount: number;
  improvement: number;
}

const COLORS = ['#22c55e', '#eab308', '#f97316', '#ef4444', '#8b5cf6', '#6b7280'];

export default function BiasAnalytics() {
  const [timeRange, setTimeRange] = useState('3m');
  const [auditData, setAuditData] = useState<BiasAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const monthsBack = timeRange === '1m' ? 1 : timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12;
      const startDate = subMonths(new Date(), monthsBack);

      const { data, error } = await supabase
        .from('bias_audit_log')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAuditData(data || []);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const avgScore = auditData.length > 0 
    ? Math.round(auditData.reduce((sum, d) => sum + d.bias_score, 0) / auditData.length)
    : 0;

  const previousPeriodAvg = 75; // Mock for demo
  const scoreChange = avgScore - previousPeriodAvg;

  // Trend data by month
  const trendData = React.useMemo(() => {
    const months: Record<string, { month: string; avgScore: number; count: number; sum: number }> = {};
    
    auditData.forEach(entry => {
      const month = format(new Date(entry.created_at), 'MMM yyyy');
      if (!months[month]) {
        months[month] = { month, avgScore: 0, count: 0, sum: 0 };
      }
      months[month].sum += entry.bias_score;
      months[month].count++;
    });

    return Object.values(months).map(m => ({
      ...m,
      avgScore: Math.round(m.sum / m.count)
    }));
  }, [auditData]);

  // Bias type breakdown
  const biasTypeData = React.useMemo(() => {
    const types: Record<string, number> = {};
    
    auditData.forEach(entry => {
      const issues = entry.issues as any[] || [];
      issues.forEach(issue => {
        const type = issue.type || 'UNKNOWN';
        types[type] = (types[type] || 0) + 1;
      });
    });

    return Object.entries(types)
      .map(([name, value]) => ({
        name: BIAS_TYPE_INFO[name as keyof typeof BIAS_TYPE_INFO]?.label || name,
        value,
        type: name
      }))
      .sort((a, b) => b.value - a.value);
  }, [auditData]);

  // Mock manager leaderboard
  const managerLeaderboard: ManagerScore[] = [
    { userId: '1', name: 'Sarah Johnson', avgScore: 92, feedbackCount: 24, improvement: 8 },
    { userId: '2', name: 'Michael Chen', avgScore: 88, feedbackCount: 18, improvement: 12 },
    { userId: '3', name: 'Emily Davis', avgScore: 85, feedbackCount: 22, improvement: 5 },
    { userId: '4', name: 'James Wilson', avgScore: 78, feedbackCount: 15, improvement: -2 },
    { userId: '5', name: 'Lisa Brown', avgScore: 72, feedbackCount: 20, improvement: 15 },
  ];

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log('Export PDF');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Bias Analytics</h1>
            <p className="text-muted-foreground">
              Organization-wide fairness and bias detection insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">Last Month</SelectItem>
                <SelectItem value="3m">Last 3 Months</SelectItem>
                <SelectItem value="6m">Last 6 Months</SelectItem>
                <SelectItem value="12m">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Average Fairness Score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold">{avgScore}</span>
                <span className="text-muted-foreground">/100</span>
                {scoreChange !== 0 && (
                  <Badge className={scoreChange > 0 ? 'bg-green-500' : 'bg-red-500'}>
                    {scoreChange > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {Math.abs(scoreChange)}%
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Feedback Analyzed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{auditData.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Issues Detected</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span className="text-3xl font-bold">
                  {auditData.reduce((sum, d) => sum + ((d.issues as any[])?.length || 0), 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Certified Managers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-500" />
                <span className="text-3xl font-bold">12</span>
                <span className="text-muted-foreground text-sm">/18</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="trends" className="space-y-4">
          <TabsList>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="types">Bias Types</TabsTrigger>
            <TabsTrigger value="leaderboard">Manager Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle>Fairness Score Trend</CardTitle>
                <CardDescription>Average bias score over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="avgScore" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="types">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Most Common Bias Types</CardTitle>
                  <CardDescription>Distribution of detected bias categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={biasTypeData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={120} />
                        <Tooltip />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bias Type Breakdown</CardTitle>
                  <CardDescription>Percentage distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={biasTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {biasTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Manager Fairness Leaderboard
                </CardTitle>
                <CardDescription>Ranked by average fairness score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {managerLeaderboard.map((manager, index) => (
                    <div 
                      key={manager.userId}
                      className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{manager.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {manager.feedbackCount} feedback entries
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{manager.avgScore}</div>
                        <div className="flex items-center gap-1 text-sm">
                          {manager.improvement > 0 ? (
                            <span className="text-green-500 flex items-center">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              +{manager.improvement}%
                            </span>
                          ) : manager.improvement < 0 ? (
                            <span className="text-red-500 flex items-center">
                              <TrendingDown className="h-3 w-3 mr-1" />
                              {manager.improvement}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">No change</span>
                          )}
                        </div>
                      </div>
                      {manager.avgScore >= 85 && (
                        <Badge className="bg-green-500">
                          <Award className="h-3 w-3 mr-1" />
                          Certified
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Organizational Benchmark */}
        <Card>
          <CardHeader>
            <CardTitle>Organizational Benchmark</CardTitle>
            <CardDescription>How your organization compares to industry standards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground mb-1">Your Organization</div>
                <div className="text-4xl font-bold text-primary">{avgScore}</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground mb-1">Industry Average</div>
                <div className="text-4xl font-bold text-muted-foreground">72</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="text-sm text-green-600 mb-1">Your Standing</div>
                <div className="text-4xl font-bold text-green-600">
                  {avgScore > 72 ? 'Above Average' : avgScore < 72 ? 'Below Average' : 'Average'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
