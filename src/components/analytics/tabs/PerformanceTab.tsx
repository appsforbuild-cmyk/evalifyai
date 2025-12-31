import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ScatterChart, Scatter, Cell } from 'recharts';
import { AnalyticsFilters } from '../AnalyticsFilters';

interface PerformanceTabProps {
  filters: AnalyticsFilters;
  isLoading: boolean;
}

const goalCompletionByTeam = [
  { team: 'Engineering', rate: 82 },
  { team: 'Product', rate: 78 },
  { team: 'Design', rate: 85 },
  { team: 'Marketing', rate: 72 },
  { team: 'Sales', rate: 88 },
];

const milestoneData = [
  { quarter: 'Q1', achieved: 45, pending: 15, missed: 5 },
  { quarter: 'Q2', achieved: 52, pending: 12, missed: 8 },
  { quarter: 'Q3', achieved: 58, pending: 10, missed: 4 },
  { quarter: 'Q4', achieved: 48, pending: 18, missed: 6 },
];

const performanceTrend = Array.from({ length: 12 }, (_, i) => ({
  month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
  score: 70 + Math.floor(i * 0.8) + Math.floor(Math.random() * 5),
}));

const quadrantData = [
  { name: 'Sarah Chen', potential: 90, performance: 92 },
  { name: 'Mike Williams', potential: 85, performance: 88 },
  { name: 'John Smith', potential: 75, performance: 82 },
  { name: 'Emily Davis', potential: 88, performance: 65 },
  { name: 'Robert Brown', potential: 60, performance: 55 },
  { name: 'Lisa Anderson', potential: 95, performance: 75 },
  { name: 'David Kim', potential: 70, performance: 90 },
  { name: 'Amanda Foster', potential: 55, performance: 70 },
];

export function PerformanceTab({ filters, isLoading }: PerformanceTabProps) {
  const getQuadrantColor = (potential: number, performance: number) => {
    if (potential >= 75 && performance >= 75) return 'hsl(142, 76%, 36%)'; // High performers
    if (potential >= 75 && performance < 75) return 'hsl(48, 96%, 53%)'; // High potential
    if (potential < 75 && performance >= 75) return 'hsl(221, 83%, 53%)'; // Solid performers
    return 'hsl(0, 84%, 60%)'; // Needs support
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Goal Completion by Team</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={goalCompletionByTeam}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="team" className="text-xs" />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="rate" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Milestone Achievement by Quarter</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={milestoneData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="quarter" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="achieved" stackId="a" fill="hsl(142, 76%, 36%)" name="Achieved" />
                  <Bar dataKey="pending" stackId="a" fill="hsl(48, 96%, 53%)" name="Pending" />
                  <Bar dataKey="missed" stackId="a" fill="hsl(0, 84%, 60%)" name="Missed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Performance Improvement Trend</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis domain={[60, 100]} className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Performance vs Potential Matrix</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[280px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" dataKey="performance" name="Performance" domain={[40, 100]} className="text-xs" />
                  <YAxis type="number" dataKey="potential" name="Potential" domain={[40, 100]} className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
                  <Scatter data={quadrantData}>
                    {quadrantData.map((entry, i) => (
                      <Cell key={i} fill={getQuadrantColor(entry.potential, entry.performance)} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              {/* Quadrant labels */}
              <div className="absolute top-4 right-4 text-xs text-green-500">Stars</div>
              <div className="absolute top-4 left-16 text-xs text-yellow-500">High Potential</div>
              <div className="absolute bottom-12 right-4 text-xs text-blue-500">Solid</div>
              <div className="absolute bottom-12 left-16 text-xs text-red-500">Develop</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
