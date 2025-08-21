
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, Users, TrendingUp, ShoppingCart, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  pendingOrders: number;
  totalConversations: number;
}

const VendorStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    totalConversations: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Get vendor ID
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!vendorData) return;

      const vendorId = vendorData.id;

      // Fetch all stats in parallel
      const [
        productsResult,
        ordersResult,
        revenueResult,
        pendingOrdersResult,
        conversationsResult
      ] = await Promise.all([
        // Total products
        supabase
          .from('products')
          .select('id', { count: 'exact' })
          .eq('vendor_id', vendorId),

        // Total orders
        supabase
          .from('order_items')
          .select('id', { count: 'exact' })
          .eq('vendor_id', vendorId),

        // Total revenue
        supabase
          .from('order_items')
          .select('total_price')
          .eq('vendor_id', vendorId),

        // Pending orders
        supabase
          .from('order_items')
          .select(`
            id,
            orders!inner(status)
          `)
          .eq('vendor_id', vendorId)
          .eq('orders.status', 'pending'),

        // Total conversations
        supabase
          .from('conversations')
          .select('id', { count: 'exact' })
          .eq('vendor_id', vendorId)
      ]);

      // Calculate revenue
      const totalRevenue = revenueResult.data?.reduce((sum, item) => sum + Number(item.total_price), 0) || 0;

      // Get unique customers from order items
      const { data: orderItemsWithOrders } = await supabase
        .from('order_items')
        .select(`
          id,
          orders(customer_id)
        `)
        .eq('vendor_id', vendorId);
      
      const uniqueCustomers = new Set();
      orderItemsWithOrders?.forEach(item => {
        if (item.orders && 'customer_id' in item.orders) {
          uniqueCustomers.add(item.orders.customer_id);
        }
      });

      setStats({
        totalProducts: productsResult.count || 0,
        totalOrders: ordersResult.count || 0,
        totalRevenue,
        totalCustomers: uniqueCustomers.size,
        pendingOrders: pendingOrdersResult.data?.length || 0,
        totalConversations: conversationsResult.count || 0
      });

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: "Total Revenue",
      value: loading ? "..." : `₵${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Total Products",
      value: loading ? "..." : stats.totalProducts.toString(),
      icon: Package,
      color: "text-blue-600"
    },
    {
      title: "Total Orders",
      value: loading ? "..." : stats.totalOrders.toString(),
      icon: ShoppingCart,
      color: "text-purple-600"
    },
    {
      title: "Unique Customers",
      value: loading ? "..." : stats.totalCustomers.toString(),
      icon: Users,
      color: "text-orange-600"
    },
    {
      title: "Pending Orders",
      value: loading ? "..." : stats.pendingOrders.toString(),
      icon: TrendingUp,
      color: "text-yellow-600"
    },
    {
      title: "Conversations",
      value: loading ? "..." : stats.totalConversations.toString(),
      icon: MessageCircle,
      color: "text-pink-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {statsCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-200">
                {stat.title}
              </CardTitle>
              <IconComponent className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default VendorStats;
