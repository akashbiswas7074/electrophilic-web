"use client";

import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Mail, MapPin, Phone, Send } from "lucide-react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    // Validate the form
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setError("All fields are required.");
      setIsLoading(false);
      return;
    }

    // Simple email validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: ""
        });
        toast({
          title: "Message sent successfully!",
          description: "We'll get back to you as soon as possible.",
          variant: "default",
        });
      } else {
        setError(result.message || "Failed to send message. Please try again later.");
        toast({
          title: "Error sending message",
          description: result.message || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again later.");
      toast({
        title: "Error",
        description: "Network error. Please check your connection and try again.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-white pb-12">
      {/* Header Banner */}
      <div className="bg-white text-white">
        <div className="container mx-auto py-12 px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-800">Contact Us</h1>
          <p className="mt-2 text-neutral-600">Have questions? We're here to help.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-1">
            <Card className="shadow-md h-full">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle>Get In Touch</CardTitle>
                <CardDescription>We'd love to hear from you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Our Location</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      123 Shopping Avenue, Fashion District<br />
                      New York, NY 10001
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Email Us</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      <a href="mailto:support@vibecart.com" className="hover:underline text-primary">
                        support@vibecart.com
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Call Us</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      <a href="tel:+1-800-123-4567" className="hover:underline text-primary">
                        +1 (800) 123-4567
                      </a>
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t">
                  <h3 className="font-medium mb-2">Business Hours</h3>
                  <ul className="text-sm text-gray-500 space-y-1">
                    <li className="flex justify-between">
                      <span>Monday - Friday:</span>
                      <span>9:00 AM - 6:00 PM</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Saturday:</span>
                      <span>10:00 AM - 4:00 PM</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Sunday:</span>
                      <span>Closed</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-md">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle>Send a Message</CardTitle>
                <CardDescription>Fill out the form below and we'll get back to you as soon as possible.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {success ? (
                  <div className="text-center py-8">
                    <div className="mx-auto w-12 h-12 flex items-center justify-center bg-green-100 rounded-full mb-4">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-xl font-medium text-green-600 mb-2">Message Sent Successfully!</h3>
                    <p className="text-gray-600 mb-6">
                      Thank you for reaching out. We've received your message and will respond shortly.
                    </p>
                    <Button 
                      onClick={() => setSuccess(false)} 
                      variant="outline"
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="flex items-center p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
                        <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Your Name <span className="text-red-500">*</span></Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="John Doe"
                          required
                          className="bg-white"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Your Email <span className="text-red-500">*</span></Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="john.doe@example.com"
                          required
                          className="bg-white"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject <span className="text-red-500">*</span></Label>
                      <Input
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="Inquiry about my order"
                        required
                        className="bg-white"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message <span className="text-red-500">*</span></Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Please provide details about your inquiry..."
                        rows={6}
                        required
                        className="bg-white resize-y"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="pt-2">
                      <Button 
                        type="submit" 
                        className="w-full sm:w-auto"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            Send Message
                            <Send className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-white">
                  <h3 className="font-medium">How do I track my order?</h3>
                  <p className="text-gray-600 mt-2 text-sm">
                    You can track your order by visiting the <Link href="/track-order" className="text-primary hover:underline">Order Tracking</Link> page 
                    and entering your order ID and email address.
                  </p>
                </div>
                <div className="border rounded-lg p-4 bg-white">
                  <h3 className="font-medium">What is your return policy?</h3>
                  <p className="text-gray-600 mt-2 text-sm">
                    We accept returns within 30 days of purchase. Please visit our <Link href="/return-policy" className="text-primary hover:underline">Return Policy</Link> page 
                    for more information.
                  </p>
                </div>
                <div className="border rounded-lg p-4 bg-white">
                  <h3 className="font-medium">How long does shipping take?</h3>
                  <p className="text-gray-600 mt-2 text-sm">
                    Standard shipping typically takes 3-5 business days. Express shipping options are available at checkout.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
