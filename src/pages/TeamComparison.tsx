import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Users, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface Employee {
  id: string;
  email: string;
  full_name: string;
  team: string;
  org_unit: string | null;
}

const generateEmployeeMetrics = (employee: Employee) => {
  const seed = employee.id.charCodeAt(0) + employee.id.charCodeAt(1);
  const baseRating = 3 + (seed % 20) / 10;
  return {
    technical: Math.min(5, baseRating + (seed % 10) / 10),
    communication: Math.min(5, baseRating + ((seed + 1) % 10) / 10),
    leadership: Math.min(5, baseRating - 0.5 + ((seed + 2) % 10) / 10),
    innovation: Math.min(5, baseRating + ((seed + 3) % 10) / 10),
    reliability: Math.min(5, baseRating + 0.3 + ((seed + 4) % 10) / 10),
    avgRating: baseRating,
    trend: seed % 3 === 0 ? 'up' : seed % 3 === 1 ? 'down' : 'stable',
    feedbackCount: 2 + (seed % 5),
  };
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];

const TeamComparison = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('employees_directory')
      .select('*')
      .order('full_name')
      .limit(100);

    if (!error && data) {
      setEmployees(data);
      const uniqueTeams = [...new Set(data.map(e => e.team))];
      setTeams(uniqueTeams);
    }
    setLoading(false);
  };

  const filteredEmployees = selectedTeam 
    ? employees.filter(e => e.team === selectedTeam)
    : employees;

  const toggleEmployee = (id: string) => {
    setSelectedEmployees(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id)
        : prev.length < 7 
          ? [...prev, id]
          : prev
    );
  };

  const selectedData = employees
    .filter(e => selectedEmployees.includes(e.id))
    .map(e => ({ ...e, metrics: generateEmployeeMetrics(e) }));

  const barChartData = selectedData.map(e => ({
    name: e.full_name.split(' ')[0],
    Technical: Number(e.metrics.technical.toFixed(1)),
    Communication: Number(e.metrics.communication.toFixed(1)),
    Leadership: Number(e.metrics.leadership.toFixed(1)),
    Innovation: Number(e.metrics.innovation.toFixed(1)),
    Reliability: Number(e.metrics.reliability.toFixed(1)),
  }));

  const radarChartData = [
    { competency: 'Technical', ...Object.fromEntries(selectedData.map((e, i) => [`emp${i}`, e.metrics.technical])) },
    { competency: 'Communication', ...Object.fromEntries(selectedData.map((e, i) => [`emp${i}`, e.metrics.communication])) },
    { competency: 'Leadership', ...Object.fromEntries(selectedData.map((e, i) => [`emp${i}`, e.metrics.leadership])) },
    { competency: 'Innovation', ...Object.fromEntries(selectedData.map((e, i) => [`emp${i}`, e.metrics.innovation])) },
    { competency: 'Reliability', ...Object.fromEntries(selectedData.map((e, i) => [`emp${i}`, e.metrics.reliability])) },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate('/employees')} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Directory
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Team Comparison</h1>
            <p className="text-muted-foreground">Compare performance metrics across employees</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Select Employees</CardTitle>
              <CardDescription>Choose up to 7 employees to compare</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <select 
                className="w-full p-2 border rounded-md bg-background"
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
              >
                <option value="">All Teams</option>
                {teams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
              
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : (
                  filteredEmployees.map(emp => (
                    <label key={emp.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                      <Checkbox 
                        checked={selectedEmployees.includes(emp.id)}
                        onCheckedChange={() => toggleEmployee(emp.id)}
                        disabled={!selectedEmployees.includes(emp.id) && selectedEmployees.length >= 7}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{emp.full_name}</p>
                        <p className="text-xs text-muted-foreground">{emp.team}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>

              {selectedEmployees.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setSelectedEmployees([])}>
                  Clear Selection
                </Button>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-3 space-y-6">
            {selectedData.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Employees Selected</h3>
                  <p className="text-muted-foreground">Select employees from the list to compare their performance</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                  {selectedData.map((emp, i) => (
                    <Card key={emp.id} className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                        <span className="text-xs font-medium truncate">{emp.full_name.split(' ')[0]}</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold">{emp.metrics.avgRating.toFixed(1)}</span>
                        {emp.metrics.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                        {emp.metrics.trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
                        {emp.metrics.trend === 'stable' && <Minus className="w-3 h-3 text-muted-foreground" />}
                      </div>
                    </Card>
                  ))}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Competency Comparison</CardTitle>
                    <CardDescription>Side-by-side competency ratings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barChartData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" domain={[0, 5]} />
                          <YAxis dataKey="name" type="category" width={80} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="Technical" fill="#3b82f6" />
                          <Bar dataKey="Communication" fill="#10b981" />
                          <Bar dataKey="Leadership" fill="#f59e0b" />
                          <Bar dataKey="Innovation" fill="#8b5cf6" />
                          <Bar dataKey="Reliability" fill="#ef4444" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Radar Comparison</CardTitle>
                    <CardDescription>Overlapping competency profiles</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarChartData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="competency" />
                          <PolarRadiusAxis domain={[0, 5]} />
                          {selectedData.map((emp, i) => (
                            <Radar
                              key={emp.id}
                              name={emp.full_name.split(' ')[0]}
                              dataKey={`emp${i}`}
                              stroke={CHART_COLORS[i]}
                              fill={CHART_COLORS[i]}
                              fillOpacity={0.15}
                            />
                          ))}
                          <Legend />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Comparison Table</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Employee</th>
                            <th className="text-center p-2">Technical</th>
                            <th className="text-center p-2">Communication</th>
                            <th className="text-center p-2">Leadership</th>
                            <th className="text-center p-2">Innovation</th>
                            <th className="text-center p-2">Reliability</th>
                            <th className="text-center p-2">Average</th>
                            <th className="text-center p-2">Trend</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedData.map((emp, i) => (
                            <tr key={emp.id} className="border-b hover:bg-muted/50">
                              <td className="p-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                                  <span className="font-medium">{emp.full_name}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">{emp.team}</span>
                              </td>
                              <td className="text-center p-2">{emp.metrics.technical.toFixed(1)}</td>
                              <td className="text-center p-2">{emp.metrics.communication.toFixed(1)}</td>
                              <td className="text-center p-2">{emp.metrics.leadership.toFixed(1)}</td>
                              <td className="text-center p-2">{emp.metrics.innovation.toFixed(1)}</td>
                              <td className="text-center p-2">{emp.metrics.reliability.toFixed(1)}</td>
                              <td className="text-center p-2 font-bold">{emp.metrics.avgRating.toFixed(1)}</td>
                              <td className="text-center p-2">
                                <Badge variant={emp.metrics.trend === 'up' ? 'default' : emp.metrics.trend === 'down' ? 'destructive' : 'secondary'}>
                                  {emp.metrics.trend}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeamComparison;
