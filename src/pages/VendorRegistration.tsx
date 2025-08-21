
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const VendorRegistration = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [formData, setFormData] = useState({
    shop_name: '',
    description: '',
    location: ''
  });

  useEffect(() => {
    if (user) {
      checkExistingApplication();
    }
  }, [user]);

  const checkExistingApplication = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setExistingApplication(data);
    } catch (error) {
      console.error('Error checking application status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('vendors')
        .insert({
          user_id: user.id,
          shop_name: formData.shop_name,
          description: formData.description,
          location: formData.location,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Application Submitted!",
        description: "Your vendor application has been submitted successfully. We'll review it within 24-48 hours and notify you via email."
      });
      
      // Refresh to show the new status
      await checkExistingApplication();
    } catch (error) {
      console.error('Error registering vendor:', error);
      toast({
        title: "Error",
        description: "Failed to register as vendor. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusDisplay = () => {
    if (!existingApplication) return null;

    const statusConfig = {
      pending: {
        icon: Clock,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 border-yellow-200",
        badge: "bg-yellow-100 text-yellow-800",
        title: "Application Under Review",
        message: "Your vendor application is currently being reviewed by our admin team. We'll notify you within 24-48 hours."
      },
      approved: {
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50 border-green-200",
        badge: "bg-green-100 text-green-800",
        title: "Application Approved!",
        message: "Congratulations! Your vendor application has been approved. You can now start selling on our platform."
      },
      rejected: {
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-50 border-red-200",
        badge: "bg-red-100 text-red-800",
        title: "Application Rejected",
        message: "Unfortunately, your vendor application was not approved. Please contact support for more information."
      }
    };

    const config = statusConfig[existingApplication.status as keyof typeof statusConfig];
    const StatusIcon = config.icon;

    return (
      <Card className={`border-2 ${config.bgColor}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <StatusIcon className={`w-6 h-6 ${config.color}`} />
              <span>{config.title}</span>
            </div>
            <Badge className={config.badge}>
              {existingApplication.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">{config.message}</p>
          <div className="space-y-2 text-sm">
            <p><strong>Shop Name:</strong> {existingApplication.shop_name}</p>
            <p><strong>Location:</strong> {existingApplication.location || 'Not specified'}</p>
            <p><strong>Applied:</strong> {new Date(existingApplication.created_at).toLocaleDateString()}</p>
            {existingApplication.approved_at && (
              <p><strong>Approved:</strong> {new Date(existingApplication.approved_at).toLocaleDateString()}</p>
            )}
          </div>
          {existingApplication.status === 'approved' && (
            <div className="mt-4">
              <Button onClick={() => navigate('/vendor-dashboard')} className="w-full">
                Go to Vendor Dashboard
              </Button>
            </div>
          )}
          {existingApplication.status === 'rejected' && (
            <div className="mt-4">
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {existingApplication ? (
          getStatusDisplay()
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Become a Vendor</CardTitle>
              <p className="text-muted-foreground">
                Join our marketplace and start selling your products to thousands of customers.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="shop_name">Shop Name *</Label>
                  <Input
                    id="shop_name"
                    value={formData.shop_name}
                    onChange={(e) => setFormData({...formData, shop_name: e.target.value})}
                    placeholder="Enter your shop name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g., Accra, Ghana"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Shop Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Tell us about your shop and the products you plan to sell..."
                    rows={4}
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• We'll review your application within 24-48 hours</li>
                    <li>• You'll receive an email notification with the decision</li>
                    <li>• If approved, you'll gain access to the vendor dashboard</li>
                    <li>• You can then start adding and selling your products</li>
                  </ul>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Submitting Application...' : 'Submit Vendor Application'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VendorRegistration;
