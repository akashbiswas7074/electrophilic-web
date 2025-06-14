import { MapPin, Package, Truck, CheckCircle, Clock, Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import OrderedProductDetailedView from './OrderProductDeatiledView';
import Image from 'next/image'; // Import next/image

interface OrderDetailsProps {
  order: any;
}

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

export default function OrderDetails({ order }: OrderDetailsProps) {
  if (!order) return null;
    const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
      case 'Processing':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'confirmed':
      case 'Confirmed':
        return 'bg-cyan-100 text-cyan-800 border border-cyan-200';
      case 'shipped':
      case 'Dispatched':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'delivered':
      case 'Completed':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'cancelled':
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'Not Processed':
      case 'pending':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getPaymentStatusColor = (isPaid: boolean) => {
    return isPaid ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-amber-100 text-amber-800 border border-amber-200';
  };
  
  // Format the shipping address
  const formattedAddress = order.shippingAddress ? [
    `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
    order.shippingAddress.address1,
    order.shippingAddress.address2,
    `${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}`,
    order.shippingAddress.country,
    `Phone: ${order.shippingAddress.phoneNumber}`
  ].filter(Boolean).join(', ') : 'No address provided';
  
  // Get the address label if available
  const addressLabel = order.shippingAddress?.label || 'Shipping';
  const isDefaultAddress = order.shippingAddress?.isDefault || false;

  return (
    <div className="space-y-8">
      {/* Order Header */}
      <div className="flex flex-col md:flex-row justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order #{order._id.substring(0, 8)}</h1>
          <p className="text-gray-500">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex flex-col items-start md:items-end mt-4 md:mt-0">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={getStatusColor(order.status || 'Processing')}>
              {order.status || 'Processing'}
            </Badge>
            <Badge variant="outline" className={getPaymentStatusColor(order.isPaid)}>
              {order.isPaid ? 'Paid' : 'Payment Pending'}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">Payment Method: {order.paymentMethod}</p>
        </div>
      </div>
      
      {/* Shipping Address */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-gray-500" />
              <CardTitle className="text-lg">
                {addressLabel} Address
                {isDefaultAddress && (
                  <span className="ml-2 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                    Default
                  </span>
                )}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm leading-relaxed">
            {formattedAddress}
          </div>
        </CardContent>
      </Card>
      
      {/* Order Items */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Order Items</h2>
        <div className="space-y-4">
          {order.orderItems.map((item: any) => (
            <Card key={item._id}>
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Product Image */}
                  <div className="w-full md:w-1/4 h-48 md:h-auto relative">
                    <Image // Changed from img to Image
                      src={item.image || '/placeholder-product.jpg'} // Provide a fallback for src
                      alt={item.name}
                      fill // Use fill to cover the parent div
                      className="object-cover"
                      onError={(e) => {
                        // Typescript needs to know this is an HTMLImageElement
                        const target = e.target as HTMLImageElement;
                        target.srcset = "/placeholder-product.jpg"; // Fallback for next/image
                        target.src = "/placeholder-product.jpg";
                      }}
                    />
                  </div>
                  
                  {/* Product Details */}
                  <div className="w-full md:w-3/4 p-4">
                    <div className="flex flex-col md:flex-row justify-between">
                      <div>
                        <h3 className="font-medium text-lg">{item.name}</h3>
                        <div className="flex items-center mt-1 mb-2">
                          <span className="text-gray-500 mr-4">Quantity: {item.quantity || item.qty}</span>
                          {item.size && <span className="text-gray-500">Size: {item.size}</span>}
                        </div>
                        <div className="flex items-center space-x-3">
                          <p className="font-semibold">₹{item.price.toFixed(2)}</p>
                          {item.originalPrice && item.originalPrice > item.price && (
                            <p className="text-gray-400 line-through text-sm">₹{item.originalPrice.toFixed(2)}</p>
                          )}
                        </div>
                        
                        {/* Vendor Information - Enhanced */}
                        {item.vendor && (
                          <div className="mt-2 flex flex-col">
                            <div className="flex items-center text-sm mb-1">
                              <Store className="h-4 w-4 mr-1 text-gray-500" />
                              <span className="text-gray-600 mr-1">Sold by:</span>
                              <Badge variant="outline" className="bg-gray-50 text-gray-700">
                                {typeof item.vendor === 'object' 
                                  ? (item.vendor.businessName || item.vendor.name || 'Unknown Vendor')
                                  : (typeof item.vendor === 'string' ? item.vendor : 'Unknown Vendor')}
                              </Badge>
                            </div>
                            {typeof item.vendor === 'object' && item.vendor.email && (
                              <div className="flex items-center text-sm text-gray-600 ml-5">
                                <span>Contact: {item.vendor.email}</span>
                                {item.vendor.phone && <span className="ml-2">| {item.vendor.phone}</span>}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 md:mt-0">
                        <OrderedProductDetailedView item={item} orderId={order._id} />
                      </div>
                    </div>
                    
                    {/* Detailed Order Item View Component */}
                    <OrderedProductDetailedView
                      item={item}
                      orderId={order._id}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Items Total</span>
              <span>₹{order.itemsPrice?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Shipping</span>
              <span>₹{order.shippingPrice?.toFixed(2)}</span>
            </div>
            {order.taxPrice > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Tax</span>
                <span>₹{order.taxPrice?.toFixed(2)}</span>
              </div>
            )}
            {order.discountAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Discount</span>
                <span className="text-green-600">-₹{order.discountAmount?.toFixed(2)}</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>₹{order.totalAmount?.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
