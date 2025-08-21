
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Video, Square, Play, Pause, RotateCcw } from "lucide-react";

interface VideoRecorderProps {
  onVideoRecorded: (blob: Blob, url: string) => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

const VideoRecorder = ({ onVideoRecorded, isRecording, onStartRecording, onStopRecording }: VideoRecorderProps) => {
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startPreview = async () => {
    try {
      console.log('Starting video preview with facing mode:', facingMode);
      
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsPreviewActive(true);
        console.log('Video preview started successfully');
      }
    } catch (error) {
      console.error('Error starting video preview:', error);
      // Fallback to basic video constraints if facing mode fails
      try {
        const basicStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        streamRef.current = basicStream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = basicStream;
          videoRef.current.play();
          setIsPreviewActive(true);
        }
      } catch (fallbackError) {
        console.error('Fallback video preview also failed:', fallbackError);
      }
    }
  };

  const stopPreview = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsPreviewActive(false);
  };

  const switchCamera = async () => {
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);
    
    if (isPreviewActive) {
      stopPreview();
      setTimeout(() => {
        startPreview();
      }, 100);
    }
  };

  const startRecording = async () => {
    if (!streamRef.current) {
      await startPreview();
      if (!streamRef.current) return;
    }

    try {
      console.log('Starting video recording...');
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          console.log('Video chunk received:', event.data.size);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('Video recording stopped, creating blob...');
        const blob = new Blob(chunks, { type: 'video/webm' });
        setVideoBlob(blob);
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        onVideoRecorded(blob, url);
        console.log('Video blob created:', blob.size, 'bytes');
      };

      mediaRecorder.onerror = (event) => {
        console.error('Video recording error:', event);
      };

      mediaRecorder.start(1000);
      onStartRecording();
      console.log('Video recording started');
    } catch (error) {
      console.error('Error starting video recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('Stopping video recording...');
      mediaRecorderRef.current.stop();
      onStopRecording();
    }
  };

  const playVideo = () => {
    if (videoRef.current && videoUrl) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const discardVideo = () => {
    setVideoBlob(null);
    setVideoUrl("");
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  };

  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, []);

  return (
    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
      <h4 className="font-medium mb-3 dark:text-white">Product Video</h4>
      
      <div className="space-y-3">
        {/* Video Preview/Playback */}
        <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted={!videoUrl}
            onEnded={() => setIsPlaying(false)}
            src={videoUrl || undefined}
          />
          
          {!isPreviewActive && !videoUrl && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Video className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2">
          {!videoUrl ? (
            <>
              {!isPreviewActive ? (
                <Button type="button" variant="outline" onClick={startPreview}>
                  <Video className="w-4 h-4 mr-2" />
                  Start Preview
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant={isRecording ? "destructive" : "default"}
                    onClick={isRecording ? stopRecording : startRecording}
                  >
                    {isRecording ? (
                      <>
                        <Square className="w-4 h-4 mr-2" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4 mr-2" />
                        Start Recording
                      </>
                    )}
                  </Button>
                  
                  <Button type="button" variant="outline" onClick={switchCamera}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Switch Camera
                  </Button>
                  
                  <Button type="button" variant="outline" onClick={stopPreview}>
                    Stop Preview
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={playVideo}>
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button type="button" variant="outline" onClick={discardVideo}>
                Discard
              </Button>
            </>
          )}
        </div>

        {isRecording && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-red-600 dark:text-red-400">Recording video...</span>
          </div>
        )}

        {videoUrl && (
          <p className="text-sm text-green-600 dark:text-green-400">
            Video recorded successfully! Duration: {videoBlob && (videoBlob.size / 1024 / 1024).toFixed(2)}MB
          </p>
        )}
      </div>
    </div>
  );
};

export default VideoRecorder;
