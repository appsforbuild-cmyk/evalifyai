import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { AnalyticsFilters } from '../AnalyticsFilters';

interface RetentionTabProps {
  filters: AnalyticsFilters;
  isLoading: boolean;
}

const riskDistribution = [
  { name: 'Low', value: 120, color: 'hsl(142, 76%, 36%)' },
  { name: 'Medium', value: 45, color: 'hsl(48, 96%, 53%)' },
  { name: 'High', value: 18, color: 'hsl(25, 95%, 53%)' },
  { name: 'Critical', value: 5, color: 'hsl(0, 84%, 60%)' },
];

const riskFactors = [
  { factor: 'Low feedback frequency', count: 42 },
  { factor: 'No recognition received', count: 38 },
  { factor: 'Missed milestones', count: 28 },
  { factor: 'Low engagement score', count: 25 },
  { factor: 'Manager relationship issues', count: 18 },
];

const predictedVsActual = Array.from({ length: 6 }, (_, i) => ({
  month: new Date(2024, i + 6, 1).toLocaleDateString('en-US', { month: 'short' }),
  predicted: Math.floor(Math.random() * 5) + 3,
  actual: Math.floor(Math.random() * 4) + 2,
}));

const retentionActions = [
  { action: '1:1 Meeting', taken: 45, successful: 38, rate: '84%' },
  { action: 'Career Path Discussion', taken: 32, successful: 28, rate: '88%' },
  { action: 'Compensation Review', taken: 15, successful: 12, rate: '80%' },
  { action: 'Role Change', taken: 8, successful: 7, rate: '88%' },
];

export function RetentionTab({ filters, isLoading }: RetentionTabProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Risk Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {riskDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Top Risk Factors</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskFactors} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="factor" type="category" width={130} className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Predicted vs Actual Attrition</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={predictedVsActual}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="predicted" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                  <Line type="monotone" dataKey="actual" stroke="hsl(var(--destructive))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Retention Actions & Outcomes</CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate('/retention-alerts')}>
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action Type</TableHead>
                <TableHead className="text-right">Actions Taken</TableHead>
                <TableHead className="text-right">Successful</TableHead>
                <TableHead className="text-right">Success Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {retentionActions.map((a) => (
                <TableRow key={a.action}>
                  <TableCell className="font-medium">{a.action}</TableCell>
                  <TableCell className="text-right">{a.taken}</TableCell>
                  <TableCell className="text-right text-green-500">{a.successful}</TableCell>
                  <TableCell className="text-right"><Badge>{a.rate}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
