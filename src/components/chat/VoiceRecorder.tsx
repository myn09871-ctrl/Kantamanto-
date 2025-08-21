
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Square, Play, Pause, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceRecorderProps {
  onVoiceMessage: (audioBlob: Blob) => void;
  disabled?: boolean;
}

const VoiceRecorder = ({ onVoiceMessage, disabled }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const { toast } = useToast();
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      chunksRef.current = [];
      setRecordingTime(0);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedAudio(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast({
        title: "Recording Started",
        description: "Speak now to record your voice message",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      toast({
        title: "Recording Stopped",
        description: "You can now preview or send your voice message",
      });
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const sendVoiceMessage = () => {
    if (recordedAudio) {
      onVoiceMessage(recordedAudio);
      setRecordedAudio(null);
      setAudioUrl(null);
      setRecordingTime(0);
      setIsPlaying(false);
      
      toast({
        title: "Voice Message Sent",
        description: "Your voice message has been sent successfully",
      });
    }
  };

  const discardRecording = () => {
    setRecordedAudio(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadAudio = () => {
    if (audioUrl && recordedAudio) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `voice-message-${Date.now()}.webm`;
      link.click();
    }
  };

  if (recordedAudio) {
    return (
      <div className="flex items-center space-x-2 p-2 bg-muted rounded-lg">
        <audio
          ref={audioRef}
          src={audioUrl || undefined}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-full"
          onClick={playAudio}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>
        
        <div className="flex-1 text-xs text-muted-foreground">
          Voice message ({formatTime(recordingTime)})
        </div>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-full"
          onClick={downloadAudio}
        >
          <Download className="w-3 h-3" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-full text-red-500 hover:bg-red-50"
          onClick={discardRecording}
        >
          <MicOff className="w-4 h-4" />
        </Button>
        
        <Button
          type="button"
          variant="default"
          size="sm"
          className="h-8 px-3 text-xs"
          onClick={sendVoiceMessage}
          disabled={disabled}
        >
          Send
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {isRecording && (
        <div className="flex items-center space-x-2 text-xs text-red-500">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span>{formatTime(recordingTime)}</span>
        </div>
      )}
      
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={`h-8 w-8 p-0 rounded-full hover:bg-primary/10 ${
          isRecording ? 'bg-red-50 text-red-500' : ''
        }`}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled}
      >
        {isRecording ? (
          <Square className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
};

export default VoiceRecorder;
