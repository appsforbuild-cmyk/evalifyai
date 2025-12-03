import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Users, MessageSquare, Plus, Edit, Trash2, GripVertical, Shield, UserCog } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';

type AppRole = 'manager' | 'employee' | 'hr' | 'admin';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  roles: AppRole[];
}

interface FeedbackQuestion {
  id: string;
  question_text: string;
  category: string;
  display_order: number;
  is_active: boolean;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [questions, setQuestions] = useState<FeedbackQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<FeedbackQuestion | null>(null);
  const [newQuestion, setNewQuestion] = useState({ question_text: '', category: 'general' });
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>('employee');

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) return;

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const hasAdmin = roles?.some(r => r.role === 'admin');
    setIsAdmin(hasAdmin || false);

    if (hasAdmin) {
      await Promise.all([fetchUsers(), fetchQuestions()]);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    // Fetch all profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, email, full_name');

    // Fetch all roles
    const { data: allRoles } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (profiles) {
      const usersWithRoles = profiles.map(profile => ({
        id: profile.user_id,
        email: profile.email || '',
        full_name: profile.full_name || '',
        roles: allRoles?.filter(r => r.user_id === profile.user_id).map(r => r.role as AppRole) || []
      }));
      setUsers(usersWithRoles);
    }
  };

  const fetchQuestions = async () => {
    const { data } = await supabase
      .from('feedback_questions')
      .select('*')
      .order('display_order', { ascending: true });

    if (data) {
      setQuestions(data);
    }
  };

  const handleAddRole = async () => {
    if (!selectedUser) return;

    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: selectedUser.id, role: selectedRole });

    if (error) {
      if (error.code === '23505') {
        toast.error('User already has this role');
      } else {
        toast.error('Failed to add role');
      }
    } else {
      toast.success('Role added successfully');
      fetchUsers();
      setRoleDialogOpen(false);
    }
  };

  const handleRemoveRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role);

    if (error) {
      toast.error('Failed to remove role');
    } else {
      toast.success('Role removed');
      fetchUsers();
    }
  };

  const handleSaveQuestion = async () => {
    if (editingQuestion) {
      // Update existing
      const { error } = await supabase
        .from('feedback_questions')
        .update({
          question_text: editingQuestion.question_text,
          category: editingQuestion.category,
          is_active: editingQuestion.is_active
        })
        .eq('id', editingQuestion.id);

      if (error) {
        toast.error('Failed to update question');
      } else {
        toast.success('Question updated');
        fetchQuestions();
        setEditingQuestion(null);
        setQuestionDialogOpen(false);
      }
    } else {
      // Create new
      const maxOrder = Math.max(...questions.map(q => q.display_order), 0);
      const { error } = await supabase
        .from('feedback_questions')
        .insert({
          question_text: newQuestion.question_text,
          category: newQuestion.category,
          display_order: maxOrder + 1
        });

      if (error) {
        toast.error('Failed to create question');
      } else {
        toast.success('Question created');
        fetchQuestions();
        setNewQuestion({ question_text: '', category: 'general' });
        setQuestionDialogOpen(false);
      }
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    const { error } = await supabase
      .from('feedback_questions')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete question');
    } else {
      toast.success('Question deleted');
      fetchQuestions();
    }
  };

  const handleToggleQuestion = async (question: FeedbackQuestion) => {
    const { error } = await supabase
      .from('feedback_questions')
      .update({ is_active: !question.is_active })
      .eq('id', question.id);

    if (error) {
      toast.error('Failed to update question');
    } else {
      fetchQuestions();
    }
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'hr': return 'default';
      case 'manager': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <Card className="max-w-md mx-auto mt-20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Shield className="w-5 h-5" /> Access Denied
            </CardTitle>
            <CardDescription>
              You don't have admin privileges to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground">Manage users, roles, and feedback configuration</p>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" /> User Management
            </TabsTrigger>
            <TabsTrigger value="questions" className="gap-2">
              <MessageSquare className="w-4 h-4" /> Feedback Questions
            </TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Users & Roles</CardTitle>
                <CardDescription>
                  Manage user roles and permissions. Users can have multiple roles.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(u => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.full_name || 'No name'}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {u.roles.length === 0 ? (
                              <span className="text-muted-foreground text-sm">No roles</span>
                            ) : (
                              u.roles.map(role => (
                                <Badge 
                                  key={role} 
                                  variant={getRoleBadgeVariant(role)}
                                  className="cursor-pointer"
                                  onClick={() => {
                                    if (confirm(`Remove ${role} role from ${u.full_name}?`)) {
                                      handleRemoveRole(u.id, role);
                                    }
                                  }}
                                >
                                  {role} ×
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(u);
                              setRoleDialogOpen(true);
                            }}
                          >
                            <UserCog className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Questions Tab */}
          <TabsContent value="questions">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Feedback Questions</CardTitle>
                  <CardDescription>
                    Configure the OKR/KRA questions managers address during voice feedback.
                  </CardDescription>
                </div>
                <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingQuestion(null)}>
                      <Plus className="w-4 h-4 mr-2" /> Add Question
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingQuestion ? 'Edit Question' : 'Add New Question'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Question Text</Label>
                        <Textarea
                          placeholder="Enter the question managers should address..."
                          value={editingQuestion?.question_text || newQuestion.question_text}
                          onChange={(e) => {
                            if (editingQuestion) {
                              setEditingQuestion({ ...editingQuestion, question_text: e.target.value });
                            } else {
                              setNewQuestion({ ...newQuestion, question_text: e.target.value });
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={editingQuestion?.category || newQuestion.category}
                          onValueChange={(v) => {
                            if (editingQuestion) {
                              setEditingQuestion({ ...editingQuestion, category: v });
                            } else {
                              setNewQuestion({ ...newQuestion, category: v });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OKR Achievement">OKR Achievement</SelectItem>
                            <SelectItem value="KRA Performance">KRA Performance</SelectItem>
                            <SelectItem value="Collaboration">Collaboration</SelectItem>
                            <SelectItem value="Growth & Development">Growth & Development</SelectItem>
                            <SelectItem value="Areas for Improvement">Areas for Improvement</SelectItem>
                            <SelectItem value="general">General</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setQuestionDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveQuestion}>
                        {editingQuestion ? 'Update' : 'Create'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {questions.map((q, index) => (
                    <div
                      key={q.id}
                      className={`flex items-start gap-3 p-4 rounded-lg border ${
                        q.is_active ? 'bg-background' : 'bg-muted/50 opacity-60'
                      }`}
                    >
                      <GripVertical className="w-5 h-5 text-muted-foreground mt-1 cursor-grab" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {index + 1}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {q.category}
                          </Badge>
                        </div>
                        <p className="text-sm">{q.question_text}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={q.is_active}
                          onCheckedChange={() => handleToggleQuestion(q)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingQuestion(q);
                            setQuestionDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Delete this question?')) {
                              handleDeleteQuestion(q.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {questions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No questions configured yet. Add your first feedback question.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Role Assignment Dialog */}
        <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Role to {selectedUser?.full_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Role</Label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">
                Current roles: {selectedUser?.roles.join(', ') || 'None'}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddRole}>Add Role</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;