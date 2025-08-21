
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MobileMoneyPaymentProps {
  orderId: string;
  amount: number;
  onPaymentComplete: (success: boolean, paymentData?: any) => void;
}

type PaymentMethod = "mtn_mobile_money" | "vodafone_cash" | "airteltigo_money";

interface PaymentStatus {
  id: string;
  status: string;
  transaction_id?: string;
  reference_id?: string;
  provider_response?: any;
}

const MobileMoneyPayment = ({ orderId, amount, onPaymentComplete }: MobileMoneyPaymentProps) => {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mtn_mobile_money");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [currentStep, setCurrentStep] = useState<'form' | 'processing' | 'prompt' | 'complete'>('form');

  const getProviderInfo = (method: PaymentMethod) => {
    switch (method) {
      case "mtn_mobile_money":
        return { 
          name: "MTN Mobile Money", 
          color: "bg-yellow-500", 
          prefixes: ["024", "054", "055", "059"], 
          icon: "📱",
          ussd: "*170#"
        };
      case "vodafone_cash":
        return { 
          name: "Vodafone Cash", 
          color: "bg-red-500", 
          prefixes: ["050", "020"], 
          icon: "💳",
          ussd: "*110#"
        };
      case "airteltigo_money":
        return { 
          name: "AirtelTigo Money", 
          color: "bg-blue-500", 
          prefixes: ["027", "057", "026", "056"], 
          icon: "💰",
          ussd: "*100#"
        };
      default:
        return { name: "Mobile Money", color: "bg-gray-500", prefixes: ["0XX"], icon: "💳", ussd: "*XXX#" };
    }
  };

  const validatePhoneNumber = (phone: string, method: PaymentMethod) => {
    const { prefixes } = getProviderInfo(method);
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length !== 10) return false;
    return prefixes.some(prefix => cleanPhone.startsWith(prefix));
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const initiatePayment = async () => {
    if (!validatePhoneNumber(phoneNumber, paymentMethod)) {
      toast({
        title: "Invalid Phone Number",
        description: `Please enter a valid ${getProviderInfo(paymentMethod).name} number`,
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    setCurrentStep('processing');

    try {
      // Create payment record
      const { data: paymentData, error: paymentError } = await supabase
        .from('mobile_money_payments')
        .insert({
          order_id: orderId,
          payment_method: paymentMethod,
          phone_number: phoneNumber,
          amount: amount,
          reference_id: `KM${Date.now()}${Math.floor(Math.random() * 1000)}`,
          status: 'pending'
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      setPaymentStatus({
        id: paymentData.id,
        status: 'pending',
        reference_id: paymentData.reference_id,
      });

      // Simulate payment initiation
      await new Promise(resolve => setTimeout(resolve, 2000));

      setCurrentStep('prompt');
      
      toast({
        title: "Payment Initiated! 📱",
        description: `Check your phone for the ${getProviderInfo(paymentMethod).name} payment prompt`,
      });

      // Simulate phone prompt processing
      setTimeout(async () => {
        const success = Math.random() > 0.2; // 80% success rate for demo
        
        const transactionId = success ? `TXN${Date.now()}${Math.floor(Math.random() * 10000)}` : null;
        
        const { error: updateError } = await supabase
          .from('mobile_money_payments')
          .update({
            status: success ? 'success' : 'failed',
            transaction_id: transactionId,
            provider_response: {
              status: success ? 'approved' : 'declined',
              message: success ? 'Payment successful' : 'Payment declined or cancelled by user',
              timestamp: new Date().toISOString(),
              provider: getProviderInfo(paymentMethod).name
            }
          })
          .eq('id', paymentData.id);

        if (!updateError) {
          setPaymentStatus(prev => prev ? {
            ...prev,
            status: success ? 'success' : 'failed',
            transaction_id: transactionId,
          } : null);

          if (success) {
            // Update order payment status
            await supabase
              .from('orders')
              .update({ status: 'accepted' })
              .eq('id', orderId);

            setCurrentStep('complete');
            
            toast({
              title: "Payment Successful! 🎉",
              description: "Your payment has been processed successfully"
            });
          } else {
            setCurrentStep('form');
            toast({
              title: "Payment Failed",
              description: "Payment was declined or cancelled. Please try again.",
              variant: "destructive",
            });
          }

          onPaymentComplete(success, paymentData);
        }

        setProcessing(false);
      }, 8000); // 8 seconds to simulate real mobile money processing time

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
      setProcessing(false);
      setCurrentStep('form');
    }
  };

  const providerInfo = getProviderInfo(paymentMethod);

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Smartphone className="w-5 h-5" />
          Mobile Money Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
          <p className="text-2xl font-bold text-orange-600">₵{amount.toFixed(2)}</p>
          <p className="text-sm text-orange-700">Total Amount</p>
        </div>

        {currentStep === 'form' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mtn_mobile_money">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-yellow-500"></div>
                      MTN Mobile Money
                    </div>
                  </SelectItem>
                  <SelectItem value="vodafone_cash">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-red-500"></div>
                      Vodafone Cash
                    </div>
                  </SelectItem>
                  <SelectItem value="airteltigo_money">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-blue-500"></div>
                      AirtelTigo Money
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder={`e.g., ${providerInfo.prefixes[0]}XXXXXXX`}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="text-lg"
              />
              <p className="text-xs text-gray-500">
                Enter your {providerInfo.name} registered number
              </p>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>How it works:</strong> You'll receive a payment prompt on your phone. 
                Follow the instructions to complete the payment.
              </p>
            </div>

            <Button 
              onClick={initiatePayment} 
              disabled={processing || !phoneNumber}
              className="w-full bg-orange-500 hover:bg-orange-600"
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ₵${amount.toFixed(2)} with ${providerInfo.name}`
              )}
            </Button>
          </>
        )}

        {currentStep === 'processing' && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Initiating Payment...</h3>
              <p className="text-sm text-gray-600">
                Setting up your {providerInfo.name} payment
              </p>
            </div>
          </div>
        )}

        {currentStep === 'prompt' && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-orange-600 animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Check Your Phone 📱</h3>
              <p className="text-sm text-gray-600 mb-3">
                A payment prompt has been sent to<br />
                <strong>{formatPhoneNumber(phoneNumber)}</strong>
              </p>
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Next Steps:</strong><br />
                  1. Check your phone for the payment prompt<br />
                  2. Enter your {providerInfo.name} PIN<br />
                  3. Confirm the payment of ₵{amount.toFixed(2)}
                </p>
              </div>
            </div>
            {paymentStatus?.reference_id && (
              <div className="text-center">
                <p className="text-xs text-gray-500">Reference ID</p>
                <p className="font-mono text-sm font-semibold">{paymentStatus.reference_id}</p>
              </div>
            )}
          </div>
        )}

        {currentStep === 'complete' && paymentStatus && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-green-800">Payment Successful!</h3>
              <p className="text-sm text-gray-600">
                Your payment has been processed successfully
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Amount Paid:</span>
                <span className="font-semibold">₵{amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Transaction ID:</span>
                <span className="font-mono text-xs">{paymentStatus.transaction_id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Reference ID:</span>
                <span className="font-mono text-xs">{paymentStatus.reference_id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Payment Method:</span>
                <span>{providerInfo.name}</span>
              </div>
            </div>
          </div>
        )}

        {paymentStatus?.status === 'failed' && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-red-800">Payment Failed</h3>
              <p className="text-sm text-gray-600">
                Your payment could not be processed
              </p>
            </div>
            <Button 
              onClick={() => {
                setPaymentStatus(null);
                setCurrentStep('form');
              }}
              variant="outline"
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MobileMoneyPayment;
