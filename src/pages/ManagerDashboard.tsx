import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Mic, FileText, Clock, CheckCircle } from 'lucide-react';
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

const ManagerDashboard = () => {
  const [sessions, setSessions] = useState<VoiceSession[]>([]);
  const [employees, setEmployees] = useState<{ id: string; full_name: string; email: string }[]>([]);
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
      .from('profiles')
      .select('user_id, full_name, email');

    if (!error && data) {
      setEmployees(data.map(p => ({ id: p.user_id, full_name: p.full_name || '', email: p.email || '' })));
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">Manager Dashboard</h1>
            <p className="text-muted-foreground">Manage your voice feedback sessions</p>
          </div>
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
      </div>
    </DashboardLayout>
  );
};

export default ManagerDashboard;
