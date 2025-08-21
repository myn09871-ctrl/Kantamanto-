
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string;
    vendor_id: string;
    vendor: {
      shop_name: string;
    };
  };
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refetch: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCartItems = async () => {
    if (!user) {
      console.log('No user, clearing cart');
      setCartItems([]);
      return;
    }

    try {
      console.log('Fetching cart items for user:', user.id);
      setLoading(true);
      
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          quantity,
          products!inner (
            id,
            name,
            price,
            image_url,
            vendor_id,
            vendors!inner (
              shop_name
            )
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching cart items:', error);
        throw error;
      }

      console.log('Raw cart data:', data);

      const formattedItems = data?.map(item => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        product: {
          id: item.products.id,
          name: item.products.name,
          price: item.products.price,
          image_url: item.products.image_url,
          vendor_id: item.products.vendor_id,
          vendor: {
            shop_name: item.products.vendors.shop_name
          }
        }
      })) || [];

      console.log('Formatted cart items:', formattedItems);
      setCartItems(formattedItems);
    } catch (error) {
      console.error('Error fetching cart items:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to be logged in to add items to cart",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Adding to cart:', { productId, quantity, userId: user.id });
      
      // Check if item already exists in cart
      const existingItem = cartItems.find(item => item.product_id === productId);
      
      if (existingItem) {
        console.log('Item exists, updating quantity');
        await updateQuantity(productId, existingItem.quantity + quantity);
        return;
      }

      const { error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: productId,
          quantity
        });

      if (error) {
        console.error('Error adding to cart:', error);
        throw error;
      }

      console.log('Item added to cart successfully');
      await fetchCartItems();
      toast({
        title: "Added to cart",
        description: "Item has been added to your cart"
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive"
      });
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) return;

    try {
      console.log('Updating quantity:', { productId, quantity });
      
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) {
        console.error('Error updating quantity:', error);
        throw error;
      }

      await fetchCartItems();
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive"
      });
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!user) return;

    try {
      console.log('Removing from cart:', productId);
      
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) {
        console.error('Error removing from cart:', error);
        throw error;
      }

      await fetchCartItems();
      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart"
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive"
      });
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast({
        title: "Error",
        description: "Failed to clear cart",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      console.log('User changed, fetching cart items');
      fetchCartItems();

      // Set up real-time subscription for cart updates
      const cartChannel = supabase
        .channel('cart-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'cart_items',
            filter: `user_id=eq.${user.id}`
          }, 
          (payload) => {
            console.log('Cart changed:', payload);
            fetchCartItems();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(cartChannel);
      };
    } else {
      console.log('No user, clearing cart');
      setCartItems([]);
    }
  }, [user]);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const value = {
    cartItems,
    cartCount,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refetch: fetchCartItems
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
