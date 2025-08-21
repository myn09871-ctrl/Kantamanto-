
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Package, DollarSign, Users, TrendingUp, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import ProductManagement from "@/components/vendor/ProductManagement";
import OrderManagement from "@/components/vendor/OrderManagement";
import VendorStats from "@/components/vendor/VendorStats";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import VendorProfile from "@/components/vendor/VendorProfile";
import VendorChatInterface from "@/components/vendor/VendorChatInterface";

const VendorDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, vendor, loading: profileLoading } = useProfile();

  if (!authLoading && !user) {
    return <Navigate to="/auth?type=vendor" replace />;
  }

  if (!profileLoading && profile && profile.role !== 'vendor') {
    return <Navigate to="/auth?type=customer" replace />;
  }

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const renderStatusBanner = () => {
    if (!vendor) {
      return (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-200 dark:border-yellow-700 p-3 mb-4 sticky top-0 z-50">
          <div className="flex items-center">
            <Clock className="w-4 h-4 text-yellow-800 mr-2 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Application Under Review</h3>
              <p className="text-xs text-yellow-800 opacity-90">Your vendor application is being reviewed by our admin team. You'll be notified once approved.</p>
            </div>
          </div>
        </div>
      );
    }

    if (vendor.status === 'approved') {
      return (
        <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-200 dark:border-green-700 p-3 mb-4 sticky top-0 z-50">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-800 mr-2 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-green-800">Application Approved!</h3>
              <p className="text-xs text-green-800 opacity-90">Congratulations! Your vendor application has been approved. You can now start selling on our platform.</p>
            </div>
          </div>
        </div>
      );
    }

    const statusConfig = {
      pending: {
        icon: Clock,
        color: "text-yellow-800",
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        borderColor: "border-yellow-200 dark:border-yellow-700",
        title: "Application Under Review",
        message: "Your vendor application is being reviewed by our admin team. You'll be notified once approved. Meanwhile, you can explore the features below."
      },
      rejected: {
        icon: XCircle,
        color: "text-red-800",
        bgColor: "bg-red-50 dark:bg-red-900/20",
        borderColor: "border-red-200 dark:border-red-700",
        title: "Application Rejected",
        message: "Unfortunately, your vendor application was not approved. Please contact support for more information or reapply with updated information."
      },
      suspended: {
        icon: XCircle,
        color: "text-red-800",
        bgColor: "bg-red-50 dark:bg-red-900/20",
        borderColor: "border-red-200 dark:border-red-700",
        title: "Account Suspended",
        message: "Your vendor account has been suspended. Please contact support for assistance."
      }
    };

    const config = statusConfig[vendor.status || 'pending'];
    const StatusIcon = config.icon;

    return (
      <div className={`${config.bgColor} ${config.borderColor} border-l-4 p-3 mb-4 sticky top-0 z-50`}>
        <div className="flex items-center">
          <StatusIcon className={`w-4 h-4 ${config.color} mr-2 flex-shrink-0`} />
          <div>
            <h3 className={`text-sm font-medium ${config.color}`}>{config.title}</h3>
            <p className={`text-xs ${config.color} opacity-90`}>{config.message}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {renderStatusBanner()}

        <div className="mb-6">
          <h1 className="text-lg font-medium text-gray-900 dark:text-white">Vendor Dashboard</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Welcome back, {vendor?.shop_name || profile?.full_name}! 
            {vendor?.status === 'approved' && (
              <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                Approved Vendor
              </Badge>
            )}
            {vendor?.status === 'pending' && (
              <Badge className="ml-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Under Review
              </Badge>
            )}
          </p>
        </div>

        {vendor?.status === 'approved' ? (
          <>
            <VendorStats />

            <Tabs defaultValue="products" className="space-y-4">
              <TabsList className="dark:bg-gray-800">
                <TabsTrigger value="products" className="dark:text-gray-300 text-sm">My Products</TabsTrigger>
                <TabsTrigger value="orders" className="dark:text-gray-300 text-sm">Orders</TabsTrigger>
                <TabsTrigger value="chat" className="dark:text-gray-300 text-sm">Customer Chat</TabsTrigger>
                <TabsTrigger value="profile" className="dark:text-gray-300 text-sm">Profile</TabsTrigger>
                <TabsTrigger value="notifications" className="dark:text-gray-300 text-sm">Notifications</TabsTrigger>
                <TabsTrigger value="add-product" className="dark:text-gray-300 text-sm">Add Product</TabsTrigger>
              </TabsList>

              <TabsContent value="products">
                <ProductManagement />
              </TabsContent>

              <TabsContent value="orders">
                <OrderManagement />
              </TabsContent>

              <TabsContent value="chat">
                <VendorChatInterface />
              </TabsContent>

              <TabsContent value="profile">
                <VendorProfile />
              </TabsContent>

              <TabsContent value="notifications">
                <NotificationCenter />
              </TabsContent>

              <TabsContent value="add-product">
                <ProductManagement showAddForm />
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="dark:bg-gray-800 dark:border-gray-700 glassmorphic">
              <CardHeader>
                <CardTitle className="flex items-center dark:text-white text-sm">
                  <Package className="w-4 h-4 mr-2 text-orange-500" />
                  Shop Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="dark:text-gray-300 text-xs"><strong>Shop Name:</strong> {vendor?.shop_name || 'N/A'}</p>
                  <p className="dark:text-gray-300 text-xs"><strong>Location:</strong> {vendor?.location || 'N/A'}</p>
                  <p className="dark:text-gray-300 text-xs"><strong>Description:</strong> {vendor?.description || 'N/A'}</p>
                  <p className="dark:text-gray-300 text-xs"><strong>Application Status:</strong> 
                    <Badge variant="outline" className="ml-2 text-xs">
                      {vendor?.status || 'pending'}
                    </Badge>
                  </p>
                  {vendor?.created_at && (
                    <p className="dark:text-gray-300 text-xs">
                      <strong>Applied:</strong> {new Date(vendor.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700 glassmorphic">
              <CardHeader>
                <CardTitle className="flex items-center dark:text-white text-sm">
                  <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
                  What's Next?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  While waiting for approval, you can:
                </p>
                <ul className="space-y-1 text-xs dark:text-gray-300">
                  <li>• Explore the marketplace</li>
                  <li>• Review vendor guidelines</li>
                  <li>• Prepare your product listings</li>
                  <li>• Contact support if needed</li>
                  <li>• Check your application status regularly</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700 glassmorphic">
              <CardHeader>
                <CardTitle className="flex items-center dark:text-white text-sm">
                  <Users className="w-4 h-4 mr-2 text-blue-500" />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Have questions about your application?
                </p>
                <Button variant="outline" className="w-full dark:border-gray-600 dark:text-gray-300 text-xs h-8">
                  Contact Support
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Response time: Usually within 24 hours
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDashboard;
