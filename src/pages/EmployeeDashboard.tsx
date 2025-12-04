import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, TrendingUp, Calendar, Star, Target, BookOpen, Check, User, BarChart3, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface FeedbackItem {
  id: string;
  session_id: string;
  final_feedback: string;
  competency_tags: string[];
  published_at: string;
  voice_sessions: {
    title: string;
    description: string;
  };
}

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedMilestones, setCompletedMilestones] = useState<string[]>([]);
  const [loadingMilestones, setLoadingMilestones] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFeedbacks();
      fetchCompletedMilestones();
    }
  }, [user]);

  const fetchFeedbacks = async () => {
    const { data, error } = await supabase
      .from('feedback_entries')
      .select(`
        id,
        session_id,
        final_feedback,
        competency_tags,
        published_at,
        voice_sessions!inner (
          title,
          description,
          employee_id
        )
      `)
      .eq('is_published', true)
      .eq('voice_sessions.employee_id', user?.id)
      .order('published_at', { ascending: false });

    if (!error && data) {
      setFeedbacks(data as any);
    }
    setLoading(false);
  };

  const fetchCompletedMilestones = async () => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from('milestone_completions')
      .select('milestone_key')
      .eq('employee_id', user.id);

    if (!error && data) {
      setCompletedMilestones(data.map(m => m.milestone_key));
    }
    setLoadingMilestones(false);
  };

  const toggleMilestoneComplete = async (milestoneKey: string) => {
    if (!user?.id) return;

    const isCurrentlyCompleted = completedMilestones.includes(milestoneKey);
    
    if (isCurrentlyCompleted) {
      // Remove milestone
      const { error } = await supabase
        .from('milestone_completions')
        .delete()
        .eq('employee_id', user.id)
        .eq('milestone_key', milestoneKey);

      if (!error) {
        setCompletedMilestones(prev => prev.filter(m => m !== milestoneKey));
        toast.success('Milestone unmarked');
      } else {
        toast.error('Failed to update milestone');
      }
    } else {
      // Add milestone
      const { error } = await supabase
        .from('milestone_completions')
        .insert({
          user_id: user.id,
          employee_id: user.id,
          milestone_key: milestoneKey,
        });

      if (!error) {
        setCompletedMilestones(prev => [...prev, milestoneKey]);
        toast.success('Milestone marked as completed!');
      } else {
        toast.error('Failed to update milestone');
      }
    }
  };

  // Growth areas based on common competencies
  const growthAreas = [
    { skill: 'Communication', progress: 75 },
    { skill: 'Leadership', progress: 60 },
    { skill: 'Technical Skills', progress: 85 },
    { skill: 'Collaboration', progress: 70 },
    { skill: 'Innovation', progress: 65 },
  ];

  // Growth path milestones
  const milestones = [
    { quarter: 'Q1 2025', goal: 'Complete advanced certification', status: 'in-progress' },
    { quarter: 'Q2 2025', goal: 'Lead first project independently', status: 'upcoming' },
    { quarter: 'Q3 2025', goal: 'Present at company tech talk', status: 'upcoming' },
    { quarter: 'Q4 2025', goal: 'Promotion readiness review', status: 'upcoming' },
  ];

  // Learning recommendations
  const learningRecommendations = [
    { topic: 'Public Speaking', priority: 'Medium', timeframe: '3 months', resource: 'Toastmasters or internal workshops' },
    { topic: 'System Design', priority: 'High', timeframe: '6 months', resource: 'Advanced architecture course' },
    { topic: 'Leadership Development', priority: 'High', timeframe: '6 months', resource: 'Internal leadership program' },
  ];

  // Mock trend data for charts
  const trendData = [
    { period: 'Dec \'23', avgRating: 3.5, technical: 3.0, communication: 3.0, leadership: 2.5 },
    { period: 'Mar \'24', avgRating: 3.6, technical: 3.5, communication: 3.5, leadership: 3.0 },
    { period: 'Jun \'24', avgRating: 3.9, technical: 4.0, communication: 4.5, leadership: 4.0 },
    { period: 'Sep \'24', avgRating: 4.2, technical: 4.5, communication: 4.0, leadership: 3.5 },
  ];

  const radarData = growthAreas.map(area => ({
    competency: area.skill,
    current: area.progress / 20,
    target: 4.5,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-primary">My Dashboard</h1>
            <p className="text-muted-foreground">Track your performance, feedback, and growth journey</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/quick-feedback')} className="gap-2">
              <MessageSquare className="w-4 h-4" /> Quick Feedback
            </Button>
            <Button variant="outline" onClick={() => navigate('/goals')} className="gap-2">
              <Target className="w-4 h-4" /> My Goals
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Performance Trends</TabsTrigger>
            <TabsTrigger value="feedback">Feedback History</TabsTrigger>
            <TabsTrigger value="growth">Growth Path</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Total Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{feedbacks.length || 4}</div>
                  <p className="text-sm text-muted-foreground">Sessions received</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Star className="w-4 h-4" /> Avg. Rating
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">4.2</div>
                  <p className="text-sm text-muted-foreground">Out of 5.0</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="w-4 h-4" /> Milestones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{completedMilestones.length}/{milestones.length}</div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">+0.7</div>
                  <p className="text-sm text-muted-foreground">This year</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Growth Roadmap */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" /> Skill Progress
                  </CardTitle>
                  <CardDescription>Your development progress</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {growthAreas.map((area) => (
                    <div key={area.skill} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{area.skill}</span>
                        <span className="text-muted-foreground">{area.progress}%</span>
                      </div>
                      <Progress value={area.progress} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Radar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" /> Competency Overview
                  </CardTitle>
                  <CardDescription>Current vs Target performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="competency" className="text-xs" />
                        <PolarRadiusAxis domain={[0, 5]} />
                        <Radar 
                          name="Current" 
                          dataKey="current" 
                          stroke="hsl(var(--primary))" 
                          fill="hsl(var(--primary))" 
                          fillOpacity={0.3} 
                        />
                        <Radar 
                          name="Target" 
                          dataKey="target" 
                          stroke="hsl(var(--muted-foreground))" 
                          fill="hsl(var(--muted-foreground))" 
                          fillOpacity={0.1} 
                        />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" /> Rating Trend
                </CardTitle>
                <CardDescription>Your performance progression over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="period" className="text-xs" />
                      <YAxis domain={[0, 5]} className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="avgRating" 
                        name="Overall"
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                      <Line type="monotone" dataKey="technical" name="Technical" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="communication" name="Communication" stroke="#10b981" strokeWidth={2} />
                      <Line type="monotone" dataKey="leadership" name="Leadership" stroke="#f59e0b" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-5 gap-4">
              {growthAreas.map((area) => (
                <Card key={area.skill}>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground mb-1">{area.skill}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{(area.progress / 20).toFixed(1)}</span>
                      <span className="text-sm text-green-600">+0.5</span>
                    </div>
                    <Progress value={area.progress} className="h-1.5 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" /> Recent Feedback
            </h2>
            
            {loading ? (
              <div className="text-center py-12">Loading feedback...</div>
            ) : feedbacks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Star className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No feedback yet</h3>
                  <p className="text-muted-foreground">
                    Your manager will share feedback with you soon
                  </p>
                </CardContent>
              </Card>
            ) : (
              feedbacks.map((fb) => (
                <Card key={fb.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{fb.voice_sessions?.title}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(fb.published_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {fb.competency_tags && fb.competency_tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {fb.competency_tags.map((tag, i) => (
                          <Badge key={i} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    )}
                    <div className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg">
                      {fb.final_feedback}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="growth" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Short-term Goals</CardTitle>
                  <CardDescription>Immediate priorities</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                      Complete current project deliverables
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                      Improve documentation practices
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                      Attend cross-functional meetings
                    </li>
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Mid-term Goals</CardTitle>
                  <CardDescription>3-6 month horizon</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      Lead a small feature team
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      Present at company tech talk
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      Complete advanced certification
                    </li>
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Long-term Goals</CardTitle>
                  <CardDescription>12+ month vision</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                      Senior role transition
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                      Mentor junior developers
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                      Drive organizational initiative
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Key Milestones</CardTitle>
                <CardDescription>Track your progress by marking milestones as completed</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingMilestones ? (
                  <div className="text-center py-4">Loading milestones...</div>
                ) : (
                  <div className="space-y-4">
                    {milestones.map((milestone, i) => {
                      const isCompleted = completedMilestones.includes(milestone.goal);
                      return (
                        <div 
                          key={i} 
                          className={`flex items-center gap-4 p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                            isCompleted ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''
                          }`}
                          onClick={() => toggleMilestoneComplete(milestone.goal)}
                        >
                          <Checkbox 
                            checked={isCompleted}
                            onCheckedChange={() => toggleMilestoneComplete(milestone.goal)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-6 w-6"
                          />
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isCompleted ? 'bg-green-100 text-green-600' :
                            milestone.status === 'in-progress' ? 'bg-blue-100 text-blue-600' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {isCompleted ? <Check className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>{milestone.goal}</p>
                            <p className="text-sm text-muted-foreground">{milestone.quarter}</p>
                          </div>
                          <Badge variant={
                            isCompleted ? 'default' :
                            milestone.status === 'in-progress' ? 'secondary' : 'outline'
                          }>
                            {isCompleted ? 'completed' : milestone.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" /> Learning Recommendations
                </CardTitle>
                <CardDescription>Suggested development areas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {learningRecommendations.map((rec, i) => (
                    <div key={i} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{rec.topic}</h4>
                        <Badge variant={rec.priority === 'High' ? 'destructive' : 'secondary'} className="text-xs">{rec.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{rec.resource}</p>
                      <p className="text-xs text-muted-foreground">Timeframe: {rec.timeframe}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;