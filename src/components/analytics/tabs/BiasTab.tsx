import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AnalyticsFilters } from '../AnalyticsFilters';

interface BiasTabProps {
  filters: AnalyticsFilters;
  isLoading: boolean;
}

const biasTypes = [
  { name: 'Gender', value: 35, color: 'hsl(var(--chart-1))' },
  { name: 'Recency', value: 28, color: 'hsl(var(--chart-2))' },
  { name: 'Halo Effect', value: 22, color: 'hsl(var(--chart-3))' },
  { name: 'Attribution', value: 15, color: 'hsl(var(--chart-4))' },
];

const biasScoreByDept = [
  { department: 'Engineering', score: 88 },
  { department: 'HR', score: 94 },
  { department: 'Sales', score: 82 },
  { department: 'Product', score: 90 },
  { department: 'Marketing', score: 85 },
];

const biasReduction = Array.from({ length: 12 }, (_, i) => ({
  month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
  score: 75 + Math.floor(i * 1.5) + Math.floor(Math.random() * 3),
}));

const managerBiasScores = [
  { name: 'Sarah Johnson', score: 95, sessions: 38, status: 'excellent' },
  { name: 'Mike Williams', score: 92, sessions: 32, status: 'excellent' },
  { name: 'John Smith', score: 88, sessions: 45, status: 'good' },
  { name: 'Emily Davis', score: 85, sessions: 28, status: 'good' },
  { name: 'Robert Brown', score: 78, sessions: 25, status: 'needs_improvement' },
];

export function BiasTab({ filters, isLoading }: BiasTabProps) {
  return (
    <div className="space-y-6">
      {/* Top Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="pt-6 text-center">
            <p className="text-6xl font-bold text-primary">87</p>
            <p className="text-lg text-muted-foreground mt-2">Company-wide Fairness Score</p>
            <p className="text-sm text-green-500 mt-1">↑ 5.2% from last quarter</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Most Common Bias Types</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={biasTypes} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name }) => name}>
                    {biasTypes.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Training Certification</CardTitle></CardHeader>
          <CardContent className="text-center pt-4">
            <p className="text-5xl font-bold text-green-500">78%</p>
            <p className="text-muted-foreground mt-2">Managers Certified</p>
            <div className="mt-4 text-sm">
              <div className="flex justify-between"><span>Certified</span><span>39/50</span></div>
              <div className="flex justify-between text-muted-foreground"><span>In Progress</span><span>8/50</span></div>
              <div className="flex justify-between text-destructive"><span>Not Started</span><span>3/50</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Bias Score by Department</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={biasScoreByDept}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="department" className="text-xs" />
                  <YAxis domain={[70, 100]} className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="score" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Bias Reduction Over Time</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={biasReduction}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis domain={[70, 100]} className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manager Table */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Bias Score by Manager</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Manager</TableHead>
                <TableHead className="text-right">Sessions</TableHead>
                <TableHead className="text-right">Fairness Score</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {managerBiasScores.map((m) => (
                <TableRow key={m.name}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-right">{m.sessions}</TableCell>
                  <TableCell className="text-right font-mono">{m.score}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={m.status === 'excellent' ? 'default' : m.status === 'good' ? 'secondary' : 'destructive'}>
                      {m.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
