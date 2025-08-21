
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Play, Pause } from "lucide-react";
import { useState } from "react";
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
  vendor?: {
    shop_name: string;
    profile_picture_url?: string;
  };
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => Promise<void>;
}

const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audio = new Audio(product.audio_url);

  const togglePlay = () => {
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  audio.onended = () => {
    setIsPlaying(false);
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-64 object-cover rounded-md group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      
      <CardContent className="p-4">
        <Link to={`/vendor/${product.vendor_id}`} className="hover:text-primary">
          <p className="text-sm text-muted-foreground mb-2">
            by {product.vendor?.shop_name || 'Unknown Vendor'}
          </p>
        </Link>
        
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.name}</h3>
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
          {product.description}
        </p>
        
        {product.audio_url && (
          <Button variant="outline" size="sm" onClick={togglePlay} className="mb-3 w-full">
            {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isPlaying ? 'Pause Audio' : 'Play Audio'}
          </Button>
        )}

        {product.video_url && (
          <a href={product.video_url} target="_blank" rel="noopener noreferrer" className="mb-3 block">
            <Button variant="outline" size="sm" className="w-full">
              Watch Video
            </Button>
          </a>
        )}
        
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-primary">₵{product.price.toFixed(2)}</span>
          <span className="text-sm text-muted-foreground">
            Stock: {product.stock_quantity}
          </span>
        </div>
        
        <div className="space-y-2">
          <Button 
            onClick={() => onAddToCart(product.id)}
            className="w-full bg-primary hover:bg-primary/90"
            disabled={product.stock_quantity === 0}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Button>
          
          <StartConversation 
            vendorId={product.vendor_id} 
            vendorName={product.vendor?.shop_name}
            vendorImage={product.vendor?.profile_picture_url}
            productId={product.id}
            productName={product.name}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
