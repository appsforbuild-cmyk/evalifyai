import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, Line, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { AnalyticsFilters } from '../AnalyticsFilters';

interface FeedbackAnalyticsTabProps {
  filters: AnalyticsFilters;
  isLoading: boolean;
}

// Mock data
const feedbackOverTime = Array.from({ length: 12 }, (_, i) => ({
  month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
  sessions: Math.floor(Math.random() * 50) + 30,
}));

const feedbackByType = [
  { name: 'Performance', value: 45, color: 'hsl(var(--chart-1))' },
  { name: 'Quick Feedback', value: 35, color: 'hsl(var(--chart-2))' },
  { name: 'Recognition', value: 20, color: 'hsl(var(--chart-3))' },
];

const responseTimeData = Array.from({ length: 6 }, (_, i) => ({
  month: new Date(2024, i + 6, 1).toLocaleDateString('en-US', { month: 'short' }),
  avgDays: Math.floor(Math.random() * 5) + 2,
}));

const qualityScores = Array.from({ length: 12 }, (_, i) => ({
  month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
  score: Math.floor(Math.random() * 15) + 80,
}));

const activeManagers = [
  { name: 'John Smith', sessions: 45, biasScore: 92, completionRate: 98 },
  { name: 'Sarah Johnson', sessions: 38, biasScore: 88, completionRate: 95 },
  { name: 'Mike Williams', sessions: 32, biasScore: 95, completionRate: 100 },
  { name: 'Emily Davis', sessions: 28, biasScore: 85, completionRate: 92 },
  { name: 'Robert Brown', sessions: 25, biasScore: 90, completionRate: 96 },
];

const heatmapData = [
  { day: 'Mon', '9am': 8, '10am': 12, '11am': 15, '12pm': 5, '1pm': 3, '2pm': 18, '3pm': 22, '4pm': 16, '5pm': 8 },
  { day: 'Tue', '9am': 10, '10am': 14, '11am': 18, '12pm': 6, '1pm': 4, '2pm': 20, '3pm': 25, '4pm': 18, '5pm': 10 },
  { day: 'Wed', '9am': 12, '10am': 16, '11am': 20, '12pm': 8, '1pm': 5, '2pm': 22, '3pm': 28, '4pm': 20, '5pm': 12 },
  { day: 'Thu', '9am': 9, '10am': 13, '11am': 17, '12pm': 7, '1pm': 4, '2pm': 19, '3pm': 24, '4pm': 17, '5pm': 9 },
  { day: 'Fri', '9am': 6, '10am': 10, '11am': 14, '12pm': 4, '1pm': 2, '2pm': 15, '3pm': 18, '4pm': 12, '5pm': 5 },
];

export function FeedbackAnalyticsTab({ filters, isLoading }: FeedbackAnalyticsTabProps) {
  const timeSlots = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm'];

  const getHeatmapColor = (value: number) => {
    if (value >= 25) return 'bg-primary';
    if (value >= 18) return 'bg-primary/80';
    if (value >= 12) return 'bg-primary/60';
    if (value >= 6) return 'bg-primary/40';
    return 'bg-primary/20';
  };

  return (
    <div className="space-y-6">
      {/* Top Row Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sessions Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Feedback Sessions Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={feedbackOverTime}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
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

        {/* Feedback by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Feedback by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={feedbackByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {feedbackByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Avg Response Time (Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={responseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="avgDays" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quality Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Feedback Quality Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={qualityScores}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis domain={[70, 100]} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-3))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Active Managers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Most Active Managers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Manager</TableHead>
                  <TableHead className="text-right">Sessions</TableHead>
                  <TableHead className="text-right">Bias Score</TableHead>
                  <TableHead className="text-right">Completion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeManagers.map((manager) => (
                  <TableRow key={manager.name}>
                    <TableCell className="font-medium">{manager.name}</TableCell>
                    <TableCell className="text-right">{manager.sessions}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={manager.biasScore >= 90 ? 'default' : 'secondary'}>
                        {manager.biasScore}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{manager.completionRate}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Feedback Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Feedback Activity Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Header */}
              <div className="flex gap-1">
                <div className="w-10" />
                {timeSlots.map((slot) => (
                  <div key={slot} className="flex-1 text-center text-xs text-muted-foreground">
                    {slot}
                  </div>
                ))}
              </div>
              {/* Rows */}
              {heatmapData.map((row) => (
                <div key={row.day} className="flex gap-1">
                  <div className="w-10 text-xs text-muted-foreground flex items-center">
                    {row.day}
                  </div>
                  {timeSlots.map((slot) => (
                    <div
                      key={`${row.day}-${slot}`}
                      className={`flex-1 h-8 rounded ${getHeatmapColor(row[slot as keyof typeof row] as number)}`}
                      title={`${row.day} ${slot}: ${row[slot as keyof typeof row]} sessions`}
                    />
                  ))}
                </div>
              ))}
              {/* Legend */}
              <div className="flex justify-end gap-2 mt-4 text-xs text-muted-foreground">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="w-4 h-4 rounded bg-primary/20" />
                  <div className="w-4 h-4 rounded bg-primary/40" />
                  <div className="w-4 h-4 rounded bg-primary/60" />
                  <div className="w-4 h-4 rounded bg-primary/80" />
                  <div className="w-4 h-4 rounded bg-primary" />
                </div>
                <span>More</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
