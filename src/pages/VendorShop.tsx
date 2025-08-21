
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, MapPin } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ProductCard from "@/components/shop/ProductCard";
import StartConversation from "@/components/chat/StartConversation";
import VendorLocationMap from "@/components/maps/VendorLocationMap";

interface Vendor {
  id: string;
  shop_name: string;
  description: string;
  location: string;
  profile_picture_url: string;
}

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
    profile_picture_url?: string;
  };
}

const VendorShop = () => {
  const { vendorId } = useParams();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    if (vendorId) {
      fetchVendorAndProducts();
    }
  }, [vendorId]);

  const fetchVendorAndProducts = async () => {
    try {
      setLoading(true);
      
      // Fetch vendor details
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id, shop_name, description, location, profile_picture_url')
        .eq('id', vendorId)
        .single();

      if (vendorError) throw vendorError;
      setVendor(vendorData);

      // Fetch vendor's products
      const { data: productsData, error: productsError } = await supabase
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
          vendor_id,
          vendors!inner (
            shop_name,
            profile_picture_url
          )
        `)
        .eq('vendor_id', vendorId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      const transformedProducts = productsData?.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        stock_quantity: item.stock_quantity,
        image_url: item.image_url,
        audio_url: item.audio_url,
        video_url: item.video_url,
        vendor_id: item.vendor_id,
        vendor: {
          shop_name: item.vendors.shop_name,
          profile_picture_url: item.vendors.profile_picture_url
        }
      })) || [];

      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error fetching vendor data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch vendor information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId: string) => {
    await addToCart(productId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading vendor shop...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Vendor not found</h2>
          <p className="text-muted-foreground mb-4">The vendor you're looking for doesn't exist.</p>
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
        
        {/* Vendor Header */}
        <div className="bg-card rounded-lg shadow-sm p-6 mb-8 border">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {vendor.profile_picture_url ? (
                <img
                  src={vendor.profile_picture_url}
                  alt={vendor.shop_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-muted-foreground">
                  {vendor.shop_name.charAt(0)}
                </span>
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">{vendor.shop_name}</h1>
              {vendor.description && (
                <p className="text-muted-foreground mb-3">{vendor.description}</p>
              )}
              {vendor.location && (
                <div className="flex items-center text-muted-foreground mb-3">
                  <MapPin className="w-4 h-4 mr-1" />
                  {vendor.location}
                </div>
              )}
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                  <span className="text-sm font-medium">4.8</span>
                  <span className="text-sm text-muted-foreground ml-1">(24 reviews)</span>
                </div>
                <Badge variant="secondary">{products.length} Products</Badge>
              </div>
            </div>
            
            <StartConversation 
              vendorId={vendor.id} 
              vendorName={vendor.shop_name}
              vendorImage={vendor.profile_picture_url}
            />
          </div>
        </div>

        {/* Location Map */}
        {vendor.location && (
          <VendorLocationMap
            vendorName={vendor.shop_name}
            location={vendor.location}
            className="mb-8"
          />
        )}

        {/* Products Grid */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">Products</h2>
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">This vendor hasn't added any products yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorShop;
