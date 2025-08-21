import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Package, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type OrderStatus = "pending" | "accepted" | "shipped" | "delivered" | "cancelled";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  orders: {
    id: string;
    status: OrderStatus;
    created_at: string;
    delivery_address: string;
    phone_number: string;
    profiles: {
      full_name: string;
    };
  };
  products: {
    name: string;
    image_url: string;
  };
}

const OrderManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
      setupRealtimeSubscription();
    }
  }, [user]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('order-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Order updated:', payload);
          fetchOrders(); // Refresh orders when any order is updated
          toast({
            title: "Order Updated",
            description: "Order status has been updated.",
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_items'
        },
        (payload) => {
          console.log('New order item:', payload);
          fetchOrders(); // Refresh orders when new order items are added
          toast({
            title: "New Order",
            description: "You have received a new order!",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchOrders = async () => {
    try {
      // Get vendor ID first
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!vendorData) return;

      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          orders (
            id,
            status,
            created_at,
            delivery_address,
            phone_number,
            customer_id
          ),
          products (
            name,
            image_url
          )
        `)
        .eq('vendor_id', vendorData.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

      // Fetch customer names
      const orderItemsWithCustomers = await Promise.all(
        (data || []).map(async (item) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', item.orders.customer_id)
            .single();

          return {
            ...item,
            orders: {
              ...item.orders,
              profiles: profileData || { full_name: 'Unknown Customer' }
            }
          };
        })
      );

      setOrders(orderItemsWithCustomers);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Order status updated to ${newStatus}`,
      });

      // Orders will be refreshed via realtime subscription
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'accepted': return 'text-blue-600 bg-blue-100';
      case 'shipped': return 'text-purple-600 bg-purple-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Loading orders...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders (Live Updates)</CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600">Orders will appear here when customers make purchases</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((orderItem) => (
              <div key={orderItem.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      {orderItem.products?.image_url ? (
                        <img
                          src={orderItem.products.image_url}
                          alt={orderItem.products.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{orderItem.products?.name}</h3>
                      <p className="text-sm text-gray-600">
                        <User className="w-4 h-4 inline mr-1" />
                        {orderItem.orders.profiles?.full_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Qty: {orderItem.quantity} × ₵{orderItem.unit_price} = ₵{orderItem.total_price}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge className={getStatusColor(orderItem.orders.status)}>
                      {orderItem.orders.status}
                    </Badge>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(orderItem.orders.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded mb-3">
                  <p className="text-sm"><strong>Delivery:</strong> {orderItem.orders.delivery_address}</p>
                  <p className="text-sm"><strong>Phone:</strong> {orderItem.orders.phone_number}</p>
                </div>

                {orderItem.orders.status === 'pending' && (
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      className="bg-green-500 hover:bg-green-600"
                      onClick={() => updateOrderStatus(orderItem.orders.id, 'accepted')}
                    >
                      Accept Order
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => updateOrderStatus(orderItem.orders.id, 'cancelled')}
                    >
                      Decline
                    </Button>
                  </div>
                )}

                {orderItem.orders.status === 'accepted' && (
                  <Button 
                    size="sm" 
                    className="bg-blue-500 hover:bg-blue-600"
                    onClick={() => updateOrderStatus(orderItem.orders.id, 'shipped')}
                  >
                    Mark as Shipped
                  </Button>
                )}

                {orderItem.orders.status === 'shipped' && (
                  <Button 
                    size="sm" 
                    className="bg-green-500 hover:bg-green-600"
                    onClick={() => updateOrderStatus(orderItem.orders.id, 'delivered')}
                  >
                    Mark as Delivered
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderManagement;
