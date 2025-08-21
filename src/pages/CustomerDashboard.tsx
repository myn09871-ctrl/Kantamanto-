
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Package, Heart, User, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  order_items?: {
    quantity: number;
    unit_price: number;
    products: {
      name: string;
      image_url: string;
    };
    vendors: {
      shop_name: string;
    };
  }[];
}

const CustomerDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, updateProfile, loading: profileLoading } = useProfile();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Simplified query to avoid the policy recursion issue
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          total_amount,
          created_at
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
      } else {
        setOrders(data || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-600';
      case 'shipped': return 'text-blue-600';
      case 'accepted': return 'text-orange-600';
      case 'pending': return 'text-yellow-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const updates = {
      full_name: formData.get('fullName') as string,
      phone_number: formData.get('phoneNumber') as string,
    };

    await updateProfile(updates);
  };

  // All hooks have been called above, now we can do conditional returns
  
  // Redirect to auth if not logged in
  if (!authLoading && !user) {
    return <Navigate to="/auth?type=customer" replace />;
  }

  // Redirect to vendor auth if user is a vendor
  if (!profileLoading && profile && profile.role === 'vendor') {
    return <Navigate to="/vendor" replace />;
  }

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Account</h1>
          <p className="text-gray-600 dark:text-gray-300">Welcome back, {profile?.full_name || 'Customer'}!</p>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="dark:bg-gray-800">
            <TabsTrigger value="orders" className="dark:text-gray-300">My Orders</TabsTrigger>
            <TabsTrigger value="profile" className="dark:text-gray-300">Profile Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center dark:text-gray-100">
                  <Package className="w-5 h-5 mr-2" />
                  Order History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">Loading your orders...</p>
                  </div>
                ) : orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border dark:border-gray-600 rounded-lg p-4 dark:bg-gray-750">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold dark:text-gray-100">Order #{order.id.slice(0, 8)}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge 
                            variant="outline"
                            className={`${getStatusColor(order.status)} dark:border-gray-600`}
                          >
                            {order.status}
                          </Badge>
                        </div>
                        
                        <div className="border-t dark:border-gray-600 pt-4 mt-4">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold dark:text-gray-100">Total: ₵{order.total_amount.toFixed(2)}</span>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300">
                                Track Order
                              </Button>
                              {order.status === "delivered" && (
                                <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300">
                                  Write Review
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No orders yet</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">Start shopping to see your orders here!</p>
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      Browse Products
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center dark:text-gray-100">
                    <User className="w-5 h-5 mr-2" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <Input 
                      name="fullName"
                      placeholder="Full Name" 
                      defaultValue={profile?.full_name || ''} 
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    />
                    <Input 
                      placeholder="Email" 
                      defaultValue={user?.email || ''} 
                      disabled
                      className="bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-gray-300"
                    />
                    <Input 
                      name="phoneNumber"
                      placeholder="Phone Number" 
                      defaultValue={profile?.phone_number || ''} 
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    />
                    <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
                      Update Profile
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center dark:text-gray-100">
                    <MapPin className="w-5 h-5 mr-2" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Street Address" className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
                  <Input placeholder="City" defaultValue="Accra" className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
                  <Input placeholder="Region" defaultValue="Greater Accra" className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
                  <Input placeholder="Postal Code" className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
                  <Button className="w-full bg-orange-500 hover:bg-orange-600">
                    Save Address
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CustomerDashboard;
