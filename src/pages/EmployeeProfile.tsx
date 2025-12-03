import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, User, Mail, Building2, Briefcase, Calendar, FileText, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';

interface Employee {
  id: string;
  email: string;
  full_name: string;
  team: string;
  org_unit: string | null;
  created_at: string;
}

interface FeedbackSession {
  id: string;
  title: string;
  status: string;
  created_at: string;
  feedback_entries: {
    final_feedback: string | null;
    ai_draft: string | null;
    is_published: boolean;
    published_at: string | null;
  }[];
}

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchEmployee();
      fetchFeedbackHistory();
    }
  }, [id]);

  const fetchEmployee = async () => {
    const { data, error } = await supabase
      .from('employees_directory')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!error && data) {
      setEmployee(data);
    }
    setLoading(false);
  };

  const fetchFeedbackHistory = async () => {
    // For demo purposes, we'll show placeholder data since employees_directory
    // employees aren't linked to real voice_sessions
    // In production, you'd join on employee_id
    setFeedbackHistory([]);
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
      'Operations': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      'Customer Support': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      'Data Science': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'Legal': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      'IT Support': 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
      'Administration': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    };
    return colors[team] || 'bg-muted text-muted-foreground';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Loading employee profile...</div>
      </DashboardLayout>
    );
  }

  if (!employee) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Employee not found</h2>
          <Button onClick={() => navigate('/employees')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate('/employees')} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </Button>

        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                <User className="w-12 h-12 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-primary mb-2">{employee.full_name}</h1>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={getTeamColor(employee.team)} variant="secondary">
                    {employee.team}
                  </Badge>
                  {employee.org_unit && (
                    <Badge variant="outline">{employee.org_unit}</Badge>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{employee.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="w-4 h-4" />
                    <span>{employee.team}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="w-4 h-4" />
                    <span>{employee.org_unit || 'Not assigned'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Added {new Date(employee.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="feedback">Feedback History</TabsTrigger>
            <TabsTrigger value="growth">Growth Path</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Total Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">0</div>
                  <p className="text-sm text-muted-foreground">Sessions received</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Performance Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">—</div>
                  <p className="text-sm text-muted-foreground">No data yet</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Last Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">—</div>
                  <p className="text-sm text-muted-foreground">No feedback yet</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Employee performance summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No feedback data available yet.</p>
                  <p className="text-sm mt-2">Create a feedback session for this employee to see stats.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Feedback History</CardTitle>
                <CardDescription>All feedback sessions for this employee</CardDescription>
              </CardHeader>
              <CardContent>
                {feedbackHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No feedback history available.</p>
                    <p className="text-sm mt-2">Feedback sessions will appear here once created.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {feedbackHistory.map((session) => (
                      <div key={session.id} className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{session.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(session.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={session.status === 'published' ? 'default' : 'secondary'}>
                            {session.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="growth" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Growth Path</CardTitle>
                <CardDescription>Career development roadmap based on feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No growth path data available.</p>
                  <p className="text-sm mt-2">Growth recommendations will appear after feedback sessions.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeProfile;
