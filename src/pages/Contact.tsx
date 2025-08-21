
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, MessageCircle, Clock, Users } from "lucide-react";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Handle form submission
    alert("Thank you for your message! We'll get back to you soon.");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: "Visit Us",
      details: [
        "Kantamanto Market",
        "Accra Central, Accra",
        "Greater Accra Region, Ghana"
      ]
    },
    {
      icon: Phone,
      title: "Call Us",
      details: [
        "+233 30 123 4567",
        "+233 24 555 0123",
        "Mon-Sat: 8AM-6PM"
      ]
    },
    {
      icon: Mail,
      title: "Email Us",
      details: [
        "info@kantamantomarket.com",
        "support@kantamantomarket.com",
        "vendors@kantamantomarket.com"
      ]
    }
  ];

  const faqItems = [
    {
      question: "How do I become a vendor?",
      answer: "Visit our Vendor Dashboard, create an account, and submit your application with your business details. Our team will review and approve qualified vendors within 2-3 business days."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept Mobile Money (MTN, Vodafone, AirtelTigo), Bank transfers, and Cash on Delivery for customers in Accra and surrounding areas."
    },
    {
      question: "How long does delivery take?",
      answer: "Delivery within Accra typically takes 1-2 business days. For other regions in Ghana, delivery takes 3-5 business days depending on location."
    },
    {
      question: "Can I return items?",
      answer: "Yes, we have a 7-day return policy for items that don't match the description. Items must be in original condition for returns."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Get in <span className="text-orange-500">Touch</span>
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Have questions about shopping, becoming a vendor, or need support? 
            We're here to help! Reach out to us using any of the methods below.
          </p>
        </div>

        {/* Contact Options */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {contactInfo.map((info, index) => (
            <Card key={index} className="border-none shadow-sm text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <info.icon className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {info.title}
                </h3>
                <div className="space-y-1">
                  {info.details.map((detail, idx) => (
                    <p key={idx} className="text-gray-600">
                      {detail}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Contact Form */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Send us a Message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                  <Input
                    placeholder="Your Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                
                <Input
                  placeholder="Subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  required
                />
                
                <Textarea
                  placeholder="Your Message"
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  required
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-orange-500 hover:bg-orange-600"
                >
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Actions & Info */}
          <div className="space-y-6">
            {/* WhatsApp Contact */}
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Quick WhatsApp Support</h3>
                    <p className="text-gray-600 text-sm">Get instant help via WhatsApp</p>
                  </div>
                  <Button className="bg-green-500 hover:bg-green-600">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat Now
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Support Hours */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-orange-500" />
                  Support Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Monday - Friday:</span>
                    <span className="font-medium">8:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday:</span>
                    <span className="font-medium">9:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday:</span>
                    <span className="font-medium">Closed</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  * Emergency vendor support available 24/7 via WhatsApp
                </p>
              </CardContent>
            </Card>

            {/* Community */}
            <Card className="border-none shadow-sm">
              <CardContent className="p-6">
                <div className="text-center">
                  <Users className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Join Our Community</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Connect with other vendors and customers in our community groups
                  </p>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full">
                      Facebook Group
                    </Button>
                    <Button variant="outline" className="w-full">
                      Telegram Channel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find quick answers to common questions about our platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {faqItems.map((faq, index) => (
              <Card key={index} className="border-none shadow-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Location */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-center">
              <MapPin className="w-6 h-6 inline mr-2 text-orange-500" />
              Find Us at Kantamanto Market
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <p className="text-gray-700 mb-4">
                Visit our physical location at the heart of Kantamanto Market, Accra Central. 
                Our team is available to assist vendors and answer questions about the platform.
              </p>
              <div className="text-sm text-gray-600">
                <p><strong>Address:</strong> Kantamanto Market, Accra Central, Greater Accra Region</p>
                <p><strong>Nearest Landmark:</strong> Central Business District, Accra</p>
                <p><strong>Public Transport:</strong> Accessible by trotro, bus, and taxi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Contact;
