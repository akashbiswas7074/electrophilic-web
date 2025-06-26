import mongoose, { Schema, Document, models, model } from "mongoose";

// Interface for return policy section
export interface IReturnPolicySection {
  title: string;
  content: string;
  icon?: string;
  order: number;
  isActive: boolean;
}

// Interface for return policy document
export interface IReturnPolicy extends Document {
  title: string;
  subtitle?: string;
  heroIcon?: string;
  sections: IReturnPolicySection[];
  isActive: boolean;
  metaTitle?: string;
  metaDescription?: string;
  customCSS?: string;
  lastUpdatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Return Policy Section Schema
const ReturnPolicySectionSchema = new Schema<IReturnPolicySection>({
  title: {
    type: String,
    required: [true, "Section title is required"],
    trim: true,
  },
  content: {
    type: String,
    required: [true, "Section content is required"],
  },
  icon: {
    type: String,
    default: "",
  },
  order: {
    type: Number,
    required: true,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { _id: false });

// Return Policy Schema
const ReturnPolicySchema = new Schema<IReturnPolicy>({
  title: {
    type: String,
    required: [true, "Policy title is required"],
    trim: true,
    default: "Return & Exchange Policy",
  },
  subtitle: {
    type: String,
    trim: true,
    default: "We've got your back—on and off the track.",
  },
  heroIcon: {
    type: String,
    default: "🏃‍♂️",
  },
  sections: [ReturnPolicySectionSchema],
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

// Only one return policy can be active at a time
ReturnPolicySchema.pre("save", async function (next) {
  if (this.isModified("isActive") && this.isActive) {
    await (this.constructor as any).updateMany(
      { _id: { $ne: this._id } },
      { $set: { isActive: false } }
    );
  }
  next();
});

// Create and export the model
const ReturnPolicy = models.ReturnPolicy || model<IReturnPolicy>("ReturnPolicy", ReturnPolicySchema);

export default ReturnPolicy;