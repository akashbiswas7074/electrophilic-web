import mongoose from "mongoose";
const { ObjectId } = mongoose.Schema;

// Define IOrderItem interface for TypeScript
export interface IOrderItem {
  _id?: string;
  product: mongoose.Types.ObjectId | string;
  name: string;
  vendor?: object;
  image: string;
  size?: string;
  qty: number;
  quantity?: number;
  color?: {
    color: string;
    image: string;
  };
  price: number;
  originalPrice?: number;
  status?: string;
  trackingUrl?: string;
  trackingId?: string;
  productCompletedAt?: Date;
  cancelRequested?: boolean;
  cancelReason?: string;
  cancelRequestedAt?: Date;
  // Add review-related fields
  reviewed?: boolean;
  reviewId?: mongoose.Types.ObjectId | string;
  reviewRating?: number;
  reviewComment?: string;
  reviewDate?: Date;
}

// Define IOrder interface for TypeScript
export interface IOrder {
  _id?: string;
  user: mongoose.Types.ObjectId | string;
  products?: IOrderItem[];
  orderItems: IOrderItem[];
  shippingAddress: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  deliveryAddress?: any;
  paymentMethod: 'cod' | 'razorpay' | 'other';
  paymentResult?: {
    id?: string;
    status?: string;
    email?: string;
  };
  total: number;
  totalAmount?: number;
  itemsPrice?: number;
  totalOriginalItemsPrice?: number;
  totalBeforeDiscount?: number;
  couponApplied?: string;
  discountAmount?: number;
  shippingPrice: number;
  taxPrice?: number;
  isPaid: boolean;
  paymentStatus?: 'pending' | 'paid' | 'failed';
  totalSaved?: number;
  razorpay_order_id?: string;
  razorpayOrderId?: string;
  razorpay_payment_id?: string;
  paymentIntentId?: string;
  paidAt?: Date;
  deliveredAt?: Date;
  isNew?: boolean;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define item schema for better maintainability
const OrderItemSchema = new mongoose.Schema({
  product: {
    type: ObjectId,
    ref: "Product",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  vendor: {
    type: Object,
  },
  image: {
    type: String,
    required: true,
  },
  size: {
    type: String,
  },
  qty: {
    type: Number,
    required: true,
    min: 1,
  },
  quantity: {
    type: Number,
    min: 1,
  },
  color: {
    color: String,
    image: String,
  },
  price: {
    type: Number,
    required: true,
  },
  originalPrice: {
    type: Number,
  },
  status: {
    type: String,
    default: "Not Processed",
    enum: ["Not Processed", "Processing", "Confirmed", "Dispatched", "Delivered", "Cancelled", "Completed"],
  },
  trackingUrl: {
    type: String,
    trim: true,
  },
  trackingId: {
    type: String,
    trim: true,
  },
  productCompletedAt: {
    type: Date,
    default: null,
  },
  cancelRequested: {
    type: Boolean,
    default: false,
  },
  cancelReason: {
    type: String,
    trim: true,
  },
  cancelRequestedAt: {
    type: Date,
    default: null,
  },
  // Add review-related fields to schema
  reviewed: {
    type: Boolean,
    default: false
  },
  reviewId: {
    type: ObjectId,
    ref: "Product.reviews"
  },
  reviewRating: {
    type: Number,
    min: 1,
    max: 5
  },
  reviewComment: {
    type: String,
    trim: true
  },
  reviewDate: {
    type: Date
  }
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    products: [OrderItemSchema],
    orderItems: [OrderItemSchema],
    shippingAddress: {
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
      phoneNumber: {
        type: String,
        required: true,
      },
      address1: {
        type: String,
        required: true,
      },
      address2: {
        type: String,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      zipCode: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
    },
    deliveryAddress: {
      type: mongoose.Schema.Types.Mixed,
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'razorpay', 'other'],
      required: true,
    },
    paymentResult: {
      id: String,
      status: String,
      email: String,
    },
    total: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
    },
    itemsPrice: {
      type: Number,
    },
    totalOriginalItemsPrice: {
      type: Number,
    },
    totalBeforeDiscount: {
      type: Number,
    },
    couponApplied: {
      type: String,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    taxPrice: {
      type: Number,
      default: 0,
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    totalSaved: {
      type: Number,
    },
    razorpay_order_id: {
      type: String,
    },
    razorpayOrderId: {
      type: String,
    },
    razorpay_payment_id: {
      type: String,
    },
    paymentIntentId: {
      type: String,
    },
    paidAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    isNew: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'processing',
        'Confirmed',
        'shipped',
        'delivered',
        'cancelled',
        'refunded',
        'pending_cod_verification',
        'Not Processed',
        'Processing',
        'Dispatched',
        'Cancelled',
        'Completed'
      ],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to sync products and orderItems arrays
orderSchema.pre("save", function (this: any, next) {
  // Map qty to quantity for each order item and ensure status compatibility
  if (this.orderItems && this.orderItems.length > 0) {
    this.orderItems.forEach((item: IOrderItem) => {
      // Sync quantity and qty fields
      if (item.quantity !== undefined && item.qty === undefined) {
        item.qty = item.quantity;
      } else if (item.qty !== undefined && item.quantity === undefined) {
        item.quantity = item.qty;
      } else if (item.qty === undefined && item.quantity === undefined) {
        // Default to 1 if both are missing
        item.quantity = 1;
        item.qty = 1;
      }
      
      // Add status field if missing (use main order status)
      if (!item.status && this.status) {
        item.status = this.status;
      }
    });
  }
  
  // If products array exists (admin model compatibility), sync it with orderItems
  if (this.products && this.products.length > 0 && (!this.orderItems || this.orderItems.length === 0)) {
    this.orderItems = [...this.products];
  } else if (this.orderItems && this.orderItems.length > 0 && (!this.products || this.products.length === 0)) {
    this.products = [...this.orderItems];
  }
  
  // Sync statuses between products and orderItems
  if (this.products && this.orderItems && this.products.length > 0 && this.orderItems.length > 0) {
    // Build productId to product map for faster lookups
    const productsMap = new Map();
    this.products.forEach((prod: IOrderItem) => {
      if (prod.product) {
        productsMap.set(String(prod.product), prod);
      }
    });
    
    // Build orderItemId to orderItem map for faster lookups
    const orderItemsMap = new Map();
    this.orderItems.forEach((item: IOrderItem) => {
      if (item.product) {
        orderItemsMap.set(String(item.product), item);
      }
    });
    
    // Sync status from products to orderItems and vice versa
    this.products.forEach((prod: IOrderItem) => {
      if (prod.product) {
        const matchingOrderItem = orderItemsMap.get(String(prod.product));
        if (matchingOrderItem) {
          // If product status was updated, sync to orderItem
          if (prod.status !== matchingOrderItem.status) {
            matchingOrderItem.status = prod.status;
          }
        }
      }
    });
    
    this.orderItems.forEach((item: IOrderItem) => {
      if (item.product) {
        const matchingProduct = productsMap.get(String(item.product));
        if (matchingProduct) {
          // If orderItem status was updated, sync to product
          if (item.status !== matchingProduct.status) {
            matchingProduct.status = item.status;
          }
        }
      }
    });
  }

  // Sync shippingAddress and deliveryAddress fields (for admin compatibility)
  if (this.deliveryAddress && !this.shippingAddress) {
    this.shippingAddress = { ...this.deliveryAddress };
  } else if (this.shippingAddress && !this.deliveryAddress) {
    this.deliveryAddress = { ...this.shippingAddress };
  }
  
  // Ensure phoneNumber exists in deliveryAddress, checking for a legacy 'phone' property
  if (this.deliveryAddress && !this.deliveryAddress.phoneNumber && (this.deliveryAddress as any).phone) {
    this.deliveryAddress.phoneNumber = (this.deliveryAddress as any).phone;
  }

  next();
});

orderSchema.index({ user: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ razorpay_order_id: 1 });
orderSchema.index({ paymentIntentId: 1 });
orderSchema.index({ status: 1 });

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
