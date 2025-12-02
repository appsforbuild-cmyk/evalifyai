import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, TrendingUp, Calendar, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';

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
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFeedbacks();
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

  // Mock growth roadmap data
  const growthAreas = [
    { skill: 'Communication', progress: 75 },
    { skill: 'Leadership', progress: 60 },
    { skill: 'Technical Skills', progress: 85 },
    { skill: 'Collaboration', progress: 70 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">My Feedback</h1>
          <p className="text-muted-foreground">View your performance feedback and growth roadmap</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Growth Roadmap */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Growth Roadmap
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

          {/* Feedback List */}
          <div className="lg:col-span-2 space-y-4">
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
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;
