import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Mic, MicOff, Send, User, MessageSquare, ThumbsUp, Lightbulb, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import { quickFeedbackSchema } from '@/lib/validations';

interface Employee {
  id: string;
  full_name: string;
  email: string;
  team: string;
}

interface QuickFeedbackEntry {
  id: string;
  created_by_profile_id: string;
  employee_profile_id: string;
  transcript: string | null;
  audio_path: string | null;
  feedback_type: string;
  created_at: string;
}

const QuickFeedback = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState<'quick' | 'praise' | 'suggestion'>('quick');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentFeedback, setRecentFeedback] = useState<QuickFeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    fetchEmployees();
    fetchRecentFeedback();
  }, [user]);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('employees_directory')
      .select('id, full_name, email, team')
      .order('full_name');

    if (!error && data) {
      setEmployees(data);
    }
    setLoading(false);
  };

  const fetchRecentFeedback = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('quick_feedback')
      .select('*')
      .or(`created_by_profile_id.eq.${user.id},employee_profile_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setRecentFeedback(data as QuickFeedbackEntry[]);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info('Recording started...');
    } catch (error) {
      toast.error('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        // Call existing STT function
        const { data, error } = await supabase.functions.invoke('process-session', {
          body: { 
            audioBase64: base64Audio,
            action: 'transcribe-only'
          }
        });

        if (error) {
          toast.error('Failed to transcribe audio');
        } else if (data?.transcript) {
          setFeedbackText(prev => prev + (prev ? '\n' : '') + data.transcript);
          toast.success('Audio transcribed');
        }
        setIsProcessing(false);
      };
    } catch (error) {
      toast.error('Failed to process audio');
      setIsProcessing(false);
    }
  };

  const submitFeedback = async () => {
    setFormErrors({});
    
    // Validate with Zod
    const result = quickFeedbackSchema.safeParse({
      employee_id: selectedEmployee,
      feedback_text: feedbackText,
      feedback_type: feedbackType,
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

    const { error } = await supabase
      .from('quick_feedback')
      .insert({
        created_by_profile_id: user?.id,
        employee_profile_id: selectedEmployee,
        transcript: feedbackText,
        feedback_type: feedbackType,
      });

    if (error) {
      toast.error('Failed to submit feedback');
    } else {
      toast.success('Feedback submitted successfully!');
      setFeedbackText('');
      setSelectedEmployee('');
      fetchRecentFeedback();
    }
  };

  const getFeedbackTypeIcon = (type: string) => {
    switch (type) {
      case 'praise': return <ThumbsUp className="w-4 h-4 text-green-600" />;
      case 'suggestion': return <Lightbulb className="w-4 h-4 text-amber-600" />;
      default: return <MessageSquare className="w-4 h-4 text-blue-600" />;
    }
  };

  const getFeedbackTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      praise: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      suggestion: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      quick: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    };
    return styles[type] || styles.quick;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">Quick Feedback</h1>
            <p className="text-muted-foreground">Send ad-hoc feedback anytime</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Create Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>New Feedback</CardTitle>
              <CardDescription>Record or type quick feedback for a team member</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Employee</Label>
                <select
                  className={`w-full px-3 py-2 border rounded-md bg-background ${formErrors.employee_id ? 'border-destructive' : ''}`}
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                  <option value="">Choose an employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} - {emp.team}
                    </option>
                  ))}
                </select>
                {formErrors.employee_id && (
                  <p className="text-sm text-destructive">{formErrors.employee_id}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Feedback Type</Label>
                <Tabs value={feedbackType} onValueChange={(v) => setFeedbackType(v as any)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="quick" className="gap-2">
                      <MessageSquare className="w-4 h-4" /> Quick
                    </TabsTrigger>
                    <TabsTrigger value="praise" className="gap-2">
                      <ThumbsUp className="w-4 h-4" /> Praise
                    </TabsTrigger>
                    <TabsTrigger value="suggestion" className="gap-2">
                      <Lightbulb className="w-4 h-4" /> Suggestion
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-2">
                <Label>Feedback</Label>
                <Textarea
                  placeholder="Type your feedback or use voice recording..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={6}
                  maxLength={5000}
                  className={formErrors.feedback_text ? 'border-destructive' : ''}
                />
                {formErrors.feedback_text && (
                  <p className="text-sm text-destructive">{formErrors.feedback_text}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant={isRecording ? 'destructive' : 'outline'}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                  className="gap-2"
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-4 h-4" /> Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" /> Record Voice
                    </>
                  )}
                </Button>
                {isProcessing && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Transcribing...
                  </div>
                )}
              </div>

              <Button onClick={submitFeedback} className="w-full gap-2">
                <Send className="w-4 h-4" /> Submit Feedback
              </Button>
            </CardContent>
          </Card>

          {/* Recent Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Feedback</CardTitle>
              <CardDescription>Your recent feedback submissions and received</CardDescription>
            </CardHeader>
            <CardContent>
              {recentFeedback.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No feedback yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentFeedback.map((fb) => {
                    const employee = employees.find(e => e.id === fb.employee_profile_id);
                    const isSent = fb.created_by_profile_id === user?.id;
                    return (
                      <div 
                        key={fb.id} 
                        className={`p-4 border rounded-lg ${isSent ? 'border-l-4 border-l-primary' : 'border-l-4 border-l-green-500'}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            {getFeedbackTypeIcon(fb.feedback_type)}
                            <Badge className={getFeedbackTypeBadge(fb.feedback_type)}>
                              {fb.feedback_type}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(fb.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {isSent ? 'To: ' : 'From: '} 
                          <span className="font-medium">{employee?.full_name || 'Unknown'}</span>
                        </p>
                        <p className="text-sm">{fb.transcript}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default QuickFeedback;