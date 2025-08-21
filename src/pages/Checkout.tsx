
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import EnhancedMobileMoneyPayment from "@/components/payment/EnhancedMobileMoneyPayment";
import PaymentConfirmationDialog from "@/components/payment/PaymentConfirmationDialog";

const Checkout = () => {
  const { user, loading: authLoading } = useAuth();
  const { cartItems, cartCount, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [currentOrderId, setCurrentOrderId] = useState<string>("");
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [shippingData, setShippingData] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    city: 'Accra',
    notes: ''
  });

  const [paymentMethod, setPaymentMethod] = useState<'mtn_mobile_money' | 'vodafone_cash' | 'airteltigo_money' | 'cash_on_delivery'>('mtn_mobile_money');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Authentication and cart validation
  useEffect(() => {
    if (!mounted) return;

    console.log('Checkout validation - User:', !!user, 'Auth loading:', authLoading, 'Cart count:', cartCount);

    if (!authLoading && !user) {
      console.log('User not authenticated, redirecting to login');
      navigate('/auth?type=customer', { replace: true });
      return;
    }

    if (!authLoading && user && cartCount === 0) {
      console.log('Cart is empty, redirecting to cart');
      navigate('/cart', { replace: true });
      return;
    }
  }, [mounted, authLoading, user, cartCount, navigate]);

  // Show loading state during initial load
  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or cart is empty
  if (!user || cartCount === 0) {
    return null;
  }

  console.log('Checkout rendering - User:', user?.id, 'Cart items:', cartItems.length, 'Step:', step);

  const subtotal = cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const deliveryFee = 5.00;
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to place an order",
        variant: "destructive"
      });
      return;
    }

    if (!shippingData.fullName || !shippingData.phoneNumber || !shippingData.address) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required shipping information",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Placing order for user:', user.id);
      
      const orderData = {
        customer_id: user.id,
        total_amount: total,
        payment_method: paymentMethod,
        delivery_address: `${shippingData.address}, ${shippingData.city}`,
        phone_number: shippingData.phoneNumber,
        notes: shippingData.notes,
        status: 'pending' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw orderError;
      }

      console.log('Order created successfully:', order);

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        vendor_id: item.product.vendor_id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity
      }));

      console.log('Creating order items:', orderItems);

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Order items creation error:', itemsError);
        throw itemsError;
      }

      console.log('Order items created successfully');
      setCurrentOrderId(order.id);

      // If cash on delivery, mark as confirmed and clear cart
      if (paymentMethod === 'cash_on_delivery') {
        await clearCart();
        toast({
          title: "Order Placed! 📦",
          description: "Your order has been placed successfully. You'll pay on delivery."
        });
        navigate(`/payment-success?orderId=${order.id}`, { replace: true });
      } else {
        // For mobile money, show confirmation dialog first
        setShowPaymentConfirmation(true);
      }

    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Order Failed",
        description: "Failed to place order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentConfirm = () => {
    setShowPaymentConfirmation(false);
    setStep(3);
    toast({
      title: "Processing Payment 📱",
      description: "Please check your phone for the mobile money prompt",
    });
  };

  const handlePaymentComplete = async (success: boolean, paymentData?: any) => {
    if (success) {
      await clearCart();
      toast({
        title: "Payment Successful! 🎉",
        description: "Your order has been placed and payment confirmed."
      });
      navigate(`/payment-success?orderId=${currentOrderId}`, { replace: true });
    } else {
      toast({
        title: "Payment Failed",
        description: "Payment was unsuccessful. Please try again.",
        variant: "destructive"
      });
      setStep(2);
    }
  };

  // Prepare payment details for confirmation dialog
  const paymentConfirmationDetails = {
    amount: total,
    paymentMethod: paymentMethod,
    phoneNumber: shippingData.phoneNumber,
    customerName: shippingData.fullName,
    deliveryAddress: `${shippingData.address}, ${shippingData.city}`,
    orderItems: cartItems.map(item => ({
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.price
    }))
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Secure Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your purchase safely and securely</p>
          <div className="flex items-center space-x-4 mt-4">
            <Badge variant={step >= 1 ? "default" : "outline"}>1. Review Order</Badge>
            <Badge variant={step >= 2 ? "default" : "outline"}>2. Shipping & Payment</Badge>
            <Badge variant={step >= 3 ? "default" : "outline"}>3. Payment</Badge>
          </div>
        </div>

        {step === 1 && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Order Review */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Order Review</CardTitle>
                  <p className="text-sm text-gray-600">{cartCount} item{cartCount !== 1 ? 's' : ''} in your order</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between border-b pb-4 last:border-b-0">
                      <div className="flex items-center space-x-4">
                        <img
                          src={item.product.image_url || '/placeholder.svg'}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div>
                          <h4 className="font-medium">{item.product.name}</h4>
                          <p className="text-sm text-gray-600">by {item.product.vendor?.shop_name || 'Unknown Vendor'}</p>
                          <p className="text-sm">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-semibold">₵{(item.product.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₵{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>₵{deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-orange-600">₵{total.toFixed(2)}</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    onClick={() => setStep(2)}
                  >
                    Continue to Shipping
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Shipping & Payment Form */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Full Name *"
                    value={shippingData.fullName}
                    onChange={(e) => setShippingData(prev => ({ ...prev, fullName: e.target.value }))}
                    required
                  />
                  <Input
                    placeholder="Phone Number *"
                    value={shippingData.phoneNumber}
                    onChange={(e) => setShippingData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    required
                  />
                  <Input
                    placeholder="Delivery Address *"
                    value={shippingData.address}
                    onChange={(e) => setShippingData(prev => ({ ...prev, address: e.target.value }))}
                    required
                  />
                  <Input
                    placeholder="City"
                    value={shippingData.city}
                    onChange={(e) => setShippingData(prev => ({ ...prev, city: e.target.value }))}
                  />
                  <Input
                    placeholder="Special instructions (optional)"
                    value={shippingData.notes}
                    onChange={(e) => setShippingData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={paymentMethod === 'cash_on_delivery' ? 'cash_on_delivery' : 'mobile_money'} onValueChange={(value) => {
                    if (value === 'cash_on_delivery') {
                      setPaymentMethod('cash_on_delivery');
                    } else {
                      setPaymentMethod('mtn_mobile_money');
                    }
                  }}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="mobile_money">Mobile Money</TabsTrigger>
                      <TabsTrigger value="cash_on_delivery">Cash on Delivery</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="mobile_money" className="mt-4">
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600 mb-3">Choose your mobile money provider:</p>
                        <Button
                          variant={paymentMethod === 'mtn_mobile_money' ? 'default' : 'outline'}
                          className="w-full justify-start h-12"
                          onClick={() => setPaymentMethod('mtn_mobile_money')}
                        >
                          <div className="w-4 h-4 rounded bg-yellow-500 mr-3"></div>
                          MTN Mobile Money
                        </Button>
                        <Button
                          variant={paymentMethod === 'vodafone_cash' ? 'default' : 'outline'}
                          className="w-full justify-start h-12"
                          onClick={() => setPaymentMethod('vodafone_cash')}
                        >
                          <div className="w-4 h-4 rounded bg-red-500 mr-3"></div>
                          Vodafone Cash
                        </Button>
                        <Button
                          variant={paymentMethod === 'airteltigo_money' ? 'default' : 'outline'}
                          className="w-full justify-start h-12"
                          onClick={() => setPaymentMethod('airteltigo_money')}
                        >
                          <div className="w-4 h-4 rounded bg-blue-500 mr-3"></div>
                          AirtelTigo Money
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="cash_on_delivery" className="mt-4">
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="font-medium text-green-800 mb-2">Cash on Delivery</h4>
                        <p className="text-sm text-green-700">
                          Pay with cash when your order is delivered to your doorstep. 
                          Our delivery partner will collect ₵{total.toFixed(2)} upon delivery.
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₵{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>₵{deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-orange-600">₵{total.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button 
                      className="w-full bg-orange-500 hover:bg-orange-600 h-12"
                      onClick={handlePlaceOrder}
                      disabled={loading || !shippingData.fullName || !shippingData.phoneNumber || !shippingData.address}
                    >
                      {loading ? 'Placing Order...' : `Place Order - ₵${total.toFixed(2)}`}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setStep(1)}
                    >
                      Back to Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-md mx-auto">
            <EnhancedMobileMoneyPayment
              orderId={currentOrderId}
              amount={total}
              onPaymentComplete={handlePaymentComplete}
            />
          </div>
        )}
      </div>

      {/* Payment Confirmation Dialog */}
      <PaymentConfirmationDialog
        isOpen={showPaymentConfirmation}
        onClose={() => setShowPaymentConfirmation(false)}
        onConfirm={handlePaymentConfirm}
        paymentDetails={paymentConfirmationDetails}
        loading={loading}
      />
    </div>
  );
};

export default Checkout;
