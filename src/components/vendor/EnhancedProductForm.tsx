
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Video, Upload, Play, Pause, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EnhancedProductFormProps {
  onSubmit: (productData: any) => void;
  onCancel: () => void;
  initialData?: any;
}

const EnhancedProductForm = ({ onSubmit, onCancel, initialData }: EnhancedProductFormProps) => {
  const { toast } = useToast();
  const [productData, setProductData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || '',
    stock_quantity: initialData?.stock_quantity || '',
    category_id: initialData?.category_id || '',
    image_url: initialData?.image_url || ''
  });

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Video upload states
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  // Image upload states
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      });

      mediaRecorder.addEventListener('stop', () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      });

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Speak now to record your product description"
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
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({
        title: "Recording Stopped",
        description: "Audio recorded successfully"
      });
    }
  };

  const playAudio = () => {
    if (audioUrl && audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioRef.current.play();
        setIsPlayingAudio(true);
      }
    }
  };

  const deleteAudio = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlayingAudio(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (limit to 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Video file must be smaller than 50MB",
          variant: "destructive"
        });
        return;
      }

      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + imageFiles.length > 5) {
      toast({
        title: "Too Many Images",
        description: "You can upload a maximum of 5 images",
        variant: "destructive"
      });
      return;
    }

    const newImageFiles = [...imageFiles, ...files];
    const newPreviews = [...imagePreviews, ...files.map(file => URL.createObjectURL(file))];
    
    setImageFiles(newImageFiles);
    setImagePreviews(newPreviews);
  };

  const removeImage = (index: number) => {
    const newImageFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    setImageFiles(newImageFiles);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = {
      ...productData,
      audioBlob,
      videoFile,
      imageFiles,
    };
    
    onSubmit(formData);
  };

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="dark:text-white">
          {initialData ? 'Edit Product' : 'Add New Product'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Basic Product Information */}
            <div className="space-y-4">
              <Input
                placeholder="Product Name"
                value={productData.name}
                onChange={(e) => setProductData(prev => ({ ...prev, name: e.target.value }))}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
              
              <Textarea
                placeholder="Product Description"
                value={productData.description}
                onChange={(e) => setProductData(prev => ({ ...prev, description: e.target.value }))}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white min-h-[100px]"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Price (₵)"
                  type="number"
                  step="0.01"
                  value={productData.price}
                  onChange={(e) => setProductData(prev => ({ ...prev, price: e.target.value }))}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
                <Input
                  placeholder="Stock Quantity"
                  type="number"
                  value={productData.stock_quantity}
                  onChange={(e) => setProductData(prev => ({ ...prev, stock_quantity: e.target.value }))}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Media Upload Section */}
            <div className="space-y-4">
              {/* Voice Recording */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <h4 className="font-medium mb-3 dark:text-white">Voice Description</h4>
                <div className="flex items-center space-x-2 mb-3">
                  <Button
                    type="button"
                    variant={isRecording ? "destructive" : "outline"}
                    size="sm"
                    onClick={isRecording ? stopRecording : startRecording}
                    className="dark:border-gray-600"
                  >
                    {isRecording ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                  </Button>
                  
                  {audioUrl && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={playAudio}
                        className="dark:border-gray-600"
                      >
                        {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={deleteAudio}
                        className="dark:border-gray-600 text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
                {audioUrl && (
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setIsPlayingAudio(false)}
                    className="hidden"
                  />
                )}
                {isRecording && (
                  <div className="flex items-center text-red-500 text-sm">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                    Recording...
                  </div>
                )}
              </div>

              {/* Video Upload */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <h4 className="font-medium mb-3 dark:text-white">Product Video</h4>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                  id="video-upload"
                />
                <label htmlFor="video-upload">
                  <Button type="button" variant="outline" className="w-full dark:border-gray-600" asChild>
                    <span>
                      <Video className="w-4 h-4 mr-2" />
                      Upload Product Video
                    </span>
                  </Button>
                </label>
                {videoPreview && (
                  <div className="mt-3">
                    <video
                      src={videoPreview}
                      controls
                      className="w-full h-32 object-cover rounded"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setVideoFile(null);
                        setVideoPreview(null);
                      }}
                      className="mt-2 text-red-500 dark:border-gray-600"
                    >
                      Remove Video
                    </Button>
                  </div>
                )}
              </div>

              {/* Image Upload */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <h4 className="font-medium mb-3 dark:text-white">Product Images</h4>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload">
                  <Button type="button" variant="outline" className="w-full dark:border-gray-600" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Product Images
                    </span>
                  </Button>
                </label>
                {imagePreviews.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Product ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
              <Save className="w-4 h-4 mr-2" />
              {initialData ? 'Update Product' : 'Save Product'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="dark:border-gray-600">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EnhancedProductForm;
