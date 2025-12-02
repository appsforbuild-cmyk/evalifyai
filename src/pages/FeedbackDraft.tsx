import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Edit, FileText, Mic } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';

const FeedbackDraft = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const [editedFeedback, setEditedFeedback] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [sessionId]);

  const fetchData = async () => {
    const { data: sessionData } = await supabase
      .from('voice_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionData) {
      setSession(sessionData);
    }

    const { data: feedbackData } = await supabase
      .from('feedback_entries')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (feedbackData) {
      setFeedback(feedbackData);
      setEditedFeedback(feedbackData.final_feedback || feedbackData.ai_draft || '');
    }
  };

  const saveDraft = async () => {
    const { error } = await supabase
      .from('feedback_entries')
      .update({ final_feedback: editedFeedback })
      .eq('id', feedback.id);

    if (error) {
      toast.error('Failed to save');
    } else {
      toast.success('Draft saved');
      setIsEditing(false);
    }
  };

  const publishFeedback = async () => {
    setPublishing(true);
    
    const { error: feedbackError } = await supabase
      .from('feedback_entries')
      .update({ 
        final_feedback: editedFeedback,
        is_published: true,
        published_at: new Date().toISOString()
      })
      .eq('id', feedback.id);

    const { error: sessionError } = await supabase
      .from('voice_sessions')
      .update({ status: 'published' })
      .eq('id', sessionId);

    if (feedbackError || sessionError) {
      toast.error('Failed to publish');
    } else {
      toast.success('Feedback published to employee!');
      navigate('/dashboard');
    }
    
    setPublishing(false);
  };

  if (!session || !feedback) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-primary">{session.title}</h1>
            <p className="text-muted-foreground">Review and edit AI-generated feedback</p>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-2" /> Edit
              </Button>
            ) : (
              <Button variant="outline" onClick={saveDraft}>
                Save Draft
              </Button>
            )}
            <Button onClick={publishFeedback} disabled={publishing}>
              {publishing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Publish to Employee
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Transcript Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5" /> Original Transcript
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg min-h-[300px] whitespace-pre-wrap text-sm">
                {session.transcript || 'No transcript available'}
              </div>
            </CardContent>
          </Card>

          {/* Feedback Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" /> AI-Generated Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {feedback.competency_tags && feedback.competency_tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {feedback.competency_tags.map((tag: string, i: number) => (
                    <Badge key={i} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              )}

              {feedback.tone_analysis && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Tone: </span>
                  {feedback.tone_analysis.overall || 'Balanced'}
                </div>
              )}

              {isEditing ? (
                <Textarea
                  value={editedFeedback}
                  onChange={(e) => setEditedFeedback(e.target.value)}
                  className="min-h-[300px]"
                  placeholder="Edit feedback here..."
                />
              ) : (
                <div className="bg-background border p-4 rounded-lg min-h-[300px] whitespace-pre-wrap">
                  {editedFeedback || feedback.ai_draft || 'No feedback generated yet'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FeedbackDraft;
