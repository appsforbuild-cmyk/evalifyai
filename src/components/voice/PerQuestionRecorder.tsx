import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Mic, Square, Pause, Play, RotateCcw, ChevronLeft, ChevronRight, Check, Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { usePerQuestionRecorder } from '@/hooks/usePerQuestionRecorder';
import { QuestionRecording } from '@/types/voiceSession';
import { TemplateQuestion } from '@/types/questionTemplate';

interface PerQuestionRecorderProps {
  sessionId: string;
  questions: TemplateQuestion[];
  initialRecordings?: QuestionRecording[];
  initialQuestionIndex?: number;
  onComplete: (recordings: QuestionRecording[]) => void;
}

const PerQuestionRecorder = ({
  sessionId,
  questions,
  initialRecordings = [],
  initialQuestionIndex = 0,
  onComplete,
}: PerQuestionRecorderProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const [currentIndex, setCurrentIndex] = useState(initialQuestionIndex);
  const [recordings, setRecordings] = useState<QuestionRecording[]>(
    questions.map((q, i) => initialRecordings[i] || {
      questionId: q.id,
      questionText: q.text,
      audioPath: null,
      audioUrl: undefined,
      transcript: null,
      duration: 0,
      recordedAt: null,
    })
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    audioLevel,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  } = usePerQuestionRecorder();

  const currentQuestion = questions[currentIndex];
  const currentRecording = recordings[currentIndex];
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  // Save progress to database
  const saveProgress = useCallback(async (updatedRecordings: QuestionRecording[], questionIdx: number) => {
    const { error } = await supabase
      .from('voice_sessions')
      .update({
        question_recordings: JSON.parse(JSON.stringify(updatedRecordings)),
        current_question_index: questionIdx,
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error saving progress:', error);
    }
  }, [sessionId]);

  // Upload audio to storage
  const uploadAudio = useCallback(async (blob: Blob, questionIndex: number): Promise<string | null> => {
    if (!user) return null;
    
    setIsUploading(true);
    const fileName = `${user.id}/${sessionId}/question-${questionIndex}.webm`;
    
    const { error: uploadError } = await supabase.storage
      .from('voice-recordings')
      .upload(fileName, blob, {
        contentType: 'audio/webm',
        upsert: true,
      });

    setIsUploading(false);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      toast.error('Failed to upload recording');
      return null;
    }

    return fileName;
  }, [user, sessionId]);

  // Handle recording completion
  const handleRecordingComplete = useCallback(async () => {
    if (!audioBlob) return;

    setIsSaving(true);
    
    const audioPath = await uploadAudio(audioBlob, currentIndex);
    
    if (audioPath) {
      const updatedRecordings = [...recordings];
      updatedRecordings[currentIndex] = {
        ...updatedRecordings[currentIndex],
        audioPath,
        audioUrl: audioUrl || undefined,
        duration,
        recordedAt: new Date().toISOString(),
      };
      
      setRecordings(updatedRecordings);
      await saveProgress(updatedRecordings, currentIndex);
      toast.success('Recording saved');
    }
    
    setIsSaving(false);
  }, [audioBlob, audioUrl, currentIndex, duration, recordings, uploadAudio, saveProgress]);

  // Auto-save when recording stops and has audio
  useEffect(() => {
    if (audioBlob && !isRecording) {
      handleRecordingComplete();
    }
  }, [audioBlob, isRecording]);

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      toast.error('Could not access microphone');
    }
  };

  const handleReRecord = () => {
    resetRecording();
    // Clear the current recording data but keep the question info
    const updatedRecordings = [...recordings];
    updatedRecordings[currentIndex] = {
      ...updatedRecordings[currentIndex],
      audioPath: null,
      audioUrl: undefined,
      transcript: null,
      duration: 0,
      recordedAt: null,
    };
    setRecordings(updatedRecordings);
  };

  const handlePrevious = async () => {
    if (currentIndex > 0) {
      resetRecording();
      setCurrentIndex(currentIndex - 1);
      await saveProgress(recordings, currentIndex - 1);
    }
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      resetRecording();
      setCurrentIndex(currentIndex + 1);
      await saveProgress(recordings, currentIndex + 1);
    }
  };

  const handleComplete = async () => {
    // Check all questions have recordings
    const allRecorded = recordings.every(r => r.audioPath);
    
    if (!allRecorded) {
      const unanswered = recordings.filter(r => !r.audioPath).length;
      toast.error(`Please record answers for all ${unanswered} remaining question(s)`);
      return;
    }

    // Mark session as complete
    await supabase
      .from('voice_sessions')
      .update({
        is_complete: true,
        status: 'processing',
      })
      .eq('id', sessionId);

    onComplete(recordings);
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const hasCurrentRecording = currentRecording?.audioPath || audioUrl;
  const allQuestionsRecorded = recordings.every(r => r.audioPath);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-muted-foreground">
            {recordings.filter(r => r.audioPath).length} recorded
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
        
        {/* Question indicators */}
        <div className="flex gap-1 justify-center">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (!isRecording) {
                  resetRecording();
                  setCurrentIndex(i);
                }
              }}
              disabled={isRecording}
              className={`w-8 h-2 rounded-full transition-all ${
                i === currentIndex 
                  ? 'bg-primary' 
                  : recordings[i]?.audioPath 
                    ? 'bg-green-500' 
                    : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Current Question */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{currentQuestion?.type || 'text'}</Badge>
            {currentQuestion?.required && (
              <Badge variant="secondary">Required</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium text-foreground">
            {currentQuestion?.text || 'No question text'}
          </p>
        </CardContent>
      </Card>

      {/* Recording Interface */}
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-6">
            {/* Waveform Visualization */}
            <div className="relative w-full h-24 bg-muted/30 rounded-lg overflow-hidden flex items-center justify-center">
              {isRecording ? (
                <div className="flex items-center gap-1 h-full">
                  {[...Array(40)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-primary rounded-full transition-all duration-75"
                      style={{
                        height: `${Math.max(8, Math.random() * audioLevel * 100)}%`,
                        opacity: 0.5 + audioLevel * 0.5,
                      }}
                    />
                  ))}
                </div>
              ) : hasCurrentRecording ? (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Check className="w-6 h-6 text-green-500" />
                  <span>Recording complete • {formatDuration(currentRecording?.duration || duration)}</span>
                </div>
              ) : (
                <div className="text-muted-foreground text-center">
                  <Mic className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Press the record button to start</p>
                </div>
              )}
            </div>

            {/* Duration Timer */}
            {(isRecording || isPaused) && (
              <div className={`text-3xl font-mono ${isRecording && !isPaused ? 'text-destructive' : 'text-warning'}`}>
                {formatDuration(duration)}
              </div>
            )}

            {/* Recording Controls */}
            <div className="flex items-center gap-4">
              {!isRecording && !hasCurrentRecording && (
                <Button
                  size="lg"
                  onClick={handleStartRecording}
                  disabled={isUploading || isSaving}
                  className="gap-2 h-14 px-8"
                >
                  <Mic className="w-5 h-5" /> Start Recording
                </Button>
              )}

              {isRecording && (
                <>
                  {isPaused ? (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={resumeRecording}
                      className="gap-2"
                    >
                      <Play className="w-5 h-5" /> Resume
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={pauseRecording}
                      className="gap-2"
                    >
                      <Pause className="w-5 h-5" /> Pause
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={stopRecording}
                    className="gap-2"
                  >
                    <Square className="w-5 h-5" /> Stop
                  </Button>
                </>
              )}

              {hasCurrentRecording && !isRecording && (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handlePlayPause}
                    disabled={isSaving || isUploading}
                    className="gap-2"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    {isPlaying ? 'Pause' : 'Play'}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleReRecord}
                    disabled={isSaving || isUploading}
                    className="gap-2"
                  >
                    <RotateCcw className="w-5 h-5" /> Re-record
                  </Button>
                </>
              )}

              {(isSaving || isUploading) && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </div>
              )}
            </div>

            {/* Hidden audio element for playback */}
            {(audioUrl || currentRecording?.audioUrl) && (
              <audio
                ref={audioRef}
                src={audioUrl || currentRecording?.audioUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0 || isRecording}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </Button>

        {currentIndex === questions.length - 1 ? (
          <Button
            onClick={handleComplete}
            disabled={!allQuestionsRecorded || isRecording || isSaving}
            className="gap-2"
          >
            <Upload className="w-4 h-4" /> Submit All Recordings
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={handleNext}
            disabled={!hasCurrentRecording || isRecording}
            className="gap-2"
          >
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Question Overview */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">All Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => {
                  if (!isRecording) {
                    resetRecording();
                    setCurrentIndex(i);
                  }
                }}
                disabled={isRecording}
                className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${
                  i === currentIndex
                    ? 'bg-primary/10 border border-primary/20'
                    : 'bg-muted/30 hover:bg-muted/50'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  recordings[i]?.audioPath
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {recordings[i]?.audioPath ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <span className={`text-sm truncate flex-1 ${
                  i === currentIndex ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {q.text}
                </span>
                {recordings[i]?.duration > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {formatDuration(recordings[i].duration)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerQuestionRecorder;
