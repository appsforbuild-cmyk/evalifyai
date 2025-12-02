import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Square, Loader2, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';

const VoiceSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    fetchSession();
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
      if (data.audio_url) {
        setAudioUrl(data.audio_url);
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      await supabase
        .from('voice_sessions')
        .update({ status: 'recording' })
        .eq('id', sessionId);

      toast.success('Recording started');
    } catch (err) {
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success('Recording stopped');
    }
  };

  const uploadAndProcess = async () => {
    if (!audioBlob || !user) return;

    setProcessing(true);
    try {
      // Upload to Supabase Storage
      const fileName = `${user.id}/${sessionId}-${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('voice-recordings')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('voice-recordings')
        .getPublicUrl(fileName);

      // Update session with audio URL
      await supabase
        .from('voice_sessions')
        .update({ audio_url: publicUrl, status: 'processing' })
        .eq('id', sessionId);

      toast.success('Audio uploaded, processing...');

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
          toast.error('Processing failed');
          setProcessing(false);
          return;
        }

        toast.success('Processing complete!');
        navigate(`/feedback/${sessionId}`);
      };
    } catch (err) {
      toast.error('Upload failed');
      setProcessing(false);
    }
  };

  if (!session) {
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
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">{session.title}</h1>
          <p className="text-muted-foreground">{session.description}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" /> Voice Recording
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-6">
              {/* Recording visualization */}
              <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                isRecording 
                  ? 'bg-red-100 animate-pulse border-4 border-red-500' 
                  : 'bg-muted border-4 border-border'
              }`}>
                <Mic className={`w-12 h-12 ${isRecording ? 'text-red-500' : 'text-muted-foreground'}`} />
              </div>

              {/* Controls */}
              <div className="flex gap-4">
                {!isRecording && !audioUrl && (
                  <Button onClick={startRecording} size="lg" className="flex items-center gap-2">
                    <Mic className="w-5 h-5" /> Start Recording
                  </Button>
                )}
                
                {isRecording && (
                  <Button onClick={stopRecording} variant="destructive" size="lg" className="flex items-center gap-2">
                    <Square className="w-5 h-5" /> Stop Recording
                  </Button>
                )}
              </div>

              {/* Audio preview */}
              {audioUrl && !isRecording && (
                <div className="w-full space-y-4">
                  <audio controls src={audioUrl} className="w-full" />
                  
                  <div className="flex gap-4 justify-center">
                    <Button variant="outline" onClick={() => {
                      setAudioBlob(null);
                      setAudioUrl(null);
                    }}>
                      Re-record
                    </Button>
                    <Button 
                      onClick={uploadAndProcess} 
                      disabled={processing}
                      className="flex items-center gap-2"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" /> Upload & Process
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="text-sm text-muted-foreground text-center">
              <p>Speak naturally about the employee's performance.</p>
              <p>EvalifyAI will transcribe and generate structured feedback.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default VoiceSession;
