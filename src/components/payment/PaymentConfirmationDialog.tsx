
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Smartphone, User, MapPin, Phone } from "lucide-react";

interface PaymentConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  paymentDetails: {
    amount: number;
    paymentMethod: string;
    phoneNumber: string;
    customerName: string;
    deliveryAddress: string;
    orderItems: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
  };
  loading?: boolean;
}

const PaymentConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  paymentDetails,
  loading = false
}: PaymentConfirmationDialogProps) => {
  const getProviderInfo = (method: string) => {
    switch (method) {
      case "mtn_mobile_money":
        return { name: "MTN Mobile Money", color: "bg-yellow-500", icon: "🟡" };
      case "vodafone_cash":
        return { name: "Vodafone Cash", color: "bg-red-500", icon: "🔴" };
      case "airteltigo_money":
        return { name: "AirtelTigo Money", color: "bg-blue-500", icon: "🔵" };
      default:
        return { name: "Mobile Money", color: "bg-gray-500", icon: "💳" };
    }
  };

  const providerInfo = getProviderInfo(paymentDetails.paymentMethod);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Confirm Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Method */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded ${providerInfo.color}`}></div>
              <span className="font-medium">{providerInfo.name}</span>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Smartphone className="w-3 h-3" />
              {paymentDetails.phoneNumber}
            </Badge>
          </div>

          {/* Customer Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">Customer:</span>
              <span className="font-medium">{paymentDetails.customerName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">Delivery:</span>
              <span className="font-medium">{paymentDetails.deliveryAddress}</span>
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t pt-3">
            <h4 className="font-medium mb-2">Order Summary</h4>
            <div className="space-y-1 text-sm">
              {paymentDetails.orderItems.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span>{item.name} x {item.quantity}</span>
                  <span>₵{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total Amount */}
          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Amount</span>
              <span className="text-2xl font-bold text-orange-600">
                ₵{paymentDetails.amount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Confirmation Message */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              By confirming, you agree to pay <strong>₵{paymentDetails.amount.toFixed(2)}</strong> via {providerInfo.name} 
              to complete your order. You will receive a payment prompt on your phone.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {loading ? "Processing..." : "Confirm Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentConfirmationDialog;
