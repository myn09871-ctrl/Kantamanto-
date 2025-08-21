
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart, Play, Pause } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import StartConversation from "@/components/chat/StartConversation";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  image_url: string;
  audio_url?: string;
  video_url?: string;
  vendor_id: string;
  vendor: {
    shop_name: string;
  };
}

const ProductDetails = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const { addToCart } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          vendors!inner (
            shop_name
          )
        `)
        .eq('id', productId)
        .single();

      if (error) throw error;

      const transformedProduct = {
        ...data,
        vendor: {
          shop_name: data.vendors.shop_name
        }
      };

      setProduct(transformedProduct);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: "Error",
        description: "Failed to fetch product details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (product?.audio_url) {
      const audio = new Audio(product.audio_url);
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
        audio.onended = () => setIsPlaying(false);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleAddToCart = async () => {
    if (product) {
      await addToCart(product.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Product not found</h2>
          <Link to="/shop">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Shop
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/shop" className="inline-flex items-center text-primary hover:text-primary/80 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Shop
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-96 object-cover rounded-lg"
            />
          </div>

          <div>
            <Link to={`/vendor/${product.vendor_id}`} className="text-primary hover:text-primary/80">
              <p className="text-sm mb-2">by {product.vendor.shop_name}</p>
            </Link>
            <h1 className="text-3xl font-bold text-foreground mb-4">{product.name}</h1>
            <p className="text-muted-foreground mb-6">{product.description}</p>
            <p className="text-3xl font-bold text-primary mb-6">₵{product.price.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mb-6">Stock: {product.stock_quantity}</p>

            {product.audio_url && (
              <Button variant="outline" onClick={togglePlay} className="mb-4 w-full">
                {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isPlaying ? 'Pause Audio' : 'Play Audio'}
              </Button>
            )}

            {product.video_url && (
              <a href={product.video_url} target="_blank" rel="noopener noreferrer" className="mb-4 block">
                <Button variant="outline" className="w-full">
                  Watch Video
                </Button>
              </a>
            )}

            <div className="space-y-4">
              <Button 
                onClick={handleAddToCart}
                className="w-full bg-primary hover:bg-primary/90"
                disabled={product.stock_quantity === 0}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              
              <StartConversation 
                vendorId={product.vendor_id} 
                productId={product.id}
                productName={product.name}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
