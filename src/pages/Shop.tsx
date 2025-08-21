
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Star, ShoppingCart, Play, Pause, Volume2, Video } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useRef } from "react";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  description: string;
  category_id: string;
  vendor_id: string;
  audio_url?: string;
  video_url?: string;
  vendor: {
    shop_name: string;
  };
  categories: {
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
}

const Shop = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const { addToCart } = useCart();
  const { toast } = useToast();
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          image_url,
          description,
          category_id,
          vendor_id,
          audio_url,
          video_url,
          vendors!inner (
            shop_name
          ),
          categories (
            name
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedProducts = data?.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        image_url: item.image_url,
        description: item.description,
        category_id: item.category_id,
        vendor_id: item.vendor_id,
        audio_url: item.audio_url,
        video_url: item.video_url,
        vendor: {
          shop_name: item.vendors.shop_name
        },
        categories: item.categories ? {
          name: item.categories.name
        } : { name: 'Uncategorized' }
      })) || [];

      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.vendor.shop_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = async (productId: string, productName: string) => {
    await addToCart(productId);
  };

  const toggleAudio = (productId: string, audioUrl: string) => {
    // Stop any playing video
    if (playingVideo) {
      const videoElement = videoRefs.current[playingVideo];
      if (videoElement) {
        videoElement.pause();
      }
      setPlayingVideo(null);
    }

    if (playingAudio === productId) {
      const audioElement = audioRefs.current[productId];
      if (audioElement) {
        audioElement.pause();
      }
      setPlayingAudio(null);
    } else {
      // Stop any other playing audio
      if (playingAudio) {
        const currentAudio = audioRefs.current[playingAudio];
        if (currentAudio) {
          currentAudio.pause();
        }
      }

      const audioElement = audioRefs.current[productId];
      if (audioElement) {
        audioElement.play();
        setPlayingAudio(productId);
      }
    }
  };

  const toggleVideo = (productId: string) => {
    // Stop any playing audio
    if (playingAudio) {
      const audioElement = audioRefs.current[playingAudio];
      if (audioElement) {
        audioElement.pause();
      }
      setPlayingAudio(null);
    }

    if (playingVideo === productId) {
      const videoElement = videoRefs.current[productId];
      if (videoElement) {
        videoElement.pause();
      }
      setPlayingVideo(null);
    } else {
      // Stop any other playing video
      if (playingVideo) {
        const currentVideo = videoRefs.current[playingVideo];
        if (currentVideo) {
          currentVideo.pause();
        }
      }

      const videoElement = videoRefs.current[productId];
      if (videoElement) {
        videoElement.play();
        setPlayingVideo(productId);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Shop Products</h1>
          <p className="text-muted-foreground">Discover amazing products from Kantamanto Market vendors</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-card rounded-lg shadow-sm p-6 mb-8 border">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search products or vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="lg:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <Button variant="outline" className="lg:w-auto">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-card rounded-lg shadow-sm overflow-hidden border hover:shadow-md transition-shadow duration-200 group">
              {/* Product Image */}
              <div className="aspect-square bg-muted overflow-hidden">
                <Link to={`/product/${product.id}`}>
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </Link>
              </div>

              {/* Product Info */}
              <div className="p-3 space-y-2">
                <Link to={`/product/${product.id}`}>
                  <h3 className="font-medium text-foreground text-sm line-clamp-2 hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                </Link>
                
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs text-muted-foreground">4.5</span>
                </div>

                <Link 
                  to={`/vendor/${product.vendor_id}`}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors block"
                >
                  by {product.vendor.shop_name}
                </Link>

                {/* Audio Player */}
                {product.audio_url && (
                  <div className="flex items-center space-x-2 py-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAudio(product.id, product.audio_url!)}
                      className="h-6 px-2 text-xs"
                    >
                      {playingAudio === product.id ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Volume2 className="w-3 h-3" />
                      )}
                    </Button>
                    <audio
                      ref={(el) => {
                        if (el) audioRefs.current[product.id] = el;
                      }}
                      src={product.audio_url}
                      onEnded={() => setPlayingAudio(null)}
                      style={{ display: 'none' }}
                    />
                  </div>
                )}

                {/* Video Player */}
                {product.video_url && (
                  <div className="py-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleVideo(product.id)}
                      className="h-6 px-2 text-xs mb-1"
                    >
                      <Video className="w-3 h-3 mr-1" />
                      {playingVideo === product.id ? "Pause" : "Play"}
                    </Button>
                    {playingVideo === product.id && (
                      <video
                        ref={(el) => {
                          if (el) videoRefs.current[product.id] = el;
                        }}
                        src={product.video_url}
                        onEnded={() => setPlayingVideo(null)}
                        className="w-full rounded max-h-24"
                        controls
                        autoPlay
                      />
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-bold text-primary">₵{product.price.toFixed(2)}</span>
                  <Button 
                    size="sm" 
                    className="h-7 px-2 text-xs bg-primary hover:bg-primary/90"
                    onClick={() => handleAddToCart(product.id, product.name)}
                  >
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No products found</h3>
            <p className="text-muted-foreground">Try adjusting your search terms or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
