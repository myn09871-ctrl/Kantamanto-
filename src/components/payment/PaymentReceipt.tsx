
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Download, Share, Phone, MapPin, Calendar, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReceiptProps {
  orderData: {
    id: string;
    total_amount: number;
    delivery_address: string;
    phone_number: string;
    payment_method: string;
    created_at: string;
    status: string;
  };
  paymentData?: {
    transaction_id?: string;
    reference_id?: string;
    phone_number?: string;
    amount: number;
  };
  orderItems: Array<{
    product: {
      name: string;
      vendor: { shop_name: string };
    };
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  customerName: string;
}

const PaymentReceipt = ({ orderData, paymentData, orderItems, customerName }: ReceiptProps) => {
  const { toast } = useToast();

  const getPaymentMethodDisplay = (method: string) => {
    switch (method) {
      case 'mtn_mobile_money': return 'MTN Mobile Money';
      case 'vodafone_cash': return 'Vodafone Cash';
      case 'airteltigo_money': return 'AirtelTigo Money';
      case 'cash_on_delivery': return 'Cash on Delivery';
      default: return method;
    }
  };

  const downloadReceipt = () => {
    const receiptContent = `
AGROFRESH MARKETPLACE - RECEIPT
================================

Receipt #: ${orderData.id.slice(0, 8).toUpperCase()}
Date: ${new Date(orderData.created_at).toLocaleString()}
Status: ${orderData.status.toUpperCase()}

CUSTOMER INFORMATION
--------------------
Name: ${customerName}
Phone: ${orderData.phone_number}
Delivery Address: ${orderData.delivery_address}

PAYMENT INFORMATION
-------------------
Method: ${getPaymentMethodDisplay(orderData.payment_method)}
${paymentData?.transaction_id ? `Transaction ID: ${paymentData.transaction_id}` : ''}
${paymentData?.reference_id ? `Reference ID: ${paymentData.reference_id}` : ''}
${paymentData?.phone_number ? `Payment Phone: ${paymentData.phone_number}` : ''}

ORDER DETAILS
-------------
${orderItems.map(item => 
  `${item.product.name} (${item.product.vendor.shop_name})
  Qty: ${item.quantity} × ₵${item.unit_price.toFixed(2)} = ₵${item.total_price.toFixed(2)}`
).join('\n')}

PAYMENT SUMMARY
---------------
Subtotal: ₵${(orderData.total_amount - 5).toFixed(2)}
Delivery Fee: ₵5.00
Total Amount: ₵${orderData.total_amount.toFixed(2)}

Thank you for shopping with AgroFresh!
Support: +233 XXX XXX XXX
Email: support@agrofresh.com
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${orderData.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Receipt Downloaded",
      description: "Your receipt has been saved to your device"
    });
  };

  const shareReceipt = async () => {
    const shareText = `Payment successful! Order #${orderData.id.slice(0, 8)} - ₵${orderData.total_amount.toFixed(2)} paid via ${getPaymentMethodDisplay(orderData.payment_method)}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AgroFresh Receipt',
          text: shareText,
        });
      } catch (error) {
        navigator.clipboard.writeText(shareText);
        toast({
          title: "Copied to Clipboard",
          description: "Receipt details copied to clipboard"
        });
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied to Clipboard",
        description: "Receipt details copied to clipboard"
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center bg-green-50 border-b">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <CardTitle className="text-2xl text-green-700">Payment Successful!</CardTitle>
        <p className="text-green-600">Your order has been confirmed and payment processed</p>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Order Summary Header */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900">AgroFresh Marketplace</h2>
          <p className="text-sm text-gray-600">Fresh Products, Direct from Farmers</p>
          <Badge className="mt-2">Receipt #{orderData.id.slice(0, 8).toUpperCase()}</Badge>
        </div>

        <Separator />

        {/* Customer Information */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Customer Details
            </h3>
            <div className="text-sm space-y-1">
              <p><strong>Name:</strong> {customerName}</p>
              <p><strong>Phone:</strong> {orderData.phone_number}</p>
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-gray-500" />
                <span><strong>Delivery:</strong> {orderData.delivery_address}</span>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payment Details
            </h3>
            <div className="text-sm space-y-1">
              <p><strong>Method:</strong> {getPaymentMethodDisplay(orderData.payment_method)}</p>
              {paymentData?.transaction_id && (
                <p><strong>Transaction ID:</strong> {paymentData.transaction_id}</p>
              )}
              {paymentData?.reference_id && (
                <p><strong>Reference:</strong> {paymentData.reference_id}</p>
              )}
              {paymentData?.phone_number && (
                <p><strong>Payment Phone:</strong> {paymentData.phone_number}</p>
              )}
              <p className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>{new Date(orderData.created_at).toLocaleString()}</span>
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Order Items */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
          <div className="space-y-3">
            {orderItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-sm text-gray-600">by {item.product.vendor.shop_name}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity} × ₵{item.unit_price.toFixed(2)}</p>
                </div>
                <p className="font-semibold">₵{item.total_price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Payment Summary */}
        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Payment Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₵{(orderData.total_amount - 5).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>₵5.00</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total Paid</span>
              <span className="text-green-600">₵{orderData.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button onClick={downloadReceipt} variant="outline" className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Download Receipt
          </Button>
          <Button onClick={shareReceipt} variant="outline" className="flex-1">
            <Share className="w-4 h-4 mr-2" />
            Share Receipt
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-4 border-t">
          <p>Thank you for shopping with AgroFresh Marketplace!</p>
          <p>Support: +233 XXX XXX XXX | Email: support@agrofresh.com</p>
          <p>Keep this receipt for your records</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentReceipt;
