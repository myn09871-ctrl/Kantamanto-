
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Edit, Trash2, Upload, Package, Mic, Play, Pause, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import VideoRecorder from "./VideoRecorder";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  image_url: string;
  audio_url: string;
  video_url: string;
  is_active: boolean;
  category_id: string;
  categories?: { name: string };
}

interface Category {
  id: string;
  name: string;
}

const ProductManagement = ({ showAddForm = false }: { showAddForm?: boolean }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingProduct, setIsAddingProduct] = useState(showAddForm);
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [productImages, setProductImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    category_id: '',
    image_url: '',
    audio_url: '',
    video_url: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [user]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    setCategories(data || []);
  };

  const fetchProducts = async () => {
    try {
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!vendorData) return;

      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          price,
          stock_quantity,
          image_url,
          audio_url,
          video_url,
          is_active,
          category_id,
          created_at,
          updated_at,
          vendor_id,
          categories (name)
        `)
        .eq('vendor_id', vendorData.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
      } else {
        const productsWithDefaults = (data || []).map(product => ({
          id: product.id,
          name: product.name,
          description: product.description || '',
          price: product.price,
          stock_quantity: product.stock_quantity || 0,
          image_url: product.image_url || '',
          audio_url: product.audio_url || '',
          video_url: product.video_url || '',
          is_active: product.is_active,
          category_id: product.category_id || '',
          categories: product.categories
        }));
        setProducts(productsWithDefaults);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File, folder: string) => {
    try {
      console.log(`Uploading ${folder} file:`, file.name, file.size);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('vendor-documents')
        .upload(`${folder}/${fileName}`, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error(`Upload error for ${folder}:`, error);
        throw error;
      }

      console.log(`Upload successful for ${folder}:`, data);

      const { data: { publicUrl } } = supabase.storage
        .from('vendor-documents')
        .getPublicUrl(data.path);

      console.log(`Public URL for ${folder}:`, publicUrl);
      return publicUrl;
    } catch (error) {
      console.error(`Error uploading ${folder}:`, error);
      throw error;
    }
  };

  const blobToFile = (blob: Blob, fileName: string): File => {
    return new File([blob], fileName, {
      type: blob.type,
      lastModified: Date.now(),
    });
  };

  const startAudioRecording = async () => {
    try {
      console.log('Starting audio recording...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      console.log('Audio stream acquired');
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          console.log('Audio chunk received:', event.data.size);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('Audio recording stopped, creating blob...');
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        console.log('Audio blob created:', blob.size, 'bytes');
        
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('Audio track stopped');
        });
      };

      mediaRecorder.onerror = (event) => {
        console.error('Audio recording error:', event);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      console.log('Audio recording started');
    } catch (error) {
      console.error('Error starting audio recording:', error);
      toast({
        title: "Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('Stopping audio recording...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    console.log('Images selected:', files.length);
    setProductImages(files);
  };

  const handleVideoRecorded = (blob: Blob, url: string) => {
    console.log('Video recorded:', blob.size, 'bytes');
    setVideoBlob(blob);
    setVideoUrl(url);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    if (!newProduct.name || !newProduct.price) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (name and price)",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Starting product creation process...');
      
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!vendorData) {
        toast({
          title: "Error",
          description: "Vendor profile not found",
          variant: "destructive"
        });
        return;
      }

      let imageUrl = newProduct.image_url;
      let audioUrl = newProduct.audio_url;
      let videoUrl = newProduct.video_url;
      
      // Upload files sequentially to avoid overwhelming the system
      if (productImages.length > 0) {
        console.log('Uploading product image...');
        try {
          imageUrl = await uploadFile(productImages[0], 'product-images');
          console.log('Image uploaded successfully:', imageUrl);
        } catch (error) {
          console.error('Image upload failed:', error);
          toast({
            title: "Upload Error",
            description: "Failed to upload product image. Please try again.",
            variant: "destructive"
          });
          return;
        }
      }

      if (audioBlob) {
        console.log('Uploading audio file...');
        try {
          const audioFile = blobToFile(audioBlob, `audio-${Date.now()}.webm`);
          audioUrl = await uploadFile(audioFile, 'product-audio');
          console.log('Audio uploaded successfully:', audioUrl);
        } catch (error) {
          console.error('Audio upload failed:', error);
          toast({
            title: "Upload Error",
            description: "Failed to upload audio file. Please try again.",
            variant: "destructive"
          });
          return;
        }
      }

      if (videoBlob) {
        console.log('Uploading video file...');
        try {
          const videoFile = blobToFile(videoBlob, `video-${Date.now()}.webm`);
          videoUrl = await uploadFile(videoFile, 'product-videos');
          console.log('Video uploaded successfully:', videoUrl);
        } catch (error) {
          console.error('Video upload failed:', error);
          toast({
            title: "Upload Error",
            description: "Failed to upload video file. Please try again.",
            variant: "destructive"
          });
          return;
        }
      }

      console.log('Creating product with URLs:', { imageUrl, audioUrl, videoUrl });

      const productData = {
        vendor_id: vendorData.id,
        name: newProduct.name.trim(),
        description: newProduct.description.trim() || null,
        price: parseFloat(newProduct.price),
        stock_quantity: parseInt(newProduct.stock_quantity) || 0,
        category_id: newProduct.category_id || null,
        image_url: imageUrl || null,
        audio_url: audioUrl || null,
        video_url: videoUrl || null,
        is_active: true
      };

      console.log('Inserting product data:', productData);

      const { error } = await supabase
        .from('products')
        .insert(productData);

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      toast({
        title: "Success! 🎉",
        description: "Your product has been added successfully"
      });

      // Reset form
      setNewProduct({
        name: '',
        description: '',
        price: '',
        stock_quantity: '',
        category_id: '',
        image_url: '',
        audio_url: '',
        video_url: ''
      });
      setAudioBlob(null);
      setVideoBlob(null);
      setAudioUrl("");
      setVideoUrl("");
      setProductImages([]);

      setIsAddingProduct(false);
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Product Updated",
        description: `Product ${!currentStatus ? 'activated' : 'deactivated'} successfully`
      });

      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive"
      });
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Product Deleted",
        description: "Product has been permanently deleted"
      });

      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Loading products...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {isAddingProduct ? (
        <Card>
          <CardHeader>
            <CardTitle>Add New Product</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddProduct} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Input
                    placeholder="Product Name *"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                  <Textarea
                    placeholder="Product Description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                  />
                  <Input
                    placeholder="Price (₵) *"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                    required
                  />
                  <Input
                    placeholder="Stock Quantity"
                    type="number"
                    min="0"
                    value={newProduct.stock_quantity}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, stock_quantity: e.target.value }))}
                  />
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    value={newProduct.category_id}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, category_id: e.target.value }))}
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-4">
                  {/* Image Upload */}
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                    <h4 className="font-medium mb-2 dark:text-white">Product Images</h4>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                    />
                    {productImages.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {productImages.map((file, index) => (
                          <img
                            key={index}
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index}`}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Audio Recording */}
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                    <h4 className="font-medium mb-2 dark:text-white">Product Audio Description</h4>
                    <div className="flex items-center space-x-2 mb-3">
                      {!isRecording ? (
                        <Button type="button" variant="outline" onClick={startAudioRecording}>
                          <Mic className="w-4 h-4 mr-2" />
                          Start Recording
                        </Button>
                      ) : (
                        <Button type="button" variant="destructive" onClick={stopAudioRecording}>
                          <Pause className="w-4 h-4 mr-2" />
                          Stop Recording
                        </Button>
                      )}
                      {isRecording && (
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-sm text-red-600">Recording...</span>
                        </div>
                      )}
                    </div>
                    {audioUrl && (
                      <div className="mt-3">
                        <p className="text-sm text-green-600 dark:text-green-400 mb-2">Audio ready!</p>
                        <audio ref={audioRef} controls className="w-full" src={audioUrl}>
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Video Recording Component */}
              <VideoRecorder
                onVideoRecorded={handleVideoRecorded}
                isRecording={isVideoRecording}
                onStartRecording={() => setIsVideoRecording(true)}
                onStopRecording={() => setIsVideoRecording(false)}
              />
              
              <div className="flex space-x-4">
                <Button 
                  type="submit" 
                  className="bg-orange-500 hover:bg-orange-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding Product..." : "Add Product"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddingProduct(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="dark:text-white">Product Listings</CardTitle>
            <Button 
              className="bg-orange-500 hover:bg-orange-600"
              onClick={() => setIsAddingProduct(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No products yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Start by adding your first product</p>
                <Button 
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={() => setIsAddingProduct(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Product
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold dark:text-white">{product.name}</h3>
                        <p className="text-gray-600 dark:text-gray-400">₵{product.price}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                          <span>Stock: {product.stock_quantity}</span>
                          {product.categories && (
                            <span>• {product.categories.name}</span>
                          )}
                          {product.audio_url && (
                            <span>• Has Audio</span>
                          )}
                          {product.video_url && (
                            <span>• Has Video</span>
                          )}
                        </div>
                        {product.audio_url && (
                          <audio controls className="mt-2 w-64">
                            <source src={product.audio_url} type="audio/webm" />
                          </audio>
                        )}
                        {product.video_url && (
                          <video controls className="mt-2 max-w-xs max-h-32">
                            <source src={product.video_url} type="video/webm" />
                          </video>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={product.is_active ? "text-green-600" : "text-red-600"}
                      >
                        {product.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleProductStatus(product.id, product.is_active)}
                        className={product.is_active ? "text-yellow-500" : "text-green-500"}
                      >
                        {product.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center">
                              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                              Delete Product
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to permanently delete "{product.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteProduct(product.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete Permanently
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default ProductManagement;
