
import { Card, CardContent } from "@/components/ui/card";
import { Users, Target, Heart, Globe } from "lucide-react";

const About = () => {
  const values = [
    {
      icon: Users,
      title: "Community First",
      description: "Supporting Kantamanto Market vendors and preserving the community spirit that makes this market special."
    },
    {
      icon: Target,
      title: "Digital Inclusion",
      description: "Bridging the digital divide by bringing traditional market vendors into the online economy."
    },
    {
      icon: Heart,
      title: "Authentic Experience",
      description: "Maintaining the authentic shopping experience while adding modern convenience and accessibility."
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Connecting Ghanaian vendors with customers around the world while staying rooted in local culture."
    }
  ];

  const team = [
    {
      name: "Kwame Asante",
      role: "Founder & CEO",
      description: "Former tech executive passionate about digital inclusion in Ghana"
    },
    {
      name: "Akosua Mensah",
      role: "Head of Vendor Relations",
      description: "Kantamanto Market veteran with 15+ years of experience"
    },
    {
      name: "Michael Osei",
      role: "Technical Director",
      description: "Software engineer specializing in e-commerce platforms"
    }
  ];

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            About <span className="text-orange-500">Kantamanto Market</span> Online
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            We're on a mission to digitize Ghana's largest second-hand market, empowering vendors 
            and customers while preserving the authentic Kantamanto experience.
          </p>
        </div>

        {/* Story Section */}
        <div className="mb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Kantamanto Market in Accra is West Africa's largest second-hand clothing market, 
                  serving thousands of vendors and millions of customers. For decades, this vibrant 
                  marketplace has been the heart of affordable fashion and entrepreneurship in Ghana.
                </p>
                <p>
                  However, many vendors struggled to reach customers beyond the physical market. 
                  Young entrepreneurs had limited access to digital tools, and customers from other 
                  regions couldn't access the incredible variety of products available.
                </p>
                <p>
                  Kantamanto Market Online was born to bridge this gap, creating a digital platform 
                  that preserves the community spirit of the traditional market while opening new 
                  opportunities for growth and connection.
                </p>
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-8">
              <img 
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&h=400&fit=crop" 
                alt="Traditional market scene"
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
              <p className="text-center text-gray-600 italic">
                "Bringing the spirit of Kantamanto Market to the digital world"
              </p>
            </div>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="mb-20">
          <div className="grid md:grid-cols-2 gap-12">
            <Card className="border-none shadow-sm">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
                <p className="text-gray-700">
                  To empower Kantamanto Market vendors with digital tools and platforms that expand 
                  their reach, increase their income, and preserve the authentic market experience 
                  for customers worldwide.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
                <p className="text-gray-700">
                  To become the leading digital marketplace for African fashion and second-hand goods, 
                  setting the standard for inclusive e-commerce that benefits both vendors and customers 
                  across the continent.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Values */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              These core values guide everything we do as we build a platform that serves 
              our community and preserves the spirit of Kantamanto Market.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="border-none shadow-sm text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-6 h-6 text-orange-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Impact */}
        <div className="mb-20 bg-orange-50 rounded-lg p-8 lg:p-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Impact</h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Since launching, we've made significant strides in digitalizing the Kantamanto Market ecosystem.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-orange-500 mb-2">500+</div>
              <div className="text-gray-700 font-medium">Vendors Onboarded</div>
              <div className="text-sm text-gray-600 mt-1">
                Helping traditional vendors go digital
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-500 mb-2">₵2M+</div>
              <div className="text-gray-700 font-medium">Revenue Generated</div>
              <div className="text-sm text-gray-600 mt-1">
                Direct economic impact for vendors
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-500 mb-2">15K+</div>
              <div className="text-gray-700 font-medium">Happy Customers</div>
              <div className="text-sm text-gray-600 mt-1">
                Across Ghana and beyond
              </div>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're a passionate team combining deep market knowledge with technical expertise 
              to serve the Kantamanto community.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="border-none shadow-sm text-center">
                <CardContent className="p-6">
                  <div className="w-20 h-20 bg-orange-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl font-bold text-orange-500">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-orange-500 font-medium mb-3">
                    {member.role}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {member.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gray-900 rounded-lg p-8 lg:p-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Join Our Journey
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Whether you're a vendor looking to grow your business or a customer seeking 
            authentic African fashion, we invite you to be part of our story.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-medium">
              Become a Vendor
            </button>
            <button className="border border-gray-300 text-white hover:bg-gray-800 px-8 py-3 rounded-lg font-medium">
              Start Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
