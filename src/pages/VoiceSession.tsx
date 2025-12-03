import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Mic, Square, Pause, Play, Upload, Loader2, FileAudio, CheckCircle, HelpCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

type ProcessingStep = 'idle' | 'uploading' | 'transcribing' | 'generating' | 'complete';

interface FeedbackQuestion {
  id: string;
  question_text: string;
  category: string;
  display_order: number;
}

const VoiceSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [questions, setQuestions] = useState<FeedbackQuestion[]>([]);

  const {
    state: recordingState,
    audioBlob,
    audioUrl,
    duration,
    audioLevel,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording
  } = useAudioRecorder();

  useEffect(() => {
    fetchSession();
    fetchQuestions();
  }, [sessionId]);

  const fetchSession = async () => {
    const { data, error } = await supabase
      .from('voice_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      toast.error('Session not found');
      navigate('/dashboard');
    } else {
      setSession(data);
      if (data.transcript) {
        setTranscript(data.transcript);
      }
      if (data.status === 'draft') {
        setProcessingStep('complete');
      }
    }
  };

  const fetchQuestions = async () => {
    const { data } = await supabase
      .from('feedback_questions')
      .select('id, question_text, category, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (data) {
      setQuestions(data);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
      await supabase
        .from('voice_sessions')
        .update({ status: 'recording' })
        .eq('id', sessionId);
      toast.success('Recording started');
    } catch (err) {
      toast.error('Could not access microphone');
    }
  };

  const handlePauseRecording = () => {
    pauseRecording();
    toast.info('Recording paused');
  };

  const handleResumeRecording = () => {
    resumeRecording();
    toast.info('Recording resumed');
  };

  const handleStopRecording = () => {
    stopRecording();
    toast.success('Recording stopped');
  };

  const uploadAndProcess = async () => {
    if (!audioBlob || !user || !sessionId) return;

    setProcessingStep('uploading');
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload to Supabase Storage
      const fileName = `${user.id}/${sessionId}-${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('voice-recordings')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
          upsert: true
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('voice-recordings')
        .getPublicUrl(fileName);

      // Update session with audio URL
      await supabase
        .from('voice_sessions')
        .update({ audio_url: publicUrl, status: 'processing' })
        .eq('id', sessionId);

      toast.success('Audio uploaded successfully');
      setProcessingStep('transcribing');
      setTranscript('Transcribing audio...');

      // Convert blob to base64 for processing
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];

        // Call process-session edge function
        const { data, error } = await supabase.functions.invoke('process-session', {
          body: { sessionId, audioBase64: base64Audio }
        });

        if (error) {
          console.error('Processing error:', error);
          toast.error('Processing failed');
          setProcessingStep('idle');
          return;
        }

        setProcessingStep('generating');
        
        // Show transcript
        if (data?.transcript) {
          setTranscript(data.transcript);
        }

        // Small delay to show generating step
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setProcessingStep('complete');
        toast.success('Processing complete!');
      };
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Upload failed');
      setProcessingStep('idle');
      setUploadProgress(0);
    }
  };

  if (!session) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{session.title}</h1>
          <p className="text-muted-foreground mt-1">{session.description}</p>
        </div>

        {/* Recording Card */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" /> Voice Recording
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Recording Visualization */}
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                {/* Audio level ring */}
                <div 
                  className={`absolute inset-0 rounded-full transition-all duration-100 ${
                    recordingState === 'recording' ? 'bg-destructive/20' : 'bg-transparent'
                  }`}
                  style={{
                    transform: `scale(${1 + audioLevel * 0.5})`,
                    opacity: audioLevel
                  }}
                />
                
                {/* Main circle */}
                <div className={`relative w-36 h-36 rounded-full flex items-center justify-center transition-all ${
                  recordingState === 'recording' 
                    ? 'bg-destructive/10 border-4 border-destructive animate-pulse' 
                    : recordingState === 'paused'
                    ? 'bg-warning/10 border-4 border-warning'
                    : audioUrl
                    ? 'bg-primary/10 border-4 border-primary'
                    : 'bg-muted border-4 border-border'
                }`}>
                  {recordingState === 'recording' ? (
                    <div className="flex flex-col items-center">
                      <Mic className="w-10 h-10 text-destructive" />
                      <span className="text-sm font-mono text-destructive mt-1">
                        {formatDuration(duration)}
                      </span>
                    </div>
                  ) : recordingState === 'paused' ? (
                    <div className="flex flex-col items-center">
                      <Pause className="w-10 h-10 text-warning" />
                      <span className="text-sm font-mono text-warning mt-1">
                        {formatDuration(duration)}
                      </span>
                    </div>
                  ) : audioUrl ? (
                    <FileAudio className="w-10 h-10 text-primary" />
                  ) : (
                    <Mic className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Duration display when stopped */}
              {audioUrl && recordingState === 'stopped' && (
                <p className="text-sm text-muted-foreground">
                  Recording duration: {formatDuration(duration)}
                </p>
              )}

              {/* Controls */}
              <div className="flex gap-3">
                {recordingState === 'idle' && !audioUrl && (
                  <Button onClick={handleStartRecording} size="lg" className="gap-2">
                    <Mic className="w-5 h-5" /> Start Recording
                  </Button>
                )}
                
                {recordingState === 'recording' && (
                  <>
                    <Button onClick={handlePauseRecording} variant="outline" size="lg" className="gap-2">
                      <Pause className="w-5 h-5" /> Pause
                    </Button>
                    <Button onClick={handleStopRecording} variant="destructive" size="lg" className="gap-2">
                      <Square className="w-5 h-5" /> Stop
                    </Button>
                  </>
                )}

                {recordingState === 'paused' && (
                  <>
                    <Button onClick={handleResumeRecording} variant="outline" size="lg" className="gap-2">
                      <Play className="w-5 h-5" /> Resume
                    </Button>
                    <Button onClick={handleStopRecording} variant="destructive" size="lg" className="gap-2">
                      <Square className="w-5 h-5" /> Stop
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Audio Preview */}
            {audioUrl && recordingState === 'stopped' && processingStep === 'idle' && (
              <div className="space-y-4 pt-4 border-t border-border">
                <audio controls src={audioUrl} className="w-full" />
                
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={resetRecording}>
                    Re-record
                  </Button>
                  <Button onClick={uploadAndProcess} className="gap-2">
                    <Upload className="w-4 h-4" /> Upload & Process
                  </Button>
                </div>
              </div>
            )}

            {/* Processing States */}
            {processingStep !== 'idle' && processingStep !== 'complete' && (
              <div className="space-y-4 pt-4 border-t border-border">
                {/* Upload Progress */}
                {processingStep === 'uploading' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Uploading audio...</span>
                      <span className="font-mono">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                {/* Transcription */}
                {processingStep === 'transcribing' && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Transcribing audio...</span>
                  </div>
                )}

                {/* Generating Feedback */}
                {processingStep === 'generating' && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generating AI feedback...</span>
                  </div>
                )}
              </div>
            )}

            {/* Completion State */}
            {processingStep === 'complete' && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center gap-3 text-primary">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Processing complete!</span>
                </div>
                
                <Button 
                  onClick={() => navigate(`/feedback/${sessionId}`)} 
                  className="w-full"
                >
                  View & Edit Feedback Draft
                </Button>
              </div>
            )}

            {/* Transcript Preview */}
            {transcript && (
              <div className="space-y-2 pt-4 border-t border-border">
                <h4 className="font-medium text-foreground">Transcript Preview</h4>
                <div className="bg-muted/50 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {transcript}
                  </p>
                </div>
              </div>
            )}

            {/* Instructions */}
            {processingStep === 'idle' && !audioUrl && (
              <div className="space-y-4 text-sm text-muted-foreground text-center">
                <p>Speak naturally about the employee's performance.</p>
                <p>EvalifyAI will transcribe and generate structured feedback.</p>
              </div>
            )}

            {/* Feedback Questions Guide */}
            {processingStep === 'idle' && questions.length > 0 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <HelpCircle className="w-5 h-5 text-primary" />
                    Questions to Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Please speak on each of these topics during your recording:
                  </p>
                  <div className="space-y-2">
                    {questions.map((q, index) => (
                      <div key={q.id} className="flex items-start gap-3 p-2 rounded bg-background/50">
                        <Badge variant="outline" className="shrink-0 mt-0.5">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">{q.question_text}</p>
                          <p className="text-xs text-muted-foreground">{q.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default VoiceSession;
