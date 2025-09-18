"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Calendar, 
  Users, 
  Star, 
  ArrowRight, 
  Play,
  Shield,
  Globe,
  Heart,
  Zap,
  Camera,
  Compass
} from "lucide-react";

export default function LandingPage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const heroImages = [
    "/api/placeholder/1920/1080/FF6B35/FFFFFF?text=Serengeti+Sunset",
    "/api/placeholder/1920/1080/2E8B57/FFFFFF?text=Masai+Mara+Wildlife",
    "/api/placeholder/1920/1080/8B4513/FFFFFF?text=Amboseli+Elephants",
    "/api/placeholder/1920/1080/4682B4/FFFFFF?text=Tsavo+Landscape"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <Globe className="h-8 w-8 text-green-600" />,
      title: "Multi-Destination Tours",
      description: "Explore Serengeti, Masai Mara, Amboseli, and more with expertly crafted itineraries."
    },
    {
      icon: <Shield className="h-8 w-8 text-blue-600" />,
      title: "Trusted Partners",
      description: "Carefully selected hotels, camps, and transport providers for your safety and comfort."
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-600" />,
      title: "Instant Quotes",
      description: "Get real-time pricing for your safari adventure with our advanced booking system."
    },
    {
      icon: <Heart className="h-8 w-8 text-red-600" />,
      title: "Personalized Service",
      description: "Tailored experiences designed around your preferences and travel style."
    }
  ];

  const safariTypes = [
    {
      name: "Wildlife Safari",
      description: "Classic game drives in iconic national parks",
      image: "/api/placeholder/400/300/FF6B35/FFFFFF?text=Wildlife+Safari",
      price: "From $150/day"
    },
    {
      name: "Luxury Camping",
      description: "Glamping experiences under African skies",
      image: "/api/placeholder/400/300/2E8B57/FFFFFF?text=Luxury+Camping",
      price: "From $300/night"
    },
    {
      name: "Cultural Tours",
      description: "Authentic experiences with local communities",
      image: "/api/placeholder/400/300/8B4513/FFFFFF?text=Cultural+Tours",
      price: "From $200/day"
    },
    {
      name: "Photography Safari",
      description: "Capture stunning wildlife moments",
      image: "/api/placeholder/400/300/4682B4/FFFFFF?text=Photography+Safari",
      price: "From $400/day"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      location: "New York, USA",
      rating: 5,
      comment: "The Serengeti experience was beyond our wildest dreams. Perfect organization and unforgettable memories!"
    },
    {
      name: "Michael Chen",
      location: "London, UK",
      rating: 5,
      comment: "Amazing wildlife encounters and the camping was absolutely magical. Highly recommend!"
    },
    {
      name: "Emma Rodriguez",
      location: "Toronto, Canada",
      rating: 5,
      comment: "Professional service from start to finish. The Masai Mara tour was spectacular!"
    }
  ];

  const stats = [
    { number: "500+", label: "Happy Travelers" },
    { number: "50+", label: "Safari Routes" },
    { number: "25+", label: "Partner Lodges" },
    { number: "98%", label: "Satisfaction Rate" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Images */}
        <div className="absolute inset-0">
          {heroImages.map((image, index) => (
            <div
              key={`landing-${index}`}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div 
                className="w-full h-full bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${image})` }}
              />
              <div className="absolute inset-0 bg-black/40" />
            </div>
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center text-white px-4 max-w-6xl mx-auto">
          <Badge variant="secondary" className="mb-6 bg-white/20 text-white border-white/30">
            🦁 #1 Safari Experience in East Africa
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Discover the
            <span className="block text-green-400">Wild Heart</span>
            of Africa
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-gray-200">
            Experience the magic of the Serengeti, witness the Great Migration, and create memories that last a lifetime with our expertly crafted safari adventures.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8 py-4">
              Start Your Adventure
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900 text-lg px-8 py-4">
              <Play className="mr-2 h-5 w-5" />
              Watch Video
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Safari Quote?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We combine local expertise with cutting-edge technology to deliver unforgettable safari experiences
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={`landing-${index}`} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safari Types Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Safari Experience
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From thrilling wildlife encounters to luxurious camping experiences, we have the perfect adventure for you
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {safariTypes.map((safari, index) => (
              <div key={`landing-${index}`} className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-lg shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <div 
                    className="h-48 bg-cover bg-center bg-no-repeat group-hover:scale-105 transition-transform duration-500"
                    style={{ backgroundImage: `url(${safari.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-xl font-bold mb-2">{safari.name}</h3>
                    <p className="text-sm text-gray-200 mb-3">{safari.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-green-400 font-semibold">{safari.price}</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-green-600">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={`landing-${index}`} className="text-white">
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.number}</div>
                <div className="text-lg text-green-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Our Travelers Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Don't just take our word for it - hear from adventurers who've experienced the magic
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={`landing-${index}`} className="bg-white p-8 rounded-lg shadow-lg">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.comment}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-gray-500 text-sm flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {testimonial.location}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Start Your African Adventure?
          </h2>
          <p className="text-xl mb-8 text-green-100">
            Join thousands of travelers who've discovered the magic of Africa with Safari Quote
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 text-lg px-8 py-4">
              Get Your Quote Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600 text-lg px-8 py-4">
              <Compass className="mr-2 h-5 w-5" />
              Explore Destinations
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-green-400 mb-4">Safari Quote</h3>
              <p className="text-gray-400 mb-4">
                Your gateway to unforgettable African adventures. Expertly crafted safaris that connect you with the wild heart of Africa.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors cursor-pointer">
                  <Camera className="h-5 w-5" />
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors cursor-pointer">
                  <Globe className="h-5 w-5" />
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors cursor-pointer">
                  <Heart className="h-5 w-5" />
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Destinations</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Serengeti National Park</li>
                <li>Masai Mara Reserve</li>
                <li>Amboseli National Park</li>
                <li>Tsavo National Park</li>
                <li>Ngorongoro Crater</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Experiences</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Wildlife Safaris</li>
                <li>Luxury Camping</li>
                <li>Cultural Tours</li>
                <li>Photography Safaris</li>
                <li>Bird Watching</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>+254 700 000 000</li>
                <li>info@safariquote.com</li>
                <li>Nairobi, Kenya</li>
                <li>24/7 Support</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Safari Quote. All rights reserved. | Privacy Policy | Terms of Service</p>
          </div>
        </div>
      </footer>
    </div>
  );
}


