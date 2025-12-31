import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target,
  AlertTriangle,
  CheckCircle2,
  Download,
  RefreshCw
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface DepartmentStats {
  team: string;
  total: number;
  highRisk: number;
  avgScore: number;
}

export default function AttritionOverview() {
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [topFactors, setTopFactors] = useState<{factor: string; count: number}[]>([]);
  const [actionPlanStats, setActionPlanStats] = useState<any[]>([]);
  const [historicalTrend, setHistoricalTrend] = useState<any[]>([]);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all predictions
      const { data: predictionsData, error } = await supabase
        .from('attrition_predictions')
        .select('*');

      if (error) throw error;
      setPredictions(predictionsData || []);

      // Get employee profiles for department mapping
      const employeeIds = predictionsData?.map(p => p.employee_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, team')
        .in('user_id', employeeIds);

      // Calculate department stats
      const teamMap = new Map<string, { total: number; highRisk: number; scores: number[] }>();
      predictionsData?.forEach(p => {
        const profile = profiles?.find(pr => pr.user_id === p.employee_id);
        const team = profile?.team || 'Unknown';
        
        if (!teamMap.has(team)) {
          teamMap.set(team, { total: 0, highRisk: 0, scores: [] });
        }
        const stats = teamMap.get(team)!;
        stats.total++;
        if (p.risk_level === 'high' || p.risk_level === 'critical') {
          stats.highRisk++;
        }
        stats.scores.push(p.risk_score);
      });

      const deptStats: DepartmentStats[] = [];
      teamMap.forEach((value, key) => {
        deptStats.push({
          team: key,
          total: value.total,
          highRisk: value.highRisk,
          avgScore: Math.round(value.scores.reduce((a, b) => a + b, 0) / value.scores.length)
        });
      });
      setDepartmentStats(deptStats.sort((a, b) => b.avgScore - a.avgScore));

      // Calculate top factors
      const factorCount = new Map<string, number>();
      predictionsData?.forEach(p => {
        (p.contributing_factors as any[])?.forEach(f => {
          const current = factorCount.get(f.factor) || 0;
          factorCount.set(f.factor, current + 1);
        });
      });
      
      const factors: {factor: string; count: number}[] = [];
      factorCount.forEach((count, factor) => {
        factors.push({ factor, count });
      });
      setTopFactors(factors.sort((a, b) => b.count - a.count).slice(0, 10));

      // Fetch action plan stats
      const { data: plans } = await supabase
        .from('retention_action_plans')
        .select('*');

      const managerPlanStats = new Map<string, { total: number; completed: number }>();
      plans?.forEach(plan => {
        const managerId = plan.created_by;
        if (!managerPlanStats.has(managerId)) {
          managerPlanStats.set(managerId, { total: 0, completed: 0 });
        }
        const stats = managerPlanStats.get(managerId)!;
        stats.total++;
        if (plan.status === 'completed') {
          stats.completed++;
        }
      });

      // Fetch historical trend
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: history } = await supabase
        .from('attrition_prediction_history')
        .select('risk_score, recorded_at')
        .gte('recorded_at', thirtyDaysAgo.toISOString())
        .order('recorded_at', { ascending: true });

      // Group by date
      const dateScores = new Map<string, number[]>();
      history?.forEach(h => {
        const date = new Date(h.recorded_at).toLocaleDateString();
        if (!dateScores.has(date)) {
          dateScores.set(date, []);
        }
        dateScores.get(date)!.push(h.risk_score);
      });

      const trend: any[] = [];
      dateScores.forEach((scores, date) => {
        trend.push({
          date,
          avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        });
      });
      setHistoricalTrend(trend);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load attrition overview');
    } finally {
      setLoading(false);
    }
  };

  const runCalculation = async () => {
    setCalculating(true);
    try {
      const response = await supabase.functions.invoke('calculate-attrition-risk');
      if (response.error) throw response.error;
      toast.success(`Processed ${response.data?.processed || 0} employees`);
      fetchData();
    } catch (error) {
      console.error('Error running calculation:', error);
      toast.error('Failed to run attrition calculation');
    } finally {
      setCalculating(false);
    }
  };

  const exportReport = () => {
    const report = {
      generated: new Date().toISOString(),
      summary: {
        totalEmployees: predictions.length,
        criticalRisk: predictions.filter(p => p.risk_level === 'critical').length,
        highRisk: predictions.filter(p => p.risk_level === 'high').length,
        mediumRisk: predictions.filter(p => p.risk_level === 'medium').length,
        lowRisk: predictions.filter(p => p.risk_level === 'low').length,
        avgRiskScore: Math.round(predictions.reduce((a, p) => a + p.risk_score, 0) / predictions.length)
      },
      departmentBreakdown: departmentStats,
      topContributingFactors: topFactors
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attrition-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const riskDistribution = [
    { name: 'Critical', value: predictions.filter(p => p.risk_level === 'critical').length, color: 'hsl(var(--destructive))' },
    { name: 'High', value: predictions.filter(p => p.risk_level === 'high').length, color: '#f97316' },
    { name: 'Medium', value: predictions.filter(p => p.risk_level === 'medium').length, color: '#eab308' },
    { name: 'Low', value: predictions.filter(p => p.risk_level === 'low').length, color: '#22c55e' },
  ];

  const avgRiskScore = predictions.length > 0 
    ? Math.round(predictions.reduce((a, p) => a + p.risk_score, 0) / predictions.length)
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Attrition Overview</h1>
            <p className="text-muted-foreground">Organization-wide retention analytics</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={runCalculation} disabled={calculating}>
              <RefreshCw className={`h-4 w-4 mr-2 ${calculating ? 'animate-spin' : ''}`} />
              Recalculate
            </Button>
            <Button variant="outline" onClick={exportReport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{predictions.length}</p>
                  <p className="text-muted-foreground">Total Analyzed</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{avgRiskScore}</p>
                  <p className="text-muted-foreground">Avg Risk Score</p>
                </div>
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-destructive">
                    {predictions.filter(p => p.risk_level === 'critical' || p.risk_level === 'high').length}
                  </p>
                  <p className="text-muted-foreground">At Risk</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-500">
                    {predictions.filter(p => p.risk_level === 'low').length}
                  </p>
                  <p className="text-muted-foreground">Low Risk</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="distribution">
          <TabsList>
            <TabsTrigger value="distribution">Risk Distribution</TabsTrigger>
            <TabsTrigger value="departments">By Department</TabsTrigger>
            <TabsTrigger value="factors">Contributing Factors</TabsTrigger>
            <TabsTrigger value="trend">Historical Trend</TabsTrigger>
          </TabsList>

          <TabsContent value="distribution" className="mt-4">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Risk Level Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={riskDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {riskDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Risk Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {riskDistribution.map((item) => (
                    <div key={item.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{item.name}</span>
                        <span>{item.value} ({predictions.length > 0 ? Math.round((item.value / predictions.length) * 100) : 0}%)</span>
                      </div>
                      <Progress 
                        value={predictions.length > 0 ? (item.value / predictions.length) * 100 : 0} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="departments" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Department Risk Analysis</CardTitle>
                <CardDescription>Risk scores by team</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead>Total Employees</TableHead>
                      <TableHead>High/Critical Risk</TableHead>
                      <TableHead>Avg Risk Score</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departmentStats.map((dept) => (
                      <TableRow key={dept.team}>
                        <TableCell className="font-medium">{dept.team}</TableCell>
                        <TableCell>{dept.total}</TableCell>
                        <TableCell>
                          <Badge variant={dept.highRisk > 0 ? 'destructive' : 'secondary'}>
                            {dept.highRisk}
                          </Badge>
                        </TableCell>
                        <TableCell>{dept.avgScore}</TableCell>
                        <TableCell>
                          {dept.avgScore >= 60 ? (
                            <Badge variant="destructive">Needs Attention</Badge>
                          ) : dept.avgScore >= 40 ? (
                            <Badge variant="secondary">Monitor</Badge>
                          ) : (
                            <Badge className="bg-green-500">Healthy</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="factors" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Contributing Factors</CardTitle>
                <CardDescription>Most common reasons for attrition risk across the organization</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topFactors} layout="vertical">
                    <XAxis type="number" />
                    <YAxis dataKey="factor" type="category" width={200} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trend" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Risk Score Trend</CardTitle>
                <CardDescription>Average risk score over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                {historicalTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={historicalTrend}>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="avgScore" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <p>No historical data available yet. Run the calculation to start tracking.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
