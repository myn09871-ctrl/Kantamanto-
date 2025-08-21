
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, Store, CheckCircle, XCircle, RefreshCw, Loader2, UserX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface VendorWithProfile {
  id: string;
  shop_name: string;
  location: string;
  description: string;
  status: string;
  created_at: string;
  approved_at: string | null;
  user_id: string;
  profile: {
    full_name: string;
    email: string;
    phone_number: string;
    role: string;
  } | null;
}

interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  role: string;
  created_at: string;
}

const AdminPanel = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const [pendingVendors, setPendingVendors] = useState<VendorWithProfile[]>([]);
  const [allVendors, setAllVendors] = useState<VendorWithProfile[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingVendor, setProcessingVendor] = useState<string | null>(null);
  const [processingUser, setProcessingUser] = useState<string | null>(null);

  // Redirect if not admin - this is critical for security
  useEffect(() => {
    if (!authLoading && !adminLoading && !isAdmin) {
      console.log('User is not admin, redirecting to auth');
    }
  }, [authLoading, adminLoading, isAdmin]);

  // Fetch data only if user is admin
  useEffect(() => {
    if (!authLoading && !adminLoading && isAdmin) {
      console.log('Admin authenticated, fetching data');
      fetchAllData();
    }
  }, [authLoading, adminLoading, isAdmin]);

  // Redirect if not admin
  if (!authLoading && !adminLoading && !isAdmin) {
    return <Navigate to="/auth?type=admin" replace />;
  }

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchVendors(), fetchCustomers()]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      console.log('Fetching vendors...');
      
      // First get vendors
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });

      if (vendorsError) {
        console.error('Error fetching vendors:', vendorsError);
        throw vendorsError;
      }

      console.log('Vendors data:', vendorsData);

      // Then get profiles for each vendor
      const vendorsWithProfiles: VendorWithProfile[] = [];
      
      if (vendorsData && vendorsData.length > 0) {
        for (const vendor of vendorsData) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', vendor.user_id)
            .single();

          if (profileError) {
            console.error('Error fetching profile for vendor:', vendor.id, profileError);
          }

          vendorsWithProfiles.push({
            ...vendor,
            profile: profileData || null
          });
        }
      }

      console.log('Vendors with profiles:', vendorsWithProfiles);
      setAllVendors(vendorsWithProfiles);
      setPendingVendors(vendorsWithProfiles.filter(v => v.status === 'pending'));
      
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast({
        title: "Error",
        description: "Failed to fetch vendor applications",
        variant: "destructive"
      });
    }
  };

  const fetchCustomers = async () => {
    try {
      console.log('Fetching customers...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'customer')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching customers:', error);
        throw error;
      }

      console.log('Customers data:', data);
      setCustomers(data || []);
      
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive"
      });
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Data has been refreshed"
    });
  };

  const handleVendorAction = async (vendorId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingVendor(vendorId);
      console.log(`${action}ing vendor:`, vendorId);
      
      if (action === 'approve') {
        const { error } = await supabase.rpc('approve_vendor', {
          vendor_id: vendorId,
          admin_id: user?.id || null
        });

        if (error) {
          console.error('Error approving vendor:', error);
          throw error;
        }

        toast({
          title: "Vendor Approved ✅",
          description: "The vendor application has been approved successfully."
        });
      } else {
        const { error } = await supabase.rpc('reject_vendor', {
          vendor_id: vendorId,
          admin_id: user?.id || null
        });

        if (error) {
          console.error('Error rejecting vendor:', error);
          throw error;
        }

        toast({
          title: "Vendor Rejected ❌",
          description: "The vendor application has been rejected"
        });
      }

      await fetchVendors();
    } catch (error) {
      console.error(`Error ${action}ing vendor:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} vendor application`,
        variant: "destructive"
      });
    } finally {
      setProcessingVendor(null);
    }
  };

  const handleDeleteUser = async (userId: string, userType: 'customer' | 'vendor') => {
    try {
      setProcessingUser(userId);
      console.log(`Deleting ${userType}:`, userId);
      
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error(`Error deleting ${userType}:`, error);
        throw error;
      }

      toast({
        title: "User Deleted",
        description: `The ${userType} has been deleted successfully`
      });

      await fetchAllData();
    } catch (error) {
      console.error(`Error deleting ${userType}:`, error);
      toast({
        title: "Error",
        description: `Failed to delete ${userType}`,
        variant: "destructive"
      });
    } finally {
      setProcessingUser(null);
    }
  };

  return (
    <div className="min-h-screen bg-background py-6">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">
                Manage vendor applications, customers, and marketplace operations
              </p>
            </div>
            <Button onClick={refreshData} disabled={refreshing} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs defaultValue="vendors" className="space-y-4">
          <TabsList>
            <TabsTrigger value="vendors">
              Pending Applications
              {pendingVendors.length > 0 && (
                <Badge className="ml-2 bg-orange-500 text-white">
                  {pendingVendors.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all-vendors">
              All Vendors ({allVendors.length})
            </TabsTrigger>
            <TabsTrigger value="customers">
              Customers ({customers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vendors">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Store className="w-5 h-5 mr-2" />
                  Pending Vendor Applications ({pendingVendors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading applications...</p>
                  </div>
                ) : pendingVendors.length === 0 ? (
                  <div className="text-center py-8">
                    <Store className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No pending applications</h3>
                    <p className="text-muted-foreground">
                      All vendor applications have been processed
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingVendors.map((vendor) => (
                      <div key={vendor.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                              <Users className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div>
                              <h3 className="font-medium">{vendor.shop_name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {vendor.profile?.full_name || 'No name'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {vendor.profile?.email || 'No email'}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary">{vendor.status}</Badge>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="font-medium text-muted-foreground">Location</p>
                            <p>{vendor.location || 'Not specified'}</p>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground">Phone</p>
                            <p>{vendor.profile?.phone_number || 'Not provided'}</p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="font-medium text-muted-foreground mb-1">Description</p>
                          <p className="text-sm">{vendor.description || 'No description provided'}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Applied: {new Date(vendor.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVendorAction(vendor.id, 'reject')}
                              disabled={processingVendor === vendor.id}
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              {processingVendor === vendor.id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <XCircle className="w-4 h-4 mr-2" />
                              )}
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleVendorAction(vendor.id, 'approve')}
                              disabled={processingVendor === vendor.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {processingVendor === vendor.id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                              )}
                              Approve
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all-vendors">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Store className="w-5 h-5 mr-2" />
                  All Vendors ({allVendors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading vendors...</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {allVendors.map((vendor) => (
                      <div key={vendor.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium">{vendor.shop_name}</h3>
                              <Badge 
                                variant={vendor.status === 'approved' ? 'default' : 
                                       vendor.status === 'rejected' ? 'destructive' : 'secondary'}
                              >
                                {vendor.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{vendor.profile?.full_name}</p>
                            <p className="text-sm text-muted-foreground">{vendor.profile?.email}</p>
                            <div className="mt-2 text-sm text-muted-foreground">
                              Applied: {new Date(vendor.created_at).toLocaleDateString()}
                              {vendor.approved_at && (
                                <span className="ml-2">
                                  | Approved: {new Date(vendor.approved_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  disabled={processingUser === vendor.user_id}
                                >
                                  {processingUser === vendor.user_id ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <UserX className="w-4 h-4 mr-2" />
                                  )}
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this vendor? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteUser(vendor.user_id, 'vendor')}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  All Customers ({customers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading customers...</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {customers.map((customer) => (
                      <div key={customer.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium">{customer.full_name}</h3>
                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                            <p className="text-sm text-muted-foreground">{customer.phone_number}</p>
                            <div className="mt-2 text-sm text-muted-foreground">
                              Joined: {new Date(customer.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  disabled={processingUser === customer.id}
                                >
                                  {processingUser === customer.id ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <UserX className="w-4 h-4 mr-2" />
                                  )}
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this customer? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteUser(customer.id, 'customer')}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
