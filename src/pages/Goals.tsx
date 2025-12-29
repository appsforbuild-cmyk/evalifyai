import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Target, CheckCircle, Clock, XCircle, Pause, Edit2, Trash2, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import { goalSchema } from '@/lib/validations';

interface Goal {
  id: string;
  profile_id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  due_date: string | null;
  category: string;
  created_at: string;
  updated_at: string;
}

const Goals = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    due_date: '',
    status: 'active',
    progress: 0,
  });

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('profile_id', user?.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setGoals(data as Goal[]);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'general',
      due_date: '',
      status: 'active',
      progress: 0,
    });
    setEditingGoal(null);
    setFormErrors({});
  };

  const openEditDialog = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      category: goal.category,
      due_date: goal.due_date || '',
      status: goal.status,
      progress: goal.progress,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    setFormErrors({});
    
    // Validate with Zod
    const result = goalSchema.safeParse({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      due_date: formData.due_date,
      status: formData.status,
      progress: formData.progress,
    });
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setFormErrors(fieldErrors);
      toast.error('Please fix the validation errors');
      return;
    }

    if (editingGoal) {
      // Update existing goal
      const { error } = await supabase
        .from('goals')
        .update({
          title: formData.title,
          description: formData.description || null,
          category: formData.category,
          due_date: formData.due_date || null,
          status: formData.status,
          progress: formData.progress,
        })
        .eq('id', editingGoal.id);

      if (error) {
        toast.error('Failed to update goal');
      } else {
        toast.success('Goal updated successfully');
        setDialogOpen(false);
        resetForm();
        fetchGoals();
      }
    } else {
      // Create new goal
      const { error } = await supabase
        .from('goals')
        .insert({
          profile_id: user?.id,
          title: formData.title,
          description: formData.description || null,
          category: formData.category,
          due_date: formData.due_date || null,
          status: formData.status,
          progress: formData.progress,
        });

      if (error) {
        toast.error('Failed to create goal');
      } else {
        toast.success('Goal created successfully');
        setDialogOpen(false);
        resetForm();
        fetchGoals();
      }
    }
  };

  const deleteGoal = async (goalId: string) => {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId);

    if (error) {
      toast.error('Failed to delete goal');
    } else {
      toast.success('Goal deleted');
      fetchGoals();
    }
  };

  const updateProgress = async (goalId: string, progress: number) => {
    const newStatus = progress === 100 ? 'completed' : 'active';
    
    const { error } = await supabase
      .from('goals')
      .update({ progress, status: newStatus })
      .eq('id', goalId);

    if (error) {
      toast.error('Failed to update progress');
    } else {
      fetchGoals();
      if (progress === 100) {
        toast.success('Goal completed! 🎉');
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'on-hold': return <Pause className="w-4 h-4 text-amber-600" />;
      default: return <Clock className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'on-hold': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    };
    return styles[status] || styles.active;
  };

  const filterGoals = (status: string) => {
    if (status === 'all') return goals;
    return goals.filter(g => g.status === status);
  };

  const stats = {
    total: goals.length,
    active: goals.filter(g => g.status === 'active').length,
    completed: goals.filter(g => g.status === 'completed').length,
    avgProgress: goals.length > 0 ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length) : 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-primary">Goals & OKRs</h1>
              <p className="text-muted-foreground">Track your objectives and key results</p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> New Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    placeholder="e.g., Complete leadership certification"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    maxLength={200}
                    className={formErrors.title ? 'border-destructive' : ''}
                  />
                  {formErrors.title && (
                    <p className="text-sm text-destructive">{formErrors.title}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe your goal..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    maxLength={2000}
                    className={formErrors.description ? 'border-destructive' : ''}
                  />
                  {formErrors.description && (
                    <p className="text-sm text-destructive">{formErrors.description}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select
                      className="w-full px-3 py-2 border rounded-md bg-background"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="general">General</option>
                      <option value="technical">Technical</option>
                      <option value="leadership">Leadership</option>
                      <option value="communication">Communication</option>
                      <option value="project">Project</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>
                </div>
                {editingGoal && (
                  <>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <select
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="on-hold">On Hold</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Progress: {formData.progress}%</Label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.progress}
                        onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </>
                )}
                <Button onClick={handleSubmit} className="w-full">
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total Goals</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
              <p className="text-sm text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.avgProgress}%</div>
              <p className="text-sm text-muted-foreground">Avg Progress</p>
            </CardContent>
          </Card>
        </div>

        {/* Goals List */}
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({goals.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
          </TabsList>

          {['all', 'active', 'completed'].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {loading ? (
                <div className="text-center py-12">Loading goals...</div>
              ) : filterGoals(tab).length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first goal to start tracking</p>
                    <Button onClick={() => setDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" /> Create Goal
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {filterGoals(tab).map((goal) => (
                    <Card key={goal.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getStatusIcon(goal.status)}
                              <CardTitle className="text-lg">{goal.title}</CardTitle>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusBadge(goal.status)}>{goal.status}</Badge>
                              <Badge variant="outline">{goal.category}</Badge>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(goal)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteGoal(goal.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {goal.description && (
                          <p className="text-sm text-muted-foreground">{goal.description}</p>
                        )}
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span className="font-medium">{goal.progress}%</span>
                          </div>
                          <Progress value={goal.progress} className="h-2" />
                        </div>
                        {goal.status === 'active' && (
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => updateProgress(goal.id, Math.min(goal.progress + 10, 100))}
                            >
                              +10%
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => updateProgress(goal.id, 100)}
                            >
                              Complete
                            </Button>
                          </div>
                        )}
                        {goal.due_date && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            Due: {new Date(goal.due_date).toLocaleDateString()}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Goals;