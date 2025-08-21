
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import PaymentReceipt from "@/components/payment/PaymentReceipt";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

const PaymentSuccess = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  const [orderData, setOrderData] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId || !user) {
      navigate('/');
      return;
    }

    fetchReceiptData();
  }, [orderId, user]);

  const fetchReceiptData = async () => {
    try {
      // Fetch order data
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('customer_id', user?.id)
        .single();

      if (orderError) throw orderError;
      setOrderData(order);

      // Fetch payment data
      const { data: payment } = await supabase
        .from('mobile_money_payments')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();

      if (payment) setPaymentData(payment);

      // Fetch order items with product details
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products (
            name,
            vendors (shop_name)
          )
        `)
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;
      
      const formattedItems = items?.map(item => ({
        product: {
          name: item.products.name,
          vendor: { shop_name: item.products.vendors.shop_name }
        },
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      })) || [];

      setOrderItems(formattedItems);

      // Fetch customer name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single();

      setCustomerName(profile?.full_name || 'Customer');

    } catch (error) {
      console.error('Error fetching receipt data:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your receipt...</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Receipt not found</p>
          <Button onClick={() => navigate('/')}>Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => navigate('/customer')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          
          <Button 
            onClick={() => navigate('/')}
            className="bg-orange-500 hover:bg-orange-600 flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Continue Shopping
          </Button>
        </div>

        <PaymentReceipt
          orderData={orderData}
          paymentData={paymentData}
          orderItems={orderItems}
          customerName={customerName}
        />
      </div>
    </div>
  );
};

export default PaymentSuccess;
