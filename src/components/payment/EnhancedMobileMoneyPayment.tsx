
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Smartphone, Loader2, Shield, Clock, CheckCircle, Copy, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EnhancedMobileMoneyPaymentProps {
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
  progress: number;
  currentStep: string;
  vendorNumber?: string;
}

// Demo vendor numbers for different networks
const VENDOR_NUMBERS = {
  mtn_mobile_money: "0244123456",
  vodafone_cash: "0503456789",
  airteltigo_money: "0275678901"
};

const EnhancedMobileMoneyPayment = ({ orderId, amount, onPaymentComplete }: EnhancedMobileMoneyPaymentProps) => {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mtn_mobile_money");
  const [customerNumber, setCustomerNumber] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [showConfirmationStep, setShowConfirmationStep] = useState(false);

  const getProviderInfo = (method: PaymentMethod) => {
    switch (method) {
      case "mtn_mobile_money":
        return { 
          name: "MTN Mobile Money", 
          color: "bg-yellow-500", 
          prefixes: ["024", "054", "055", "059"], 
          icon: "🟡",
          processingTime: "30-60 seconds",
          shortCode: "*170#"
        };
      case "vodafone_cash":
        return { 
          name: "Vodafone Cash", 
          color: "bg-red-500", 
          prefixes: ["050", "020"], 
          icon: "🔴",
          processingTime: "30-60 seconds",
          shortCode: "*110#"
        };
      case "airteltigo_money":
        return { 
          name: "AirtelTigo Money", 
          color: "bg-blue-500", 
          prefixes: ["027", "057", "026", "056"], 
          icon: "🔵",
          processingTime: "30-60 seconds",
          shortCode: "*185#"
        };
      default:
        return { 
          name: "Mobile Money", 
          color: "bg-gray-500", 
          prefixes: ["0XX"], 
          icon: "💳",
          processingTime: "30-60 seconds",
          shortCode: "*000#"
        };
    }
  };

  const validatePhoneNumber = (phone: string, method: PaymentMethod) => {
    const { prefixes } = getProviderInfo(method);
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length !== 10) return false;
    return prefixes.some(prefix => cleanPhone.startsWith(prefix));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`
      });
    });
  };

  const initiatePayment = async () => {
    if (!validatePhoneNumber(customerNumber, paymentMethod)) {
      toast({
        title: "Invalid Phone Number",
        description: `Please enter a valid ${getProviderInfo(paymentMethod).name} number`,
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    const providerInfo = getProviderInfo(paymentMethod);
    const vendorNumber = VENDOR_NUMBERS[paymentMethod];

    try {
      // Create payment record
      const { data: paymentData, error: paymentError } = await supabase
        .from('mobile_money_payments')
        .insert({
          order_id: orderId,
          payment_method: paymentMethod,
          phone_number: customerNumber,
          amount: amount,
          reference_id: `KM${Date.now()}${Math.floor(Math.random() * 1000)}`,
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      setPaymentStatus({
        id: paymentData.id,
        status: 'pending',
        reference_id: paymentData.reference_id,
        progress: 25,
        currentStep: 'Payment initiated...',
        vendorNumber: vendorNumber
      });

      // Show payment instructions
      toast({
        title: "Payment Instructions Sent! 📱",
        description: `Please follow the steps to complete your ${providerInfo.name} payment`,
      });

      setShowConfirmationStep(true);

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive"
      });
      onPaymentComplete(false);
    } finally {
      setProcessing(false);
    }
  };

  const verifyPayment = async () => {
    if (!confirmationCode.trim()) {
      toast({
        title: "Confirmation Code Required",
        description: "Please enter your payment confirmation code",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);

    try {
      // Update payment status with verification steps
      setPaymentStatus(prev => prev ? {
        ...prev,
        progress: 50,
        currentStep: 'Verifying payment...'
      } : null);

      await new Promise(resolve => setTimeout(resolve, 2000));

      setPaymentStatus(prev => prev ? {
        ...prev,
        progress: 75,
        currentStep: 'Processing confirmation...'
      } : null);

      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate verification (in real app, you'd verify with provider API)
      const success = confirmationCode.length >= 6; // Simple validation for demo
      const transactionId = success ? `TXN${Date.now()}${Math.floor(Math.random() * 10000)}` : null;
      
      const { error: updateError } = await supabase
        .from('mobile_money_payments')
        .update({
          status: success ? 'success' : 'failed',
          transaction_id: transactionId,
          provider_response: {
            status: success ? 'approved' : 'declined',
            message: success ? 'Payment verified successfully' : 'Invalid confirmation code',
            confirmation_code: confirmationCode,
            timestamp: new Date().toISOString(),
            provider: getProviderInfo(paymentMethod).name,
            amount: amount
          }
        })
        .eq('id', paymentStatus?.id);

      if (!updateError) {
        setPaymentStatus(prev => prev ? {
          ...prev,
          status: success ? 'success' : 'failed',
          transaction_id: transactionId || undefined,
          currentStep: success ? 'Payment completed successfully!' : 'Payment verification failed',
          progress: 100
        } : null);

        if (success) {
          // Update order payment status
          await supabase
            .from('orders')
            .update({ status: 'accepted' })
            .eq('id', orderId);

          toast({
            title: "Payment Successful! 🎉",
            description: `₵${amount.toFixed(2)} paid successfully via ${getProviderInfo(paymentMethod).name}`,
          });

          onPaymentComplete(true, {
            transaction_id: transactionId,
            reference_id: paymentStatus?.reference_id,
            phone_number: customerNumber,
            amount: amount,
            confirmation_code: confirmationCode
          });
        } else {
          toast({
            title: "Payment Verification Failed",
            description: "Please check your confirmation code and try again.",
            variant: "destructive",
          });
        }
      }

    } catch (error) {
      console.error('Payment verification error:', error);
      toast({
        title: "Verification Error",
        description: "Failed to verify payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const resetPayment = () => {
    setPaymentStatus(null);
    setShowConfirmationStep(false);
    setConfirmationCode("");
    setProcessing(false);
  };

  const providerInfo = getProviderInfo(paymentMethod);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-green-500" />
          <span className="text-sm text-green-600 font-medium">Secure Payment</span>
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          <Smartphone className="w-5 h-5" />
          Mobile Money Payment
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border">
          <p className="text-3xl font-bold text-orange-600">₵{amount.toFixed(2)}</p>
          <p className="text-sm text-orange-700">Total Amount</p>
        </div>

        {!paymentStatus && !showConfirmationStep && (
          <>
            <div className="space-y-3">
              <Label htmlFor="payment-method">Select Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mtn_mobile_money">
                    <div className="flex items-center gap-3 py-1">
                      <div className="w-4 h-4 rounded bg-yellow-500"></div>
                      <div>
                        <p className="font-medium">MTN Mobile Money</p>
                        <p className="text-xs text-gray-500">*170# | 024, 054, 055, 059</p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="vodafone_cash">
                    <div className="flex items-center gap-3 py-1">
                      <div className="w-4 h-4 rounded bg-red-500"></div>
                      <div>
                        <p className="font-medium">Vodafone Cash</p>
                        <p className="text-xs text-gray-500">*110# | 050, 020</p>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="airteltigo_money">
                    <div className="flex items-center gap-3 py-1">
                      <div className="w-4 h-4 rounded bg-blue-500"></div>
                      <div>
                        <p className="font-medium">AirtelTigo Money</p>
                        <p className="text-xs text-gray-500">*185# | 027, 057, 026, 056</p>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="phone">Your Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder={`e.g., ${providerInfo.prefixes[0]}XXXXXXX`}
                value={customerNumber}
                onChange={(e) => setCustomerNumber(e.target.value)}
                className="text-lg h-12"
              />
            </div>

            <Button 
              onClick={initiatePayment} 
              disabled={processing || !customerNumber}
              className="w-full h-12 text-lg font-medium bg-orange-500 hover:bg-orange-600"
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Initiate Payment - ₵${amount.toFixed(2)}`
              )}
            </Button>
          </>
        )}

        {showConfirmationStep && paymentStatus && (
          <div className="space-y-4">
            <div className="text-center">
              <Badge variant="secondary" className="text-base px-4 py-2">
                <Phone className="w-4 h-4 mr-2" />
                Payment Instructions
              </Badge>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-blue-900">Follow these steps:</h4>
              
              <div className="space-y-3 text-sm text-blue-800">
                <div className="flex items-center justify-between p-2 bg-white rounded border">
                  <span>1. Dial: <strong>{providerInfo.shortCode}</strong></span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => copyToClipboard(providerInfo.shortCode, "USSD Code")}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-white rounded border">
                  <span>2. Send Money to: <strong>{paymentStatus.vendorNumber}</strong></span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => copyToClipboard(paymentStatus.vendorNumber!, "Vendor Number")}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-white rounded border">
                  <span>3. Amount: <strong>₵{amount.toFixed(2)}</strong></span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => copyToClipboard(amount.toString(), "Amount")}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="p-2 bg-white rounded border">
                  <span>4. Reference: <strong>{paymentStatus.reference_id}</strong></span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="confirmation">Enter Confirmation Code</Label>
              <Input
                id="confirmation"
                type="text"
                placeholder="Enter the confirmation code from SMS"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                className="text-lg h-12"
              />
              <p className="text-xs text-gray-500">
                You'll receive a confirmation SMS after completing the payment
              </p>
            </div>

            <div className="space-y-2">
              <Button 
                onClick={verifyPayment}
                disabled={processing || !confirmationCode.trim()}
                className="w-full h-12 bg-green-600 hover:bg-green-700"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Payment"
                )}
              </Button>
              
              <Button 
                onClick={resetPayment}
                variant="outline"
                className="w-full"
                disabled={processing}
              >
                Cancel Payment
              </Button>
            </div>
          </div>
        )}

        {paymentStatus && paymentStatus.status !== 'pending' && (
          <div className="space-y-4">
            <div className="text-center">
              <Badge 
                variant={paymentStatus.status === 'success' ? 'default' : 'destructive'}
                className="text-base px-4 py-2"
              >
                {paymentStatus.status === 'success' && <CheckCircle className="w-4 h-4 mr-2" />}
                {paymentStatus.status === 'success' && 'Payment Successful!'}
                {paymentStatus.status === 'failed' && 'Payment Failed'}
              </Badge>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              {paymentStatus.reference_id && (
                <div className="text-center">
                  <p className="text-sm text-gray-600">Reference ID</p>
                  <p className="font-mono text-sm font-medium">{paymentStatus.reference_id}</p>
                </div>
              )}

              {paymentStatus.transaction_id && (
                <div className="text-center">
                  <p className="text-sm text-gray-600">Transaction ID</p>
                  <p className="font-mono text-sm font-medium">{paymentStatus.transaction_id}</p>
                </div>
              )}

              <div className="text-center text-xs text-gray-500">
                <p>Payment via {providerInfo.name}</p>
                <p>{customerNumber}</p>
              </div>
            </div>

            {paymentStatus.status === 'failed' && (
              <Button 
                onClick={resetPayment} 
                variant="outline"
                className="w-full"
              >
                Try Again
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedMobileMoneyPayment;
