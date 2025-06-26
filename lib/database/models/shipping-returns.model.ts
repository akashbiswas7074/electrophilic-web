import mongoose, { Schema, Document, models, model } from "mongoose";

// Interface for shipping option
export interface IShippingOption {
  title: string;
  description: string;
  icon?: string;
  minOrderAmount?: number;
  deliveryTime: string;
  cost: number;
  isActive: boolean;
  order: number;
}

// Interface for return policy info
export interface IReturnInfo {
  title: string;
  description: string;
  icon?: string;
  returnPeriodDays: number;
  conditions?: string[];
  isActive: boolean;
  order: number;
}

// Interface for shipping & returns document
export interface IShippingReturns extends Document {
  title: string;
  subtitle?: string;
  shippingOptions: IShippingOption[];
  returnInfo: IReturnInfo[];
  additionalInfo?: string;
  isActive: boolean;
  metaTitle?: string;
  metaDescription?: string;
  customCSS?: string;
  lastUpdatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Shipping Option Schema
const ShippingOptionSchema = new Schema<IShippingOption>({
  title: {
    type: String,
    required: [true, "Shipping option title is required"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Shipping option description is required"],
  },
  icon: {
    type: String,
    default: "🚚",
  },
  minOrderAmount: {
    type: Number,
    default: 0,
  },
  deliveryTime: {
    type: String,
    required: [true, "Delivery time is required"],
    trim: true,
  },
  cost: {
    type: Number,
    required: true,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    required: true,
    default: 0,
  },
}, { _id: false });

// Return Info Schema
const ReturnInfoSchema = new Schema<IReturnInfo>({
  title: {
    type: String,
    required: [true, "Return info title is required"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Return info description is required"],
  },
  icon: {
    type: String,
    default: "🔄",
  },
  returnPeriodDays: {
    type: Number,
    required: true,
    default: 30,
  },
  conditions: [{
    type: String,
    trim: true,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    required: true,
    default: 0,
  },
}, { _id: false });

// Shipping & Returns Schema
const ShippingReturnsSchema = new Schema<IShippingReturns>({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    default: "Shipping & Returns",
  },
  subtitle: {
    type: String,
    trim: true,
    default: "Fast delivery and easy returns",
  },
  shippingOptions: [ShippingOptionSchema],
  returnInfo: [ReturnInfoSchema],
  additionalInfo: {
    type: String,
    default: "",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  metaTitle: {
    type: String,
    trim: true,
  },
  metaDescription: {
    type: String,
    trim: true,
  },
  customCSS: {
    type: String,
    default: "",
  },
  lastUpdatedBy: {
    type: String,
    trim: true,
  },
}, { timestamps: true });

// Only one shipping & returns config can be active at a time
ShippingReturnsSchema.pre("save", async function (next) {
  if (this.isModified("isActive") && this.isActive) {
    await (this.constructor as any).updateMany(
      { _id: { $ne: this._id } },
      { $set: { isActive: false } }
    );
  }
  next();
});

// Create and export the model
const ShippingReturns = models.ShippingReturns || model<IShippingReturns>("ShippingReturns", ShippingReturnsSchema);

export default ShippingReturns;