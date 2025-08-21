
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { Shield, Loader2 } from "lucide-react";

const Auth = () => {
  const { user, signIn, signUp, loading: authLoading } = useAuth();
  const { isAdmin, adminLogin, loading: adminLoading } = useAdmin();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const authType = searchParams.get("type");
  const [activeTab, setActiveTab] = useState(() => {
    if (authType === "admin") return "admin";
    if (authType === "vendor") return "vendor";
    return "customer";
  });

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phoneNumber: ""
  });

  const [adminData, setAdminData] = useState({
    email: "",
    password: ""
  });

  useEffect(() => {
    if (authType && authType !== "admin") {
      setActiveTab(authType);
    }
  }, [authType]);

  // Handle redirects only after successful authentication
  useEffect(() => {
    // Skip redirects if still loading or processing
    if (authLoading || adminLoading || submitting) {
      return;
    }

    // Handle admin authentication
    if (isAdmin) {
      console.log('Admin authenticated, redirecting to admin panel');
      navigate('/admin-panel', { replace: true });
      return;
    }

    // Handle regular user authentication (only for non-admin tabs)
    if (user && profile && activeTab !== "admin") {
      console.log('User authenticated, redirecting based on role:', profile.role);
      
      if (profile.role === 'admin') {
        navigate('/admin-panel', { replace: true });
      } else if (profile.role === 'vendor') {
        navigate('/vendor-dashboard', { replace: true });
      } else {
        navigate('/shop', { replace: true });
      }
    }
  }, [user, profile, isAdmin, authLoading, adminLoading, activeTab, navigate, submitting]);

  // Show loading only during initial page load
  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (activeTab === "admin") {
        console.log('Attempting admin login with:', adminData.email);
        
        if (!adminData.email || !adminData.password) {
          toast({
            title: "Missing Information",
            description: "Please enter both email and password",
            variant: "destructive"
          });
          return;
        }

        const success = await adminLogin(adminData.email, adminData.password);
        
        if (success) {
          toast({
            title: "Admin Login Successful",
            description: "Welcome to the admin panel"
          });
          // Reset form
          setAdminData({ email: "", password: "" });
          // The redirect will happen in useEffect
        } else {
          toast({
            title: "Invalid Admin Credentials",
            description: "Please check your admin credentials",
            variant: "destructive"
          });
        }
        return;
      }

      // Handle regular user authentication
      if (isSignUp) {
        console.log('Starting signup process:', { email: formData.email, role: activeTab });
        
        if (!formData.email || !formData.password || !formData.fullName) {
          toast({
            title: "Missing Information",
            description: "Please fill in all required fields",
            variant: "destructive"
          });
          return;
        }

        const result = await signUp(formData.email, formData.password, {
          full_name: formData.fullName,
          phone_number: formData.phoneNumber,
          role: activeTab === "vendor" ? "vendor" : "customer"
        });
        
        if (result.error) {
          console.error('Signup error:', result.error);
          toast({
            title: "Sign Up Failed",
            description: result.error.message,
            variant: "destructive"
          });
        } else {
          console.log('Signup successful:', result.data);
          
          if (activeTab === "vendor") {
            toast({
              title: "Vendor Account Created!",
              description: "Please check your email to verify your account. After verification, you can apply to become a vendor."
            });
          } else {
            toast({
              title: "Account Created Successfully!",
              description: "Please check your email to verify your account."
            });
          }
          
          setFormData({
            email: "",
            password: "",
            fullName: "",
            phoneNumber: ""
          });
          setIsSignUp(false);
        }
      } else {
        console.log('Starting signin process:', formData.email);
        
        if (!formData.email || !formData.password) {
          toast({
            title: "Missing Information",
            description: "Please enter your email and password",
            variant: "destructive"
          });
          return;
        }

        const result = await signIn(formData.email, formData.password);
        if (result.error) {
          console.error('Signin error:', result.error);
          toast({
            title: "Sign In Failed",
            description: result.error.message,
            variant: "destructive"
          });
        } else {
          console.log('Signin successful:', result.data);
          toast({
            title: "Sign In Successful",
            description: "Welcome back!"
          });
          // The redirect will happen in useEffect
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast({
        title: "Authentication Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-8 px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h2 className="text-xl mb-2">
            {isSignUp ? "Create your account" : "Sign in to your account"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isSignUp ? "Join our marketplace today" : "Welcome back to our marketplace"}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="customer" className="text-sm">Customer</TabsTrigger>
            <TabsTrigger value="vendor" className="text-sm">Vendor</TabsTrigger>
            <TabsTrigger value="admin" className="text-sm">
              <Shield className="w-4 h-4 mr-1" />
              Admin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customer">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer Access</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {isSignUp && (
                    <Input
                      type="text"
                      placeholder="Full Name"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      required
                      className="text-sm"
                    />
                  )}
                  <Input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="text-sm"
                  />
                  {isSignUp && (
                    <Input
                      type="tel"
                      placeholder="Phone Number"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      className="text-sm"
                    />
                  )}
                  <Input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required
                    className="text-sm"
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isSignUp ? "Creating Account..." : "Signing In..."}
                      </>
                    ) : (
                      isSignUp ? "Sign Up" : "Sign In"
                    )}
                  </Button>
                </form>
                
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-primary hover:underline text-sm"
                    disabled={submitting}
                  >
                    {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vendor">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vendor Access</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {isSignUp && (
                    <Input
                      type="text"
                      placeholder="Full Name"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      required
                      className="text-sm"
                    />
                  )}
                  <Input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="text-sm"
                  />
                  {isSignUp && (
                    <Input
                      type="tel"
                      placeholder="Phone Number"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      required
                      className="text-sm"
                    />
                  )}
                  <Input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required
                    className="text-sm"
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isSignUp ? "Creating Account..." : "Signing In..."}
                      </>
                    ) : (
                      isSignUp ? "Sign Up as Vendor" : "Sign In"
                    )}
                  </Button>
                </form>
                
                {isSignUp && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-1">After Account Creation:</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      You'll be redirected to apply for vendor status. Once approved by admin, you can start selling.
                    </p>
                  </div>
                )}
                
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-primary hover:underline text-sm"
                    disabled={submitting}
                  >
                    {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Shield className="w-5 h-5 mr-2" />
                  Admin Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                  <h4 className="text-sm text-blue-900 dark:text-blue-100 mb-1">Demo Admin Credentials:</h4>
                  <p className="text-xs text-blue-800 dark:text-blue-200">Email: admin@kantamanto.com</p>
                  <p className="text-xs text-blue-800 dark:text-blue-200">Password: admin123</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Or try: admin / admin</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Admin Email"
                    value={adminData.email}
                    onChange={(e) => setAdminData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="text-sm"
                  />
                  <Input
                    type="password"
                    placeholder="Admin Password"
                    value={adminData.password}
                    onChange={(e) => setAdminData(prev => ({ ...prev, password: e.target.value }))}
                    required
                    className="text-sm"
                  />
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Access Admin Panel"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
