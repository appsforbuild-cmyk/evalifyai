import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { KPICard } from '../KPICard';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MessageSquare, TrendingUp, Users, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnalyticsFilters } from '../AnalyticsFilters';

interface OverviewTabProps {
  filters: AnalyticsFilters;
  isLoading: boolean;
}

// Mock data
const feedbackVolumeData = Array.from({ length: 90 }, (_, i) => ({
  date: new Date(Date.now() - (89 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  sessions: Math.floor(Math.random() * 15) + 5,
}));

const departmentData = [
  { department: 'Engineering', sessions: 145 },
  { department: 'Product', sessions: 98 },
  { department: 'Design', sessions: 67 },
  { department: 'Marketing', sessions: 54 },
  { department: 'Sales', sessions: 89 },
  { department: 'HR', sessions: 34 },
];

const topPerformers = [
  { rank: 1, name: 'Sarah Chen', team: 'Engineering', score: 94, trend: '+5%' },
  { rank: 2, name: 'Michael Rodriguez', team: 'Product', score: 92, trend: '+3%' },
  { rank: 3, name: 'Emily Watson', team: 'Design', score: 90, trend: '+7%' },
  { rank: 4, name: 'David Kim', team: 'Engineering', score: 89, trend: '+2%' },
  { rank: 5, name: 'Jessica Park', team: 'Sales', score: 88, trend: '+4%' },
  { rank: 6, name: 'Robert Taylor', team: 'Marketing', score: 87, trend: '+1%' },
  { rank: 7, name: 'Amanda Foster', team: 'HR', score: 86, trend: '+6%' },
  { rank: 8, name: 'Chris Johnson', team: 'Engineering', score: 85, trend: '+2%' },
  { rank: 9, name: 'Lisa Anderson', team: 'Product', score: 84, trend: '+3%' },
  { rank: 10, name: 'James Wilson', team: 'Sales', score: 83, trend: '+5%' },
];

export function OverviewTab({ filters, isLoading }: OverviewTabProps) {
  const navigate = useNavigate();

  const sparklineData1 = [45, 52, 48, 61, 55, 67, 72, 68, 75, 82];
  const sparklineData2 = [72, 68, 75, 78, 82, 79, 85, 88, 84, 87];
  const sparklineData3 = [60, 65, 58, 62, 70, 75, 72, 78, 82, 80];
  const sparklineData4 = [85, 82, 88, 90, 87, 92, 89, 94, 91, 95];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Feedback Sessions"
          value={487}
          change={12.5}
          sparklineData={sparklineData1}
          tooltip="Total number of feedback sessions conducted in the selected period"
          icon={<MessageSquare className="h-5 w-5" />}
          isLoading={isLoading}
        />
        <KPICard
          title="Avg Bias Score"
          value={87}
          change={5.2}
          sparklineData={sparklineData2}
          format="number"
          tooltip="Average fairness score across all feedback (0-100, higher is better)"
          icon={<TrendingUp className="h-5 w-5" />}
          isLoading={isLoading}
        />
        <KPICard
          title="Employee Engagement"
          value={78.5}
          change={3.8}
          sparklineData={sparklineData3}
          format="percentage"
          tooltip="Overall employee engagement score based on feedback participation and recognition"
          icon={<Users className="h-5 w-5" />}
          isLoading={isLoading}
        />
        <KPICard
          title="Completion Rate"
          value={94.2}
          change={2.1}
          sparklineData={sparklineData4}
          format="percentage"
          tooltip="Percentage of scheduled feedback sessions that were completed"
          icon={<CheckCircle className="h-5 w-5" />}
          isLoading={isLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feedback Volume Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Feedback Volume (Last 90 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={feedbackVolumeData.filter((_, i) => i % 7 === 0)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Feedback by Department */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Feedback by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="department" type="category" width={80} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="sessions" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performers */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Top Performers by Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPerformers.map((performer) => (
                  <TableRow key={performer.rank}>
                    <TableCell>
                      <Badge variant={performer.rank <= 3 ? 'default' : 'secondary'}>
                        #{performer.rank}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{performer.name}</TableCell>
                    <TableCell className="text-muted-foreground">{performer.team}</TableCell>
                    <TableCell className="text-right font-mono">{performer.score}</TableCell>
                    <TableCell className="text-right text-green-500">{performer.trend}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* At-Risk Employees Card */}
        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Attrition Risk Alert
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <p className="text-5xl font-bold text-destructive">12</p>
              <p className="text-sm text-muted-foreground mt-1">Employees at High/Critical Risk</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Critical Risk</span>
                <span className="font-medium text-destructive">3</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">High Risk</span>
                <span className="font-medium text-orange-500">9</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Medium Risk</span>
                <span className="font-medium text-yellow-500">24</span>
              </div>
            </div>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => navigate('/retention-alerts')}
            >
              View Retention Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
