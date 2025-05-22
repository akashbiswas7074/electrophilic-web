"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox"; // Add Checkbox import
import { getAllUserOrdersProfile } from "@/lib/database/actions/user.actions";
import { getSavedCartForUser } from "@/lib/database/actions/cart.actions";
import { toast } from "sonner";
import { 
  User, CreditCard, LogOut, ShoppingBag, MapPin, Settings, 
  Camera, Loader2, ChevronRight, CalendarDays, Package, ShoppingCart,
  Mail, Trash2, Plus, Check, Phone
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import PhoneVerificationForm from "@/components/shared/auth/PhoneVerificationForm"; // Import the PhoneVerificationForm component

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status, update: updateSession } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/auth/signin?callbackUrl=/profile");
    },
  });
  
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    image: "",
    username: "",
  });
  const [orders, setOrders] = useState<{ id: any; date: string; status: string; total: number; items: any[] }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartTotal, setCartTotal] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("profile");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [addressFormErrors, setAddressFormErrors] = useState<{[key: string]: string}>({});
  const [isAddressFormSubmitting, setIsAddressFormSubmitting] = useState(false);
  
  // Form state for address
  const [addressForm, setAddressForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "", 
    address1: "",
    address2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
    isDefault: false,
  });

  // Consolidated data fetching in a single useEffect
  useEffect(() => {
    const fetchUserData = async () => {
      if (status === "authenticated" && session?.user) {
        try {
          // Set profile data from session
          setProfile({
            firstName: session.user.firstName || "",
            lastName: session.user.lastName || "",
            email: session.user.email || "",
            image: session.user.image || "",
            username: session.user.username || "",
          });

          // Fetch extended profile data if needed
          try {
            const profileResponse = await fetch(`/api/user/profile?userId=${session.user.id}`);
            if (profileResponse.ok) {
              const extendedProfile = await profileResponse.json();
              if (extendedProfile.user) {
                // If database image doesn't match session image, update session
                if (extendedProfile.user.image && extendedProfile.user.image !== session.user.image) {
                  await updateSession({ image: extendedProfile.user.image });
                  console.log("Session image synchronized with database");
                }
                
                setProfile(prev => ({
                  ...prev,
                  image: extendedProfile.user.image || prev.image,
                }));
              }
            }
          } catch (error) {
            console.error("Error fetching extended profile data:", error);
          }

          // Fetch orders
          try {
            const userOrders = await getAllUserOrdersProfile(session.user.id);
            setOrders(userOrders || []);
            console.log("Orders fetched:", userOrders);
          } catch (error) {
            console.error("Error fetching orders:", error);
          }

          // Fetch saved cart
          try {
            if (session.user.id) {
              const cartData = await getSavedCartForUser(session.user.id);
              if (cartData?.success && cartData?.cart?.products?.length > 0) {
                setCartItems(cartData.cart.products);
                setCartTotal(cartData.cart.cartTotal || 0);
                console.log("Cart fetched:", cartData.cart);
              }
            }
          } catch (error) {
            console.error("Error fetching cart:", error);
          }
          
          // Fetch user addresses
          try {
            const addressResponse = await fetch('/api/user/address', {
              credentials: 'include' // Ensure cookies are sent
            });
            
            if (addressResponse.ok) {
              const addressData = await addressResponse.json();
              if (addressData.success && addressData.addresses) {
                setAddresses(addressData.addresses);
                console.log("Addresses fetched:", addressData.addresses);
              }
            } else {
              console.error("Error fetching addresses:", await addressResponse.text());
            }
          } catch (error) {
            console.error("Error fetching addresses:", error);
          }
          
        } catch (error) {
          console.error("Error in profile data loading:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router, updateSession]); // Added updateSession to dependency array

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          username: profile.username,
          email: profile.email, // Add email to the request body
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }
      
      // Update the session to reflect the changes
      await updateSession({
        firstName: profile.firstName,
        lastName: profile.lastName,
        username: profile.username,
        email: profile.email, // Add email to the session update
      });
      
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || 'Error updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Preview image
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Upload image
      uploadImage(file);
    }
  };
  
  const uploadImage = async (file: File) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const res = await fetch("/api/user/upload", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success("Profile image updated");
        
        // Update session with new image URL
        await updateSession({ 
          image: data.image 
        });
        
        // Update profile state
        setProfile(prev => ({ ...prev, image: data.image }));
        
        // Force a refresh to ensure UI consistency
        setTimeout(() => {
          router.refresh();
        }, 500);
      } else {
        throw new Error(data.message || "Failed to upload image");
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error(error.message || "Failed to upload image");
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleProceedToCheckout = () => {
    if (!session || status !== "authenticated") {
      toast.error("Please sign in to checkout");
      router.push("/auth/signin?callbackUrl=/checkout");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    router.push('/checkout');
  };

  // Validate the address form
  const validateAddressForm = () => {
    const errors: {[key: string]: string} = {};
    
    // Required fields
    if (!addressForm.firstName.trim()) 
      errors.firstName = "First name is required";
    else if (addressForm.firstName.trim().length < 2)
      errors.firstName = "First name must be at least 2 characters";
      
    if (!addressForm.lastName.trim()) 
      errors.lastName = "Last name is required";
    else if (addressForm.lastName.trim().length < 2)
      errors.lastName = "Last name must be at least 2 characters";
      
    if (!addressForm.phoneNumber.trim()) 
      errors.phoneNumber = "Phone number is required";
    else if (!/^\+?[1-9]\d{1,14}$/.test(addressForm.phoneNumber))
      errors.phoneNumber = "Invalid phone number format";
      
    if (!addressForm.address1.trim()) 
      errors.address1 = "Address line 1 is required";
    else if (addressForm.address1.trim().length < 5)
      errors.address1 = "Address line 1 must be at least 5 characters";
      
    if (!addressForm.city.trim()) 
      errors.city = "City is required";
    else if (addressForm.city.trim().length < 2)
      errors.city = "City must be at least 2 characters";
      
    if (!addressForm.state.trim()) 
      errors.state = "State is required";
    else if (addressForm.state.trim().length < 2)
      errors.state = "State must be at least 2 characters";
      
    if (!addressForm.zipCode.trim()) 
      errors.zipCode = "ZIP code is required";
    else if (!/^\d{6}$/.test(addressForm.zipCode))
      errors.zipCode = "ZIP code must be 6 digits";
      
    setAddressFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form input change
  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field if set
    if (addressFormErrors[name]) {
      setAddressFormErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (checked: boolean) => {
    setAddressForm(prev => ({
      ...prev,
      isDefault: checked
    }));
  };

  // Handle form submission
  const handleAddressFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAddressForm()) {
      return;
    }
    
    setIsAddressFormSubmitting(true);
    
    try {
      // Determine if we're creating a new address or updating an existing one
      const method = editingAddress?._id ? 'PUT' : 'POST';
      const endpoint = '/api/user/address';
      
      // Format the request body correctly based on method
      let body;
      if (method === 'PUT') {
        // PUT request format for updating
        body = { 
          addressId: editingAddress._id, 
          action: 'update',
          // Spread individual form fields to match API expectations 
          firstName: addressForm.firstName,
          lastName: addressForm.lastName,
          phoneNumber: addressForm.phoneNumber,
          address1: addressForm.address1,
          address2: addressForm.address2,
          city: addressForm.city,
          state: addressForm.state,
          zipCode: addressForm.zipCode,
          country: addressForm.country,
          isDefault: addressForm.isDefault
        };
      } else {
        // POST request format for creating - wrap in address object
        body = { 
          address: {
            firstName: addressForm.firstName,
            lastName: addressForm.lastName,
            phoneNumber: addressForm.phoneNumber,
            address1: addressForm.address1,
            address2: addressForm.address2,
            city: addressForm.city,
            state: addressForm.state,
            zipCode: addressForm.zipCode,
            country: addressForm.country,
            isDefault: addressForm.isDefault
          }
        };
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save address');
      }
      
      toast.success(editingAddress ? 'Address updated successfully' : 'Address added successfully');
      
      // Update addresses in state
      if (editingAddress) {
        // Update existing address in the list
        setAddresses(prevAddresses => 
          prevAddresses.map(addr => 
            addr._id === editingAddress._id ? data.address : addr
          )
        );
        
        // If the updated address is now the default, make sure other addresses are not default
        if (addressForm.isDefault) {
          setAddresses(prevAddresses => 
            prevAddresses.map(addr => ({
              ...addr,
              isDefault: addr._id === editingAddress._id
            }))
          );
        }
      } else {
        // Add the new address to the list
        const newAddress = data.address;
        
        // If this is the new default, update all addresses
        if (newAddress.isDefault) {
          setAddresses(prevAddresses => 
            [...prevAddresses.map(addr => ({
              ...addr,
              isDefault: false
            })), newAddress]
          );
        } else {
          setAddresses(prevAddresses => [...prevAddresses, newAddress]);
        }
      }
      
      // Close the form
      setShowAddressForm(false);
    } catch (error: any) {
      console.error("Error saving address:", error);
      toast.error(error.message || 'Failed to save address');
    } finally {
      setIsAddressFormSubmitting(false);
    }
  };

  // Add delete address function
  const handleDeleteAddress = async (addressId: string) => {
    if (confirm("Are you sure you want to delete this address?")) {
      try {
        toast.loading("Deleting address...");
        
        const response = await fetch('/api/user/address', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ addressId }),
          credentials: 'include',
        });
        
        const data = await response.json();
        toast.dismiss();
        
        if (response.ok && data.success) {
          setAddresses(prevAddresses => prevAddresses.filter(addr => addr._id !== addressId));
          toast.success("Address deleted successfully");
        } else {
          throw new Error(data.message || "Failed to delete address");
        }
      } catch (error: any) {
        toast.dismiss();
        toast.error(error.message || "Error deleting address");
        console.error("Error deleting address:", error);
      }
    }
  };

  // Add set default address function
  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      toast.loading("Setting as default address...");
      
      const response = await fetch('/api/user/address', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          addressId, 
          action: 'update',
          isDefault: true 
        }),
        credentials: 'include',
      });
      
      const data = await response.json();
      toast.dismiss();
      
      if (response.ok && data.success) {
        // Update addresses list to reflect the new default
        setAddresses(prevAddresses => 
          prevAddresses.map(addr => ({
            ...addr,
            isDefault: addr._id === addressId
          }))
        );
        toast.success("Default address updated");
      } else {
        throw new Error(data.message || "Failed to update default address");
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || "Error updating default address");
      console.error("Error setting default address:", error);
    }
  };

  // Reset form when editing address changes
  useEffect(() => {
    if (editingAddress) {
      setAddressForm({
        firstName: editingAddress.firstName || "",
        lastName: editingAddress.lastName || "",
        phoneNumber: editingAddress.phoneNumber || "",
        address1: editingAddress.address1 || "",
        address2: editingAddress.address2 || "",
        city: editingAddress.city || "",
        state: editingAddress.state || "",
        zipCode: editingAddress.zipCode || "",
        country: editingAddress.country || "India",
        isDefault: editingAddress.isDefault || false,
      });
    } else {
      // Reset to defaults when adding new address
      setAddressForm({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phoneNumber: "",
        address1: "",
        address2: "",
        city: "",
        state: "",
        zipCode: "",
        country: "India",
        isDefault: addresses.length === 0 ? true : false, // Default if first address
      });
    }
    setAddressFormErrors({});
  }, [editingAddress, profile.firstName, profile.lastName, addresses.length]);

  // Add handler for opening the address form
  const handleAddAddress = () => {
    setEditingAddress(null); // Ensure we're not in edit mode
    setShowAddressForm(true);
  };

  // Add handler for opening the edit address form
  const handleEditAddress = (address: any) => {
    setEditingAddress(address);
    setShowAddressForm(true);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-12">
      {/* Header Banner - Removing gradient background */}
      <div className="bg-white text-white">
        <div className="container mx-auto py-12 px-4">
          <h1 className="text-3xl md:text-4xl font-bold">My Account</h1>
          <p className="mt-2 text-neutral-800">Manage your profile, orders, and preferences</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="md:col-span-1">
            <Card className="border shadow-sm">
              <CardHeader className="text-center pb-2">
                <div className="relative mx-auto">
                  <Avatar
                    className="h-24 w-24 mx-auto border-4 border-white shadow-md"
                    onClick={handleImageClick}
                  >
                    <AvatarImage
                      src={imagePreview || profile.image || "/placeholder-avatar.png"}
                      alt={`${profile.firstName} ${profile.lastName}`}
                    />
                    <AvatarFallback className="text-xl bg-primary/10 text-primary">
                      {profile.firstName?.charAt(0)?.toUpperCase() || "U"}
                      {profile.lastName?.charAt(0)?.toUpperCase() || ""}
                    </AvatarFallback>
                  </Avatar>

                  <button
                    onClick={handleImageClick}
                    className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 shadow-md hover:bg-primary/90 transition-colors"
                    aria-label="Change profile picture"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                  <Input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
                <div className="mt-4">
                  <CardTitle className="text-xl">
                    {profile.firstName} {profile.lastName}
                  </CardTitle>
                  <CardDescription>@{profile.username || "username"}</CardDescription>
                </div>
              </CardHeader>

              <CardContent className="py-2">
                <div className="flex flex-col space-y-1 text-sm mt-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Joined {new Date().toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="space-y-1 mt-4">
                  <Button
                    variant={activeTab === "profile" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("profile")}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Personal Info
                  </Button>
                  <Button
                    variant={activeTab === "orders" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("orders")}
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Orders
                  </Button>
                  <Button
                    variant={activeTab === "addresses" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("addresses")}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Addresses
                  </Button>
                  <Button
                    variant={activeTab === "cart" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("cart")}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Cart
                  </Button>
                  <Button
                    variant={activeTab === "settings" ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveTab("settings")}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Preferences
                  </Button>
                </nav>
              </CardContent>

              <CardFooter className="pt-2">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    // Add your logout logic here
                    router.push('/auth/signin');
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </CardFooter>
            </Card>

            <Card className="border shadow-sm mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Link href="/help/faq" className="block text-primary hover:underline">Frequently Asked Questions</Link>
                <Link href="/help/contact" className="block text-primary hover:underline">Contact Customer Support</Link>
                <Link href="/help/returns" className="block text-primary hover:underline">Return Policy</Link>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-2 lg:col-span-3 space-y-6">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <Card className="border shadow-sm">
                <CardHeader className="bg-gray-50 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>Update your personal details</CardDescription>
                    </div>
                    <div className="bg-white p-2 rounded-full">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={profile.firstName}
                          onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                          className="bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={profile.lastName}
                          onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                          className="bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          name="username"
                          value={profile.username}
                          onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                          className="bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                          className="bg-white"
                        />
                      </div>
                    </div>

                    <Button type="submit" className="mt-4">
                      Update Profile
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <Card className="border shadow-sm">
                <CardHeader className="bg-gray-50 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Order History</CardTitle>
                      <CardDescription>View and track your recent orders</CardDescription>
                    </div>
                    <div className="bg-white p-2 rounded-full">
                      <ShoppingBag className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {orders && orders.length > 0 ? (
                    <div className="space-y-6">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="bg-white border rounded-lg shadow-sm p-4 transition-all hover:shadow-md"
                        >
                          <div className="flex flex-wrap justify-between items-start mb-3 pb-3 border-b">
                            <div>
                              <p className="font-medium">Order #{order.id.substring(0, 8)}</p>
                              <p className="text-sm text-gray-500">{order.date}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">${order.total.toFixed(2)}</p>
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                order.status === 'Delivered' 
                                  ? 'bg-green-100 text-green-800' 
                                  : order.status === 'Processing' 
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status || 'Processing'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Order items preview (show first 2) */}
                          <div className="space-y-2 mb-3">
                            {(order.items || []).slice(0, 2).map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-gray-100 rounded-md mr-3 overflow-hidden">
                                    {item.image && (
                                      <Image
                                        src={item.image}
                                        alt={item.name}
                                        width={32}
                                        height={32}
                                        className="w-full h-full object-cover"
                                      />
                                    )}
                                  </div>
                                  <span className="text-sm">{item.name} × {item.quantity}</span>
                                </div>
                                <span className="text-sm font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                            
                            {(order.items || []).length > 2 && (
                              <p className="text-xs text-gray-500">
                                + {order.items.length - 2} more item(s)
                              </p>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/order/${order.id}`} className="inline-flex items-center">
                                View Details <ChevronRight className="ml-1 h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed rounded-lg">
                      <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No orders yet</h3>
                      <p className="text-gray-500 mb-4">When you place orders, they'll appear here</p>
                      <Button asChild>
                        <Link href="/">Start Shopping</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Addresses Tab */}
            {activeTab === "addresses" && (
              <Card className="border shadow-sm">
                <CardHeader className="bg-gray-50 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>My Addresses</CardTitle>
                      <CardDescription>Manage your shipping and billing addresses</CardDescription>
                    </div>
                    <div className="bg-white p-2 rounded-full">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {addresses && addresses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((address, index) => (
                        <div
                          key={address._id}
                          className="border rounded-lg p-4 relative bg-white"
                        >
                          {address.isDefault && (
                            <span className="absolute top-2 right-2 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                              Default
                            </span>
                          )}
                          <p className="font-medium">
                            {address.firstName} {address.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {address.address1}
                            {address.address2 && <span>, {address.address2}</span>}
                          </p>
                          <p className="text-sm text-gray-600">
                            {address.city}, {address.state} {address.zipCode}
                          </p>
                          <p className="text-sm text-gray-600 mb-3">
                            {address.country}
                          </p>
                          <p className="text-sm text-gray-600 mb-3">
                            Phone: {address.phoneNumber}
                          </p>
                          <div className="flex space-x-2 mt-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditAddress(address)}
                            >
                              Edit
                            </Button>
                            {!address.isDefault && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleSetDefaultAddress(address._id)}
                              >
                                Set as Default
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                              onClick={() => handleDeleteAddress(address._id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" /> Delete
                            </Button>
                          </div>
                        </div>
                      ))}

                      {/* Add New Address Card */}
                      <div className="border border-dashed rounded-lg p-4 flex flex-col items-center justify-center h-[200px]">
                        <MapPin className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-gray-500 mb-3 text-center">Add a new address</p>
                        <Button variant="outline" onClick={handleAddAddress}>
                          <Plus className="h-4 w-4 mr-2" /> Add Address
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed rounded-lg">
                      <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No addresses saved</h3>
                      <p className="text-gray-500 mb-4">Add an address to make checkout faster</p>
                      <Button onClick={handleAddAddress}>
                        <Plus className="h-4 w-4 mr-2" /> Add Address
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Cart Tab */}
            {activeTab === "cart" && (
              <Card className="border shadow-sm">
                <CardHeader className="bg-gray-50 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>My Cart</CardTitle>
                      <CardDescription>Review your items and checkout</CardDescription>
                    </div>
                    <div className="bg-white p-2 rounded-full">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {cartItems && cartItems.length > 0 ? (
                    <div className="space-y-6">
                      {/* Cart items */}
                      <div className="space-y-4">
                        {cartItems.map((item, index) => (
                          <div key={index} className="flex border-b pb-4">
                            <div className="h-16 w-16 relative rounded overflow-hidden bg-gray-100 mr-4">
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">
                                  <Package className="h-8 w-8" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <h4 className="font-medium text-sm">{item.name}</h4>
                                <span className="font-medium">${parseFloat(item.price).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center mt-1">
                                <div className="text-sm text-gray-500">
                                  {item.size && <span>Size: {item.size}</span>}
                                  {item.color && <span> • Color: {typeof item.color === 'string' ? item.color : item.color.color}</span>}
                                  <div>Qty: {item.quantity || item.qty}</div>
                                </div>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Cart summary */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal</span>
                            <span>${cartTotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Shipping</span>
                            <span>Calculated at checkout</span>
                          </div>
                        </div>
                        <div className="border-t pt-2">
                          <div className="flex justify-between font-medium">
                            <span>Total</span>
                            <span>${cartTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <Button className="w-full" onClick={handleProceedToCheckout}>
                        Proceed to Checkout
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-12 border border-dashed rounded-lg">
                      <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">Your cart is empty</h3>
                      <p className="text-gray-500 mb-4">Add items to your cart to checkout</p>
                      <Button asChild>
                        <Link href="/">Continue Shopping</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <Card className="border shadow-sm">
                <CardHeader className="bg-gray-50 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Account Preferences</CardTitle>
                      <CardDescription>Manage your account settings</CardDescription>
                    </div>
                    <div className="bg-white p-2 rounded-full">
                      <Settings className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Phone Verification Section */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-medium mb-3">Phone Verification</h3>
                    <div className="space-y-3">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="space-y-0.5">
                            <Label className="text-base">Phone Number</Label>
                            <p className="text-sm text-gray-500">
                              {session?.user?.phone ? 
                                `Verified: ${session.user.phone}` : 
                                "Add your phone number for better security"}
                            </p>
                          </div>
                          {session?.user?.phone && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                              <Check className="h-3 w-3 mr-1" /> Verified
                            </span>
                          )}
                        </div>
                        <div className="mt-3">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setActiveTab("phone-verification");
                            }}
                          >
                            {session?.user?.phone ? "Change Phone Number" : "Add Phone Number"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-3">Email Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base">Order Updates</Label>
                          <p className="text-sm text-gray-500">Receive emails about your orders</p>
                        </div>
                        <Input type="checkbox" className="h-5 w-10" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-base">Promotions & Discounts</Label>
                          <p className="text-sm text-gray-500">Stay updated about sales and special offers</p>
                        </div>
                        <Input type="checkbox" className="h-5 w-10" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-3">Privacy & Security</h3>
                    <div className="space-y-4">
                      <Button variant="outline" className="bg-white">Change Password</Button>
                      <Button variant="outline" className="text-amber-600 border-amber-600 hover:bg-amber-50 bg-white">
                        Two-Factor Authentication
                      </Button>
                      <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 bg-white">
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Phone Verification Tab */}
            {activeTab === "phone-verification" && (
              <Card className="border shadow-sm">
                <CardHeader className="bg-gray-50 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Phone Verification</CardTitle>
                      <CardDescription>Add or update your phone number</CardDescription>
                    </div>
                    <div className="bg-white p-2 rounded-full">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">
                        Verify your phone number to enhance your account security. You can choose to 
                        receive verification codes via SMS or WhatsApp.
                      </p>
                    </div>
                    
                    {/* Import and use the PhoneVerificationForm component */}
                    {/* @ts-ignore */}
                    <PhoneVerificationForm
                      currentPhone={session?.user?.phone || ''}
                      onSuccess={() => {
                        toast.success("Phone number verified successfully");
                        updateSession();
                        setActiveTab("settings");
                      }}
                    />
                    
                    <div className="text-center pt-4">
                      <Button 
                        variant="ghost" 
                        onClick={() => setActiveTab("settings")}
                      >
                        Back to Settings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Address Form Dialog */}
      <Dialog open={showAddressForm} onOpenChange={setShowAddressForm}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAddress ? "Edit Address" : "Add New Address"}</DialogTitle>
            <DialogDescription>
              {editingAddress 
                ? "Update your existing address details" 
                : "Enter your shipping address information"
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddressFormSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name <span className="text-red-500">*</span></Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="First Name"
                  value={addressForm.firstName}
                  onChange={handleAddressInputChange}
                  className={addressFormErrors.firstName ? "border-red-500" : ""}
                  disabled={isAddressFormSubmitting}
                />
                {addressFormErrors.firstName && (
                  <p className="text-red-500 text-xs mt-1">{addressFormErrors.firstName}</p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name <span className="text-red-500">*</span></Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Last Name"
                  value={addressForm.lastName}
                  onChange={handleAddressInputChange}
                  className={addressFormErrors.lastName ? "border-red-500" : ""}
                  disabled={isAddressFormSubmitting}
                />
                {addressFormErrors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{addressFormErrors.lastName}</p>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="phoneNumber">Phone Number <span className="text-red-500">*</span></Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                placeholder="Phone Number"
                type="tel"
                value={addressForm.phoneNumber}
                onChange={handleAddressInputChange}
                className={addressFormErrors.phoneNumber ? "border-red-500" : ""}
                disabled={isAddressFormSubmitting}
              />
              {addressFormErrors.phoneNumber && (
                <p className="text-red-500 text-xs mt-1">{addressFormErrors.phoneNumber}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="address1">Address Line 1 <span className="text-red-500">*</span></Label>
              <Input
                id="address1"
                name="address1"
                placeholder="Street address, house number, etc."
                value={addressForm.address1}
                onChange={handleAddressInputChange}
                className={addressFormErrors.address1 ? "border-red-500" : ""}
                disabled={isAddressFormSubmitting}
              />
              {addressFormErrors.address1 && (
                <p className="text-red-500 text-xs mt-1">{addressFormErrors.address1}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="address2">Address Line 2 (Optional)</Label>
              <Input
                id="address2"
                name="address2"
                placeholder="Apartment, suite, unit, building, floor, etc."
                value={addressForm.address2}
                onChange={handleAddressInputChange}
                disabled={isAddressFormSubmitting}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
                <Input
                  id="city"
                  name="city"
                  placeholder="City"
                  value={addressForm.city}
                  onChange={handleAddressInputChange}
                  className={addressFormErrors.city ? "border-red-500" : ""}
                  disabled={isAddressFormSubmitting}
                />
                {addressFormErrors.city && (
                  <p className="text-red-500 text-xs mt-1">{addressFormErrors.city}</p>
                )}
              </div>
              <div>
                <Label htmlFor="state">State <span className="text-red-500">*</span></Label>
                <Input
                  id="state"
                  name="state"
                  placeholder="State"
                  value={addressForm.state}
                  onChange={handleAddressInputChange}
                  className={addressFormErrors.state ? "border-red-500" : ""}
                  disabled={isAddressFormSubmitting}
                />
                {addressFormErrors.state && (
                  <p className="text-red-500 text-xs mt-1">{addressFormErrors.state}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="zipCode">ZIP Code <span className="text-red-500">*</span></Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  placeholder="6-digit ZIP Code"
                  value={addressForm.zipCode}
                  onChange={handleAddressInputChange}
                  className={addressFormErrors.zipCode ? "border-red-500" : ""}
                  disabled={isAddressFormSubmitting}
                />
                {addressFormErrors.zipCode && (
                  <p className="text-red-500 text-xs mt-1">{addressFormErrors.zipCode}</p>
                )}
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  name="country"
                  value={addressForm.country}
                  disabled={true}
                  className="bg-gray-50"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="isDefault"
                checked={addressForm.isDefault}
                onCheckedChange={handleCheckboxChange}
                disabled={isAddressFormSubmitting}
              />
              <Label htmlFor="isDefault" className="text-sm font-normal">
                Set as default address
              </Label>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddressForm(false)}
                disabled={isAddressFormSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isAddressFormSubmitting}
              >
                {isAddressFormSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingAddress ? "Updating..." : "Adding..."}
                  </>
                ) : (
                  editingAddress ? "Update Address" : "Add Address"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}