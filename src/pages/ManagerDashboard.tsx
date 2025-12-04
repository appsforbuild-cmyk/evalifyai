import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Plus, Mic, FileText, Clock, CheckCircle, Users, TrendingUp, Star, BarChart3, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';

interface VoiceSession {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  employee_id: string;
  profiles?: { full_name: string | null; email: string | null };
}

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  team: string;
  org_unit: string | null;
}

const ManagerDashboard = () => {
  const [sessions, setSessions] = useState<VoiceSession[]>([]);
  const [employees, setEmployees] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSession, setNewSession] = useState({ title: '', description: '', employeeId: '' });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchSessions();
      fetchEmployees();
    }
  }, [user]);

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from('voice_sessions')
      .select('*')
      .eq('manager_id', user?.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSessions(data);
    }
    setLoading(false);
  };

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('employees_directory')
      .select('id, full_name, email, team, org_unit')
      .order('full_name');

    if (!error && data) {
      setEmployees(data);
    }
  };

  const createSession = async () => {
    if (!newSession.title || !newSession.employeeId) {
      toast.error('Please fill in all required fields');
      return;
    }

    const { data, error } = await supabase
      .from('voice_sessions')
      .insert({
        manager_id: user?.id,
        employee_id: newSession.employeeId,
        title: newSession.title,
        description: newSession.description,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create session');
    } else {
      toast.success('Session created!');
      setDialogOpen(false);
      setNewSession({ title: '', description: '', employeeId: '' });
      navigate(`/session/${data.id}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: React.ReactNode }> = {
      pending: { color: 'bg-muted text-muted-foreground', icon: <Clock className="w-3 h-3" /> },
      recording: { color: 'bg-red-100 text-red-700', icon: <Mic className="w-3 h-3" /> },
      processing: { color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-3 h-3" /> },
      draft: { color: 'bg-blue-100 text-blue-700', icon: <FileText className="w-3 h-3" /> },
      published: { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
    };
    const v = variants[status] || variants.pending;
    return (
      <Badge className={`${v.color} flex items-center gap-1`}>
        {v.icon} {status}
      </Badge>
    );
  };

  // Generate mock performance data for team members
  const getTeamMemberStats = (employee: TeamMember) => {
    // Generate consistent mock data based on employee id hash
    const hash = employee.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return {
      avgRating: (3 + (hash % 20) / 10).toFixed(1),
      feedbackCount: 2 + (hash % 4),
      lastFeedback: new Date(Date.now() - (hash % 90) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      growthTrend: hash % 2 === 0 ? 'up' : 'stable',
      topSkill: ['Technical Skills', 'Communication', 'Leadership', 'Innovation', 'Reliability'][hash % 5],
    };
  };

  const getTeamColor = (team: string) => {
    const colors: Record<string, string> = {
      'Engineering': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Product': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Design': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'Marketing': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Sales': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Finance': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Human Resources': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[team] || 'bg-muted text-muted-foreground';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">Manager Dashboard</h1>
            <p className="text-muted-foreground">Manage feedback sessions and track team performance</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/team-comparison')} className="gap-2">
              <BarChart3 className="w-4 h-4" /> Team Comparison
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" /> New Session
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Feedback Session</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Session Title</Label>
                    <Input
                      placeholder="Q4 Performance Review"
                      value={newSession.title}
                      onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Employee</Label>
                    <select
                      className="w-full px-3 py-2 border rounded-md"
                      value={newSession.employeeId}
                      onChange={(e) => setNewSession({ ...newSession, employeeId: e.target.value })}
                    >
                      <option value="">Select employee...</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.full_name || emp.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description (optional)</Label>
                    <Textarea
                      placeholder="Notes about this feedback session..."
                      value={newSession.description}
                      onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                    />
                  </div>
                  <Button onClick={createSession} className="w-full">
                    Create & Start Recording
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="sessions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sessions" className="gap-2">
              <Mic className="w-4 h-4" /> Feedback Sessions
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="w-4 h-4" /> Team Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sessions">
            {loading ? (
              <div className="text-center py-12">Loading sessions...</div>
            ) : sessions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Mic className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No sessions yet</h3>
                  <p className="text-muted-foreground mb-4">Start your first voice feedback session</p>
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Create Session
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {sessions.map((session) => (
                  <Card key={session.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
                    if (session.status === 'draft') {
                      navigate(`/feedback/${session.id}`);
                    } else {
                      navigate(`/session/${session.id}`);
                    }
                  }}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{session.title}</CardTitle>
                          <CardDescription>{session.description}</CardDescription>
                        </div>
                        {getStatusBadge(session.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(session.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" /> Team Size
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{employees.length}</div>
                  <p className="text-sm text-muted-foreground">Total members</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{sessions.length}</div>
                  <p className="text-sm text-muted-foreground">Total feedback sessions</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Published
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{sessions.filter(s => s.status === 'published').length}</div>
                  <p className="text-sm text-muted-foreground">Published feedback</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Star className="w-4 h-4" /> Avg Rating
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">4.2</div>
                  <p className="text-sm text-muted-foreground">Team average</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Click on a team member to view their detailed dashboard</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {employees.slice(0, 12).map((employee) => {
                    const stats = getTeamMemberStats(employee);
                    return (
                      <Card 
                        key={employee.id} 
                        className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50"
                        onClick={() => navigate(`/employee/${employee.id}`)}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold truncate">{employee.full_name}</h4>
                              <p className="text-sm text-muted-foreground truncate">{employee.email}</p>
                              <Badge className={`${getTeamColor(employee.team)} mt-1`} variant="secondary">
                                {employee.team}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                            <div>
                              <p className="text-lg font-bold text-green-600">{stats.avgRating}</p>
                              <p className="text-xs text-muted-foreground">Rating</p>
                            </div>
                            <div>
                              <p className="text-lg font-bold">{stats.feedbackCount}</p>
                              <p className="text-xs text-muted-foreground">Reviews</p>
                            </div>
                            <div>
                              <TrendingUp className={`w-5 h-5 mx-auto ${stats.growthTrend === 'up' ? 'text-green-600' : 'text-muted-foreground'}`} />
                              <p className="text-xs text-muted-foreground capitalize">{stats.growthTrend}</p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <p className="text-xs text-muted-foreground mb-1">Top Competency</p>
                            <Progress value={80} className="h-1.5" />
                            <p className="text-xs mt-1">{stats.topSkill}</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                {employees.length > 12 && (
                  <div className="text-center mt-6">
                    <Button variant="outline" onClick={() => navigate('/employees')}>
                      View All {employees.length} Team Members
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ManagerDashboard;