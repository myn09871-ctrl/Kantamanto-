
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Users, Store, ShoppingCart, DollarSign, TrendingUp, Package } from "lucide-react";

interface Analytics {
  totalCustomers: number;
  totalVendors: number;
  pendingVendors: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: any[];
  recentVendorApplications: any[];
}

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState<Analytics>({
    totalCustomers: 0,
    totalVendors: 0,
    pendingVendors: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: [],
    recentVendorApplications: []
  });
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      console.log('Fetching admin analytics...');
      
      // Fetch customer count
      const { count: customerCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer');

      // Fetch vendor count and pending applications
      const { data: vendorData, count: vendorCount } = await supabase
        .from('vendors')
        .select('*', { count: 'exact' });

      const pendingVendors = vendorData?.filter(v => v.status === 'pending').length || 0;

      // Fetch product count
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch orders data
      const { data: ordersData, count: orderCount } = await supabase
        .from('orders')
        .select(`
          *,
          profiles!orders_customer_id_fkey (
            full_name,
            email
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // Calculate total revenue - fix the TypeScript error by ensuring proper type conversion
      const totalRevenue = ordersData?.reduce((sum, order) => {
        const amount = parseFloat(order.total_amount?.toString() || '0');
        return sum + amount;
      }, 0) || 0;

      // Get recent orders (last 10)
      const recentOrders = ordersData?.slice(0, 10) || [];

      // Get recent vendor applications
      const { data: recentApplications } = await supabase
        .from('vendors')
        .select(`
          *,
          profiles!vendors_user_id_fkey (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      setAnalytics({
        totalCustomers: customerCount || 0,
        totalVendors: vendorCount || 0,
        pendingVendors,
        totalProducts: productCount || 0,
        totalOrders: orderCount || 0,
        totalRevenue,
        recentOrders,
        recentVendorApplications: recentApplications || []
      });

      console.log('Analytics data updated:', {
        totalCustomers: customerCount,
        totalVendors: vendorCount,
        pendingVendors,
        totalProducts: productCount,
        totalOrders: orderCount,
        totalRevenue
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();

    // Set up real-time subscriptions
    const ordersChannel = supabase
      .channel('orders-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders' 
        }, 
        (payload) => {
          console.log('Orders table changed:', payload);
          fetchAnalytics();
        }
      )
      .subscribe();

    const vendorsChannel = supabase
      .channel('vendors-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'vendors' 
        }, 
        (payload) => {
          console.log('Vendors table changed:', payload);
          fetchAnalytics();
        }
      )
      .subscribe();

    const productsChannel = supabase
      .channel('products-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'products' 
        }, 
        (payload) => {
          console.log('Products table changed:', payload);
          fetchAnalytics();
        }
      )
      .subscribe();

    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles' 
        }, 
        (payload) => {
          console.log('Profiles table changed:', payload);
          fetchAnalytics();
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(vendorsChannel);
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              Active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalVendors}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.pendingVendors > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {analytics.pendingVendors} pending
                </Badge>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Active listings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalOrders}</div>
            <p className="text-xs text-muted-foreground">All time orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₵{analytics.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Platform revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Vendors</CardTitle>
            <Store className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{analytics.pendingVendors}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.recentOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No orders yet</p>
              ) : (
                analytics.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">
                        {order.profiles?.full_name || 'Unknown Customer'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Order #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">₵{parseFloat(order.total_amount?.toString() || '0').toFixed(2)}</p>
                      <Badge 
                        variant={order.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Vendor Applications */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Vendor Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.recentVendorApplications.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No applications yet</p>
              ) : (
                analytics.recentVendorApplications.map((vendor) => (
                  <div key={vendor.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{vendor.shop_name}</p>
                      <p className="text-sm text-gray-600">
                        {vendor.profiles?.full_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(vendor.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        vendor.status === 'approved' ? 'default' : 
                        vendor.status === 'pending' ? 'secondary' : 'destructive'
                      }
                    >
                      {vendor.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
