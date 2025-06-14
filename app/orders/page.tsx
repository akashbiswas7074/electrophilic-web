"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation"; // Use 'next/navigation' for App Router
import {
  Package, Calendar, CreditCard, Truck, CheckCircle, 
  Clock, XCircle, ChevronDown, ChevronUp, Search,
  Filter, ArrowLeft, Phone, PackageCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import OrderedProductDetailedView from "@/components/shared/order/OrderProductDeatiledView";
import Image from "next/image"; // Import next/image

export default function OrdersPage() {
  const router = useRouter(); // Add useRouter hook
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      // window.location.href = "/"; // Original redirect was to "/"
      router.push("/auth/signin?callbackUrl=/orders"); // Redirect to signin with callback
    },
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    const fetchOrders = async () => {
      if (status === "authenticated" && session?.user?.id) {
        try {
          setIsLoading(true);
          // Fixed API call - remove userId parameter as it's handled by session
          const response = await fetch(`/api/user/orders`);
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setOrders(data.orders || []);
            } else {
              console.error("Failed to fetch orders:", data.message);
              setOrders([]);
            }
          } else {
            console.error("HTTP error:", response.status, response.statusText);
            setOrders([]);
          }
        } catch (error) {
          console.error("Error fetching orders:", error);
          setOrders([]);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchOrders();
  }, [status, session]);
  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    switch(lowerStatus) {
      case "not processed":
      case "pending": 
        return "text-amber-500 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md";
      case "processing": 
        return "text-blue-500 bg-blue-50 border border-blue-200 px-2 py-1 rounded-md";
      case "confirmed": 
        return "text-cyan-600 bg-cyan-50 border border-cyan-200 px-2 py-1 rounded-md";
      case "dispatched":
      case "shipped": 
        return "text-indigo-500 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-md";
      case "delivered":
      case "completed": 
        return "text-green-500 bg-green-50 border border-green-200 px-2 py-1 rounded-md";
      case "cancelled": 
        return "text-red-500 bg-red-50 border border-red-200 px-2 py-1 rounded-md";
      default: 
        return "text-gray-500 bg-gray-50 border border-gray-200 px-2 py-1 rounded-md";
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const filteredOrders = orders
    .filter(order => {
      const matchesSearch = order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shippingAddress.firstName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || order.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/" className="hover:text-primary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Your Orders</h1>
        </div>
        <div className="flex gap-4">
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Sort by</SelectLabel>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Filter by Status</SelectLabel>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="Not Processed">Not Processed</SelectItem>
                <SelectItem value="Processing">Processing</SelectItem>
                <SelectItem value="Confirmed">Confirmed</SelectItem>
                <SelectItem value="Dispatched">Dispatched</SelectItem>
                <SelectItem value="Delivered">Delivered</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search orders by ID or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="space-y-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div 
              key={order._id} 
              className="border rounded-lg overflow-hidden bg-white shadow-sm"
            >
              <div className="p-4">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Order placed</p>
                    <p className="font-medium">{formatDate(order.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-medium">₹{order.totalAmount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ship To</p>
                    <p className="font-medium">{order.shippingAddress?.firstName} {order.shippingAddress?.lastName}</p>
                    {order.shippingAddress?.phoneNumber && (
                      <p className="text-xs text-gray-500 flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {order.shippingAddress.phoneNumber}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-medium">{order._id}</p>
                  </div>                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div className="flex items-center">
                      {(() => {
                        const lowerStatus = order.status?.toLowerCase() || '';
                        let icon = <Clock className="h-4 w-4 mr-1" />;
                        
                        if (lowerStatus === 'processing') icon = <Clock className="h-4 w-4 mr-1 text-blue-500" />;
                        else if (lowerStatus === 'confirmed') icon = <Package className="h-4 w-4 mr-1 text-cyan-600" />;
                        else if (lowerStatus === 'shipped' || lowerStatus === 'dispatched') icon = <Truck className="h-4 w-4 mr-1 text-indigo-500" />;
                        else if (lowerStatus === 'delivered' || lowerStatus === 'completed') icon = <CheckCircle className="h-4 w-4 mr-1 text-green-500" />;
                        else if (lowerStatus === 'cancelled') icon = <XCircle className="h-4 w-4 mr-1 text-red-500" />;
                        
                        return (
                          <div className="flex items-center">
                            {icon}
                            <span className={`font-medium ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="font-medium text-green-600">₹{order.totalAmount?.toFixed(2)}</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-4">
                  {(order.orderItems && order.orderItems.length > 0 ? order.orderItems : order.products).map((product: any, index: number) => (
                    <div key={index} className="flex flex-col gap-2">
                      <div className="flex gap-4">
                        <div className="relative">
                          <Image
                            src={product.image || product.product?.images?.[0]?.url || '/placeholder-product.jpg'}
                            alt={product.name || product.product?.name || "Product image"}
                            width={80}
                            height={80}
                            className="object-cover rounded border border-gray-200"
                          />
                          {product.status && product.status !== order.status && (
                            <span className={`absolute bottom-0 right-0 text-xs ${getStatusColor(product.status)}`}>
                              {product.status}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium line-clamp-2">{product.name || product.product?.name}</h3>
                          <p className="text-sm text-gray-500">
                            Qty: {product.qty || product.quantity || 1} 
                            {product.size && ` • Size: ${product.size}`}
                          </p>                          <p className="text-sm font-medium">
                            ₹{(product.price * (product.qty || product.quantity || 1)).toFixed(2)}
                          </p>
                          
                          {/* Tracking info now only shown in OrderProductDetailedView component */}
                        </div>
                      </div>                      <OrderedProductDetailedView 
                        item={product} 
                        orderId={order._id.toString()}
                      />
                    </div>
                  ))}
                </div>                <div className="mt-4 flex flex-wrap gap-2 items-center">                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/order/${order._id.toString()}`)}
                    className="flex items-center gap-1"
                  >
                    <Package className="h-4 w-4" />
                    View Order Details
                  </Button>

                  {/* Show Track Order button for active orders */}
                  {(!order.status || (
                    order.status.toLowerCase() !== 'cancelled' && 
                    order.status.toLowerCase() !== 'delivered' && 
                    order.status.toLowerCase() !== 'completed'
                  )) && (
                    <Button
                      variant="secondary"
                      size="sm"                      onClick={() => router.push(`/track-order?id=${order._id.toString()}`)}
                      className="flex items-center gap-1"
                    >
                      <Truck className="h-4 w-4" />
                      Track Order
                    </Button>
                  )}
                  
                  {/* If there's a specific tracking URL provided by the carrier, show it as well */}
                  {order.trackingUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="flex items-center gap-1 text-primary"
                    >
                      <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
                        <Truck className="h-4 w-4" />
                        Track with Carrier
                      </a>
                    </Button>
                  )}

                  {/* For completed orders, allow easy reorder */}
                  {(order.status?.toLowerCase() === 'delivered' || order.status?.toLowerCase() === 'completed') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1 ml-auto text-primary"
                      // Implement reorder functionality when available
                      onClick={() => alert('Reorder functionality will be implemented soon')}
                    >
                      <Package className="h-4 w-4" />
                      Buy Again
                    </Button>
                  )}
                </div>
              </div>

              {expandedOrder === order._id && (
                <div className="bg-gray-50 p-4 border-t">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Shipping Address</h4>
                      <div className="text-sm">
                        <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                        <p>{order.shippingAddress.address1}</p>
                        {order.shippingAddress.address2 && (
                          <p>{order.shippingAddress.address2}</p>
                        )}
                        <p>
                          {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                        </p>
                        <p>{order.shippingAddress.country}</p>
                        <p className="flex items-center gap-1 mt-1">
                          <Phone className="h-4 w-4" />
                          {order.shippingAddress.phoneNumber}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Payment Details</h4>
                      <div className="text-sm space-y-1">
                        <p>Method: {order.paymentMethod}</p>
                        <p>Status: {order.isPaid ? "Paid" : "Pending"}</p>
                        {order.paidAt && (
                          <p>Paid on: {formatDate(order.paidAt)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? "Try adjusting your search" : "Start shopping to see your orders here"}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <Button onClick={() => router.push("/")}>
                  Start Shopping
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
