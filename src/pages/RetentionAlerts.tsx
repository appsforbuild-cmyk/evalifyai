import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  AlertTriangle, 
  TrendingDown, 
  Users, 
  ChevronRight, 
  Download,
  Plus,
  Calendar,
  Target,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface AttritionPrediction {
  id: string;
  employee_id: string;
  risk_score: number;
  risk_level: string;
  contributing_factors: Array<{
    factor: string;
    weight: number;
    trend: string;
    description: string;
  }>;
  predicted_timeframe: string;
  confidence: number;
  recommended_actions: Array<{
    action: string;
    priority: string;
    rationale: string;
  }>;
  last_calculated: string;
  employee?: {
    full_name: string;
    email: string;
    team: string;
  };
}

interface ActionPlan {
  id: string;
  employee_id: string;
  status: string;
  actions: Array<{
    id: string;
    action: string;
    owner: string;
    deadline: string;
    completed: boolean;
  }>;
  notes: string;
  impact_score_before: number;
  impact_score_after: number;
  created_at: string;
}

export default function RetentionAlerts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState<AttritionPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<AttritionPrediction | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionPlanOpen, setActionPlanOpen] = useState(false);
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [teams, setTeams] = useState<string[]>([]);
  const [riskHistory, setRiskHistory] = useState<any[]>([]);
  const [existingPlan, setExistingPlan] = useState<ActionPlan | null>(null);
  const [newActions, setNewActions] = useState<Array<{action: string; owner: string; deadline: string; completed: boolean}>>([]);

  useEffect(() => {
    fetchPredictions();
  }, [teamFilter]);

  const fetchPredictions = async () => {
    try {
      // Fetch predictions with employee info via separate query
      const { data: predictionsData, error } = await supabase
        .from('attrition_predictions')
        .select('*')
        .order('risk_score', { ascending: false });

      if (error) throw error;

      // Fetch employee profiles
      const employeeIds = predictionsData?.map(p => p.employee_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, team')
        .in('user_id', employeeIds);

      // Merge data
      const merged = predictionsData?.map(p => ({
        ...p,
        employee: profiles?.find(profile => profile.user_id === p.employee_id)
      })) || [];

      // Filter by team if needed
      const filtered = teamFilter === 'all' 
        ? merged 
        : merged.filter(p => p.employee?.team === teamFilter);

      setPredictions(filtered as unknown as AttritionPrediction[]);

      // Extract unique teams
      const uniqueTeams = [...new Set(profiles?.map(p => p.team).filter(Boolean))] as string[];
      setTeams(uniqueTeams);

      // Log view for audit
      if (user) {
        for (const prediction of filtered.slice(0, 10)) {
          await supabase.from('risk_view_audit').insert({
            viewer_id: user.id,
            employee_id: prediction.employee_id,
            action: 'view_list'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
      toast.error('Failed to load retention data');
    } finally {
      setLoading(false);
    }
  };

  const openEmployeeDetails = async (prediction: AttritionPrediction) => {
    setSelectedEmployee(prediction);
    setDetailsOpen(true);

    // Fetch risk history
    const { data: history } = await supabase
      .from('attrition_prediction_history')
      .select('risk_score, risk_level, recorded_at')
      .eq('employee_id', prediction.employee_id)
      .order('recorded_at', { ascending: true })
      .limit(30);

    setRiskHistory(history?.map(h => ({
      date: new Date(h.recorded_at).toLocaleDateString(),
      score: h.risk_score
    })) || []);

    // Log detailed view
    if (user) {
      await supabase.from('risk_view_audit').insert({
        viewer_id: user.id,
        employee_id: prediction.employee_id,
        action: 'view_details'
      });
    }
  };

  const openActionPlan = async (prediction: AttritionPrediction) => {
    setSelectedEmployee(prediction);
    
    // Check for existing plan
    const { data: existingPlans } = await supabase
      .from('retention_action_plans')
      .select('*')
      .eq('employee_id', prediction.employee_id)
      .eq('status', 'active')
      .single();

    if (existingPlans) {
      setExistingPlan(existingPlans as unknown as ActionPlan);
      setNewActions((existingPlans.actions as any[]) || []);
    } else {
      setExistingPlan(null);
      // Pre-populate with AI recommendations
      setNewActions((prediction.recommended_actions as any[]).map((rec: any, idx: number) => ({
        action: rec.action,
        owner: 'Manager',
        deadline: new Date(Date.now() + (idx + 1) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        completed: false
      })));
    }
    
    setActionPlanOpen(true);
  };

  const saveActionPlan = async () => {
    if (!selectedEmployee || !user) return;

    try {
      const planData = {
        employee_id: selectedEmployee.employee_id,
        created_by: user.id,
        status: 'active',
        actions: newActions,
        impact_score_before: selectedEmployee.risk_score,
      };

      if (existingPlan) {
        await supabase
          .from('retention_action_plans')
          .update({ actions: newActions, updated_at: new Date().toISOString() })
          .eq('id', existingPlan.id);
      } else {
        await supabase
          .from('retention_action_plans')
          .insert(planData);
      }

      toast.success('Action plan saved successfully');
      setActionPlanOpen(false);
    } catch (error) {
      console.error('Error saving action plan:', error);
      toast.error('Failed to save action plan');
    }
  };

  const exportToCSV = () => {
    const csv = [
      ['Employee', 'Email', 'Team', 'Risk Score', 'Risk Level', 'Timeframe', 'Contributing Factors'],
      ...predictions.map(p => [
        p.employee?.full_name || 'Unknown',
        p.employee?.email || '',
        p.employee?.team || '',
        p.risk_score.toString(),
        p.risk_level,
        p.predicted_timeframe,
        p.contributing_factors.map(f => f.factor).join('; ')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `retention-alerts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getRiskBadge = (level: string) => {
    const styles: Record<string, string> = {
      critical: 'bg-destructive text-destructive-foreground',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-black',
      low: 'bg-green-500 text-white'
    };
    return <Badge className={styles[level] || styles.low}>{level.toUpperCase()}</Badge>;
  };

  const groupedPredictions = {
    critical: predictions.filter(p => p.risk_level === 'critical'),
    high: predictions.filter(p => p.risk_level === 'high'),
    medium: predictions.filter(p => p.risk_level === 'medium'),
    low: predictions.filter(p => p.risk_level === 'low'),
  };

  const QuadrantCard = ({ title, icon: Icon, predictions, color }: { title: string; icon: any; predictions: AttritionPrediction[]; color: string }) => (
    <Card className={`border-l-4 ${color}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
          <Badge variant="secondary" className="ml-auto">{predictions.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-64 overflow-y-auto">
        {predictions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No employees in this category</p>
        ) : (
          predictions.slice(0, 5).map(p => (
            <div 
              key={p.id} 
              className="flex items-center justify-between p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
              onClick={() => openEmployeeDetails(p)}
            >
              <div>
                <p className="font-medium text-sm">{p.employee?.full_name || 'Unknown'}</p>
                <p className="text-xs text-muted-foreground">{p.employee?.team}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{p.risk_score}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))
        )}
        {predictions.length > 5 && (
          <p className="text-xs text-muted-foreground text-center">+{predictions.length - 5} more</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Retention Alerts</h1>
            <p className="text-muted-foreground">Identify and support at-risk employees</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map(team => (
                  <SelectItem key={team} value={team}>{team}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-destructive/10">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{groupedPredictions.critical.length}</p>
                  <p className="text-sm text-muted-foreground">Critical Risk</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-orange-500/10">
                  <AlertTriangle className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{groupedPredictions.high.length}</p>
                  <p className="text-sm text-muted-foreground">High Risk</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-yellow-500/10">
                  <TrendingDown className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{groupedPredictions.medium.length}</p>
                  <p className="text-sm text-muted-foreground">Medium Risk</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/10">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{groupedPredictions.low.length}</p>
                  <p className="text-sm text-muted-foreground">Low Risk</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk Quadrants */}
        <div className="grid grid-cols-2 gap-4">
          <QuadrantCard 
            title="Critical Risk (80-100)" 
            icon={AlertCircle} 
            predictions={groupedPredictions.critical}
            color="border-l-destructive"
          />
          <QuadrantCard 
            title="High Risk (60-79)" 
            icon={AlertTriangle} 
            predictions={groupedPredictions.high}
            color="border-l-orange-500"
          />
          <QuadrantCard 
            title="Medium Risk (40-59)" 
            icon={TrendingDown} 
            predictions={groupedPredictions.medium}
            color="border-l-yellow-500"
          />
          <QuadrantCard 
            title="Low Risk (0-39)" 
            icon={Users} 
            predictions={groupedPredictions.low}
            color="border-l-green-500"
          />
        </div>

        {/* Employee Details Modal */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {selectedEmployee?.employee?.full_name || 'Employee Details'}
                {selectedEmployee && getRiskBadge(selectedEmployee.risk_level)}
              </DialogTitle>
              <DialogDescription>
                {selectedEmployee?.employee?.team} • {selectedEmployee?.employee?.email}
              </DialogDescription>
            </DialogHeader>

            {selectedEmployee && (
              <div className="space-y-6">
                {/* Risk Score Gauge */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-4xl font-bold">{selectedEmployee.risk_score}</p>
                        <p className="text-muted-foreground">Risk Score</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{selectedEmployee.predicted_timeframe}</p>
                        <p className="text-sm text-muted-foreground">Predicted Timeframe</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{selectedEmployee.confidence}%</p>
                        <p className="text-sm text-muted-foreground">Confidence</p>
                      </div>
                    </div>
                    <Progress value={selectedEmployee.risk_score} className="h-3" />
                  </CardContent>
                </Card>

                <Tabs defaultValue="factors">
                  <TabsList>
                    <TabsTrigger value="factors">Contributing Factors</TabsTrigger>
                    <TabsTrigger value="trend">Risk Trend</TabsTrigger>
                    <TabsTrigger value="actions">Recommended Actions</TabsTrigger>
                  </TabsList>

                  <TabsContent value="factors" className="mt-4">
                    <Card>
                      <CardContent className="pt-6">
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={selectedEmployee.contributing_factors} layout="vertical">
                            <XAxis type="number" domain={[0, 100]} />
                            <YAxis dataKey="factor" type="category" width={150} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="weight" fill="hsl(var(--primary))" radius={4} />
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="mt-4 space-y-2">
                          {selectedEmployee.contributing_factors.map((factor, idx) => (
                            <div key={idx} className="flex items-start gap-2 p-2 rounded bg-muted/50">
                              <Badge variant={factor.trend === 'declining' ? 'destructive' : factor.trend === 'improving' ? 'default' : 'secondary'}>
                                {factor.trend}
                              </Badge>
                              <p className="text-sm">{factor.description}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="trend" className="mt-4">
                    <Card>
                      <CardContent className="pt-6">
                        {riskHistory.length > 0 ? (
                          <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={riskHistory}>
                              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                              <YAxis domain={[0, 100]} />
                              <Tooltip />
                              <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-center text-muted-foreground py-8">No historical data available</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="actions" className="mt-4">
                    <Card>
                      <CardContent className="pt-6 space-y-3">
                        {selectedEmployee.recommended_actions.map((action, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 rounded border">
                            <Badge variant={action.priority === 'high' ? 'destructive' : action.priority === 'medium' ? 'secondary' : 'outline'}>
                              {action.priority}
                            </Badge>
                            <div>
                              <p className="font-medium">{action.action}</p>
                              <p className="text-sm text-muted-foreground">{action.rationale}</p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                <Button className="w-full" onClick={() => { setDetailsOpen(false); openActionPlan(selectedEmployee); }}>
                  <Target className="h-4 w-4 mr-2" />
                  Create Action Plan
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Action Plan Modal */}
        <Dialog open={actionPlanOpen} onOpenChange={setActionPlanOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {existingPlan ? 'Edit' : 'Create'} Retention Action Plan
              </DialogTitle>
              <DialogDescription>
                For {selectedEmployee?.employee?.full_name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {newActions.map((action, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-1">
                    <Checkbox 
                      checked={action.completed}
                      onCheckedChange={(checked) => {
                        const updated = [...newActions];
                        updated[idx].completed = !!checked;
                        setNewActions(updated);
                      }}
                    />
                  </div>
                  <Input 
                    className="col-span-5"
                    value={action.action}
                    onChange={(e) => {
                      const updated = [...newActions];
                      updated[idx].action = e.target.value;
                      setNewActions(updated);
                    }}
                    placeholder="Action item"
                  />
                  <Input 
                    className="col-span-3"
                    value={action.owner}
                    onChange={(e) => {
                      const updated = [...newActions];
                      updated[idx].owner = e.target.value;
                      setNewActions(updated);
                    }}
                    placeholder="Owner"
                  />
                  <Input 
                    className="col-span-3"
                    type="date"
                    value={action.deadline}
                    onChange={(e) => {
                      const updated = [...newActions];
                      updated[idx].deadline = e.target.value;
                      setNewActions(updated);
                    }}
                  />
                </div>
              ))}

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setNewActions([...newActions, { action: '', owner: 'Manager', deadline: '', completed: false }])}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Action
              </Button>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setActionPlanOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={saveActionPlan}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Save Plan
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
