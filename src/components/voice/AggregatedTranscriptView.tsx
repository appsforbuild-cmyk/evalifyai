import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, PlayCircle, StopCircle, Mic } from 'lucide-react';
import { QuestionRecording } from '@/types/voiceSession';
import { supabase } from '@/integrations/supabase/client';

interface AggregatedTranscriptViewProps {
  recordings: QuestionRecording[];
  sessionId: string;
}

const AggregatedTranscriptView = ({ recordings, sessionId }: AggregatedTranscriptViewProps) => {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [currentAllIndex, setCurrentAllIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const getAudioUrl = async (audioPath: string) => {
    const { data } = await supabase.storage
      .from('voice-recordings')
      .createSignedUrl(audioPath, 3600);
    return data?.signedUrl || null;
  };

  const handlePlayQuestion = async (index: number) => {
    if (playingIndex === index) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingIndex(null);
      return;
    }

    const recording = recordings[index];
    if (!recording.audioPath) return;

    const url = await getAudioUrl(recording.audioPath);
    if (!url || !audioRef.current) return;

    audioRef.current.src = url;
    audioRef.current.play();
    setPlayingIndex(index);
  };

  const handleAudioEnded = () => {
    if (isPlayingAll && currentAllIndex < recordings.length - 1) {
      // Play next in sequence
      const nextIndex = currentAllIndex + 1;
      setCurrentAllIndex(nextIndex);
      handlePlayQuestion(nextIndex);
    } else {
      setPlayingIndex(null);
      setIsPlayingAll(false);
      setCurrentAllIndex(0);
    }
  };

  const handlePlayAll = async () => {
    if (isPlayingAll) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlayingAll(false);
      setPlayingIndex(null);
      setCurrentAllIndex(0);
      return;
    }

    setIsPlayingAll(true);
    setCurrentAllIndex(0);
    await handlePlayQuestion(0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = recordings.reduce((sum, r) => sum + (r.duration || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header with Play All */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Question-by-Question Transcript</h3>
          <p className="text-sm text-muted-foreground">
            {recordings.length} questions • Total duration: {formatDuration(totalDuration)}
          </p>
        </div>
        <Button
          variant={isPlayingAll ? 'destructive' : 'default'}
          onClick={handlePlayAll}
          disabled={recordings.length === 0}
          className="gap-2"
        >
          {isPlayingAll ? (
            <>
              <StopCircle className="w-4 h-4" /> Stop
            </>
          ) : (
            <>
              <PlayCircle className="w-4 h-4" /> Play All
            </>
          )}
        </Button>
      </div>

      {/* Question/Answer List */}
      <div className="space-y-4">
        {recordings.map((recording, index) => (
          <Card
            key={recording.questionId}
            className={`border ${
              playingIndex === index ? 'border-primary bg-primary/5' : 'border-border'
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{index + 1}</Badge>
                  <CardTitle className="text-base font-medium">
                    {recording.questionText}
                  </CardTitle>
                </div>
                {recording.audioPath && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(recording.duration || 0)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePlayQuestion(index)}
                      className="h-8 w-8"
                    >
                      {playingIndex === index ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {recording.transcript ? (
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {recording.transcript}
                  </p>
                </div>
              ) : recording.audioPath ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm italic">
                  <Mic className="w-4 h-4" />
                  <span>Recording available - transcript pending processing</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No recording</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {recordings.length === 0 && (
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <Mic className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No question recordings available</p>
          </CardContent>
        </Card>
      )}

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        className="hidden"
      />
    </div>
  );
};

export default AggregatedTranscriptView;
