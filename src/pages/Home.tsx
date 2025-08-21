
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Store, Users, Shield, Truck, Award, CheckCircle, Clock } from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="py-20 text-center">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Welcome To Kantamanto Market Online
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Ghana's largest online marketplace bringing you authentic products from Kantamanto Market. 
            Shop from trusted vendors, chat with sellers, and enjoy secure mobile money payments.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/shop">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                <ShoppingBag className="w-5 h-5 mr-2" />
                Start Shopping
              </Button>
            </Link>
            <Link to="/vendor-registration">
              <Button variant="outline" size="lg">
                <Store className="w-5 h-5 mr-2" />
                Become a Vendor
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Why Choose Our Platform?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-card rounded-lg border">
              <ShoppingBag className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Easy Shopping</h3>
              <p className="text-muted-foreground">
                Browse products with audio previews, videos, and detailed descriptions.
              </p>
            </div>
            
            <div className="text-center p-6 bg-card rounded-lg border">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Chat & Bargain</h3>
              <p className="text-muted-foreground">
                Communicate directly with vendors to negotiate prices and ask questions.
              </p>
            </div>
            
            <div className="text-center p-6 bg-card rounded-lg border">
              <Store className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Mobile Money</h3>
              <p className="text-muted-foreground">
                Secure payments with MTN, Vodafone Cash, and AirtelTigo Money.
              </p>
            </div>

            <div className="text-center p-6 bg-card rounded-lg border">
              <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Secure Platform</h3>
              <p className="text-muted-foreground">
                Your transactions and personal data are protected with advanced security.
              </p>
            </div>

            <div className="text-center p-6 bg-card rounded-lg border">
              <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Convenient Shopping</h3>
              <p className="text-muted-foreground">
                Shop from anywhere, anytime with our user-friendly mobile interface.
              </p>
            </div>

            <div className="text-center p-6 bg-card rounded-lg border">
              <Award className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Trusted Vendors</h3>
              <p className="text-muted-foreground">
                All vendors are verified and approved to ensure quality service.
              </p>
            </div>

            <div className="text-center p-6 bg-card rounded-lg border">
              <Award className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Quality Products</h3>
              <p className="text-muted-foreground">
                Authentic Kantamanto products with quality guarantee from trusted sellers.
              </p>
            </div>

            <div className="text-center p-6 bg-card rounded-lg border">
              <Truck className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Fast Delivery</h3>
              <p className="text-muted-foreground">
                Quick and reliable delivery across Ghana with real-time tracking.
              </p>
            </div>

            <div className="text-center p-6 bg-card rounded-lg border">
              <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">24/7 Support</h3>
              <p className="text-muted-foreground">
                Round-the-clock customer support to help with your shopping needs.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 text-center bg-primary/5 rounded-lg">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Start Shopping?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of satisfied customers shopping at Kantamanto Market Online
          </p>
          <Link to="/shop">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Explore Products Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
