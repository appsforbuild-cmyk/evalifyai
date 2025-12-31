import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { AnalyticsFilters } from '../AnalyticsFilters';

interface EngagementTabProps {
  filters: AnalyticsFilters;
  isLoading: boolean;
}

// Mock data
const engagementByDept = [
  { department: 'Engineering', score: 85 },
  { department: 'Product', score: 82 },
  { department: 'Design', score: 88 },
  { department: 'Marketing', score: 76 },
  { department: 'Sales', score: 79 },
  { department: 'HR', score: 91 },
  { department: 'Finance', score: 72 },
].sort((a, b) => b.score - a.score);

const engagementTrend = Array.from({ length: 12 }, (_, i) => ({
  month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
  score: Math.floor(Math.random() * 15) + 70,
}));

const engagementDrivers = [
  { driver: 'Recognition', impact: 92, color: 'hsl(var(--chart-1))' },
  { driver: 'Growth Opportunities', impact: 85, color: 'hsl(var(--chart-2))' },
  { driver: 'Manager Relationship', impact: 88, color: 'hsl(var(--chart-3))' },
  { driver: 'Work-Life Balance', impact: 78, color: 'hsl(var(--chart-4))' },
  { driver: 'Compensation', impact: 72, color: 'hsl(var(--chart-5))' },
];

const surveyParticipation = Array.from({ length: 8 }, (_, i) => ({
  survey: `Q${Math.floor(i / 4) + 1} ${2023 + Math.floor(i / 4)}`,
  rate: Math.floor(Math.random() * 20) + 70,
}));

export function EngagementTab({ filters, isLoading }: EngagementTabProps) {
  const overallScore = 78;
  const enpsScore = 42;
  const enpsTrend = '+5';

  // Gauge chart data
  const gaugeData = [
    { name: 'score', value: overallScore, fill: 'hsl(var(--primary))' },
    { name: 'remaining', value: 100 - overallScore, fill: 'hsl(var(--muted))' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gauge Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Overall Engagement Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="100%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={0}
                    dataKey="value"
                  >
                    {gaugeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-8">
                <p className="text-4xl font-bold">{overallScore}</p>
                <p className="text-sm text-muted-foreground">out of 100</p>
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </CardContent>
        </Card>

        {/* eNPS Score */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">eNPS Score</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[250px]">
            <div className="text-6xl font-bold text-primary">{enpsScore}</div>
            <p className="text-lg text-green-500 mt-2">{enpsTrend} from last quarter</p>
            <div className="w-full mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Promoters (9-10)</span>
                <span className="font-medium">52%</span>
              </div>
              <Progress value={52} className="h-2" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Passives (7-8)</span>
                <span className="font-medium">38%</span>
              </div>
              <Progress value={38} className="h-2" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Detractors (0-6)</span>
                <span className="font-medium">10%</span>
              </div>
              <Progress value={10} className="h-2 [&>div]:bg-destructive" />
            </div>
          </CardContent>
        </Card>

        {/* Engagement Drivers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Engagement Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {engagementDrivers.map((driver) => (
                <div key={driver.driver} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{driver.driver}</span>
                    <span className="font-medium">{driver.impact}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${driver.impact}%`, backgroundColor: driver.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement by Department */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Engagement by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementByDept} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" domain={[0, 100]} className="text-xs" />
                  <YAxis dataKey="department" type="category" width={90} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {engagementByDept.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.score >= 85 ? 'hsl(var(--chart-1))' : entry.score >= 75 ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-4))'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Engagement Trend (12 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={engagementTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis domain={[60, 100]} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Survey Participation Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={surveyParticipation}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="survey" className="text-xs" />
                <YAxis domain={[50, 100]} className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
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
  );
}
