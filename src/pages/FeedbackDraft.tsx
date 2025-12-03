import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send, Edit, FileText, Mic, Undo2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';

type ToneType = 'appreciative' | 'developmental' | 'neutral';

const UNDO_WINDOW_MINUTES = 10;

const FeedbackDraft = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const [editedFeedback, setEditedFeedback] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tone, setTone] = useState<ToneType>('neutral');
  const [canUndo, setCanUndo] = useState(false);
  const [undoDeadline, setUndoDeadline] = useState<Date | null>(null);
  const [latestAudit, setLatestAudit] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [sessionId]);

  // Check undo window
  useEffect(() => {
    if (undoDeadline) {
      const checkUndo = setInterval(() => {
        const now = new Date();
        if (now >= undoDeadline) {
          setCanUndo(false);
          setUndoDeadline(null);
          clearInterval(checkUndo);
        }
      }, 1000);
      return () => clearInterval(checkUndo);
    }
  }, [undoDeadline]);

  const fetchData = async () => {
    // Fetch session
    const { data: sessionData } = await supabase
      .from('voice_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionData) {
      // Fetch employee profile separately
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', sessionData.employee_id)
        .maybeSingle();
      
      setSession({ ...sessionData, employee_profile: profileData });
    }

    // Fetch feedback
    const { data: feedbackData } = await supabase
      .from('feedback_entries')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (feedbackData) {
      setFeedback(feedbackData);
      setEditedFeedback(feedbackData.final_feedback || feedbackData.ai_draft || '');
      
      // Extract tone from tone_analysis if available
      const toneAnalysis = feedbackData.tone_analysis as Record<string, any> | null;
      const storedTone = toneAnalysis?.selectedTone;
      if (storedTone) {
        setTone(storedTone as ToneType);
      }

      // Check for recent publish that can be undone
      const { data: auditData } = await supabase
        .from('feedback_audit')
        .select('*')
        .eq('feedback_id', feedbackData.id)
        .eq('action', 'published')
        .eq('is_undone', false)
        .order('performed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (auditData?.can_undo_until) {
        const deadline = new Date(auditData.can_undo_until);
        if (new Date() < deadline) {
          setCanUndo(true);
          setUndoDeadline(deadline);
          setLatestAudit(auditData);
        }
      }
    }
  };

  const saveDraft = async () => {
    setSaving(true);
    
    const toneAnalysis = {
      ...feedback?.tone_analysis,
      selectedTone: tone
    };

    const { error } = await supabase
      .from('feedback_entries')
      .update({ 
        final_feedback: editedFeedback,
        tone_analysis: toneAnalysis
      })
      .eq('id', feedback.id);

    if (error) {
      toast.error('Failed to save');
    } else {
      toast.success('Draft saved');
      setIsEditing(false);
      setFeedback({ ...feedback, final_feedback: editedFeedback, tone_analysis: toneAnalysis });
    }
    setSaving(false);
  };

  const handleToneChange = async (newTone: ToneType) => {
    setTone(newTone);
    
    // Auto-save tone change
    const toneAnalysis = {
      ...feedback?.tone_analysis,
      selectedTone: newTone
    };

    await supabase
      .from('feedback_entries')
      .update({ tone_analysis: toneAnalysis })
      .eq('id', feedback.id);
  };

  const publishFeedback = async () => {
    if (!user) return;
    
    setPublishing(true);
    
    try {
      const previousContent = feedback.final_feedback;
      const undoUntil = new Date(Date.now() + UNDO_WINDOW_MINUTES * 60 * 1000);

      // Update feedback entry
      const { error: feedbackError } = await supabase
        .from('feedback_entries')
        .update({ 
          final_feedback: editedFeedback,
          is_published: true,
          published_at: new Date().toISOString(),
          tone_analysis: {
            ...feedback?.tone_analysis,
            selectedTone: tone
          }
        })
        .eq('id', feedback.id);

      if (feedbackError) throw feedbackError;

      // Update session status
      const { error: sessionError } = await supabase
        .from('voice_sessions')
        .update({ status: 'published' })
        .eq('id', sessionId);

      if (sessionError) throw sessionError;

      // Create audit entry
      const { data: auditEntry, error: auditError } = await supabase
        .from('feedback_audit')
        .insert({
          feedback_id: feedback.id,
          action: 'published',
          previous_content: previousContent,
          new_content: editedFeedback,
          previous_tone: feedback?.tone_analysis?.selectedTone || 'neutral',
          new_tone: tone,
          performed_by: user.id,
          can_undo_until: undoUntil.toISOString(),
          metadata: {
            session_title: session.title,
            employee_id: session.employee_id
          }
        })
        .select()
        .single();

      if (auditError) {
        console.error('Audit error:', auditError);
      } else {
        setLatestAudit(auditEntry);
        setCanUndo(true);
        setUndoDeadline(undoUntil);
      }

      // Send email notification (non-blocking)
      supabase.functions.invoke('send-feedback-notification', {
        body: {
          feedbackId: feedback.id,
          employeeId: session.employee_id,
          sessionTitle: session.title,
          managerName: user.user_metadata?.full_name
        }
      }).then(({ error }) => {
        if (error) {
          console.error('Notification error:', error);
        }
      });

      // Stub: Trigger webhook for HRMS sync
      console.log('HRMS Webhook stub: Would sync feedback to external HRMS', {
        feedbackId: feedback.id,
        employeeId: session.employee_id,
        publishedAt: new Date().toISOString()
      });

      toast.success('Feedback published! Employee notified via email.', {
        description: `You can undo this action for the next ${UNDO_WINDOW_MINUTES} minutes.`,
        duration: 5000
      });

      // Refresh data
      fetchData();

    } catch (error) {
      console.error('Publish error:', error);
      toast.error('Failed to publish feedback');
    }
    
    setPublishing(false);
  };

  const undoPublish = async () => {
    if (!latestAudit || !user) return;

    try {
      // Restore previous content
      const { error: feedbackError } = await supabase
        .from('feedback_entries')
        .update({
          final_feedback: latestAudit.previous_content,
          is_published: false,
          published_at: null,
          tone_analysis: {
            ...feedback?.tone_analysis,
            selectedTone: latestAudit.previous_tone
          }
        })
        .eq('id', feedback.id);

      if (feedbackError) throw feedbackError;

      // Update session status
      await supabase
        .from('voice_sessions')
        .update({ status: 'draft' })
        .eq('id', sessionId);

      // Mark audit as undone
      await supabase
        .from('feedback_audit')
        .update({ is_undone: true })
        .eq('id', latestAudit.id);

      // Create undo audit entry
      await supabase
        .from('feedback_audit')
        .insert({
          feedback_id: feedback.id,
          action: 'unpublished',
          previous_content: latestAudit.new_content,
          new_content: latestAudit.previous_content,
          performed_by: user.id,
          metadata: { undone_audit_id: latestAudit.id }
        });

      setCanUndo(false);
      setUndoDeadline(null);
      setLatestAudit(null);
      
      toast.success('Publication undone. Feedback is back to draft status.');
      fetchData();

    } catch (error) {
      console.error('Undo error:', error);
      toast.error('Failed to undo publication');
    }
  };

  const getRemainingUndoTime = () => {
    if (!undoDeadline) return '';
    const diff = undoDeadline.getTime() - Date.now();
    if (diff <= 0) return '';
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!session || !feedback) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const isPublished = feedback.is_published;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{session.title}</h1>
            <p className="text-muted-foreground">
              {isPublished ? 'Published feedback' : 'Review and edit AI-generated feedback'}
            </p>
            {session.employee_profile?.full_name && (
              <p className="text-sm text-muted-foreground mt-1">
                Employee: <span className="font-medium">{session.employee_profile.full_name}</span>
              </p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3 items-center">
            {/* Tone Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Tone:</span>
              <Select value={tone} onValueChange={(v) => handleToneChange(v as ToneType)} disabled={isPublished}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appreciative">
                    <span className="flex items-center gap-2">✨ Appreciative</span>
                  </SelectItem>
                  <SelectItem value="developmental">
                    <span className="flex items-center gap-2">📈 Developmental</span>
                  </SelectItem>
                  <SelectItem value="neutral">
                    <span className="flex items-center gap-2">⚖️ Neutral</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            {!isPublished && (
              <>
                {!isEditing ? (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </Button>
                ) : (
                  <Button variant="outline" onClick={saveDraft} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Draft
                  </Button>
                )}
                <Button onClick={publishFeedback} disabled={publishing}>
                  {publishing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Approve & Publish
                </Button>
              </>
            )}

            {/* Undo Button */}
            {isPublished && canUndo && (
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={undoPublish} className="gap-2">
                  <Undo2 className="w-4 h-4" /> Undo Publish
                </Button>
                <Badge variant="secondary" className="gap-1">
                  <Clock className="w-3 h-3" /> {getRemainingUndoTime()}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Status Banner */}
        {isPublished && (
          <div className={`flex items-center gap-3 p-4 rounded-lg ${canUndo ? 'bg-warning/10 border border-warning/20' : 'bg-primary/10 border border-primary/20'}`}>
            {canUndo ? (
              <>
                <AlertCircle className="w-5 h-5 text-warning" />
                <div>
                  <p className="font-medium text-warning">Recently Published</p>
                  <p className="text-sm text-muted-foreground">
                    You can undo this publication within the next {getRemainingUndoTime()}.
                  </p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-primary">Published</p>
                  <p className="text-sm text-muted-foreground">
                    This feedback was published on {new Date(feedback.published_at).toLocaleDateString()} and is visible to the employee.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Split View */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Transcript Panel */}
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mic className="w-5 h-5 text-primary" /> Original Transcript
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 p-4 rounded-lg min-h-[400px] max-h-[600px] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">
                {session.transcript || (
                  <span className="text-muted-foreground italic">No transcript available</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Feedback Panel */}
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-primary" /> AI-Generated Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Competency Tags */}
              {feedback.competency_tags && feedback.competency_tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {feedback.competency_tags.map((tag: string, i: number) => (
                    <Badge key={i} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              )}

              {/* Tone Info */}
              {(feedback.tone_analysis as Record<string, any>)?.sentiment && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    Sentiment: <Badge variant={
                      (feedback.tone_analysis as Record<string, any>).sentiment.label === 'positive' ? 'default' :
                      (feedback.tone_analysis as Record<string, any>).sentiment.label === 'negative' ? 'destructive' : 'secondary'
                    }>
                      {(feedback.tone_analysis as Record<string, any>).sentiment.label}
                    </Badge>
                  </span>
                  {(feedback.tone_analysis as Record<string, any>).biasCheck?.hasBias && (
                    <span className="text-warning flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" /> Bias detected & corrected
                    </span>
                  )}
                </div>
              )}

              {/* Feedback Content */}
              {isEditing && !isPublished ? (
                <Textarea
                  value={editedFeedback}
                  onChange={(e) => setEditedFeedback(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                  placeholder="Edit feedback here..."
                />
              ) : (
                <div className="bg-background border rounded-lg p-4 min-h-[400px] max-h-[600px] overflow-y-auto prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap">
                    {editedFeedback || feedback.ai_draft || (
                      <span className="text-muted-foreground italic">No feedback generated yet</span>
                    )}
                  </div>
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
