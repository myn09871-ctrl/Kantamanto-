
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, Users, Smartphone, Star, Shield, Truck } from "lucide-react";

const Index = () => {
  const benefits = [
    {
      icon: ShoppingBag,
      title: "Convenient Shopping",
      description: "Browse thousands of products from Kantamanto vendors online"
    },
    {
      icon: Users,
      title: "Trusted Vendors",
      description: "Shop from verified Kantamanto Market vendors"
    },
    {
      icon: Smartphone,
      title: "Mobile Money",
      description: "Pay easily with Mobile Money or Cash on Delivery"
    },
    {
      icon: Shield,
      title: "Secure Platform",
      description: "Safe and secure marketplace for all your needs"
    },
    {
      icon: Truck,
      title: "Fast Delivery",
      description: "Quick delivery across Accra and surrounding areas"
    },
    {
      icon: Star,
      title: "Quality Products",
      description: "Rate and review vendors to ensure quality"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-800 dark:to-gray-900 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Welcome to{" "}
              <span className="text-orange-500">Kantamanto Market</span>{" "}
              Online
            </h1>
            <p className="text-xl lg:text-2xl text-gray-700 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Ghana's largest second-hand market is now online! Shop from thousands of verified vendors, 
              enjoy convenient mobile payments, and support local businesses.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/shop">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg">
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Shop Now
                </Button>
              </Link>
              <Link to="/vendor">
                <Button size="lg" variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-50 dark:hover:bg-gray-700 dark:border-orange-400 dark:text-orange-400 px-8 py-3 text-lg">
                  <Users className="w-5 h-5 mr-2" />
                  Become a Vendor
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Kantamanto Market Online?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Bringing Ghana's iconic market to your fingertips with modern convenience and trusted quality.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-none shadow-sm hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-6 h-6 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Digital Inclusion Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Empowering Ghana's Digital Future
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Kantamanto Market Online is more than just an e-commerce platform. We're bridging the digital divide, 
              helping traditional market vendors reach customers online while preserving the authentic shopping experience 
              Ghana loves.
            </p>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-sm max-w-4xl mx-auto border dark:border-gray-700">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-orange-500 mb-2">1000+</div>
                  <div className="text-gray-600 dark:text-gray-300">Registered Vendors</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-500 mb-2">50K+</div>
                  <div className="text-gray-600 dark:text-gray-300">Products Available</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-500 mb-2">24/7</div>
                  <div className="text-gray-600 dark:text-gray-300">Online Shopping</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Start Shopping?
          </h2>
          <p className="text-xl text-gray-300 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of happy customers who shop with confidence on Kantamanto Market Online.
          </p>
          <Link to="/shop">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg">
              Explore Products
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
