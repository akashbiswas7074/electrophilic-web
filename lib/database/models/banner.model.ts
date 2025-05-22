import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IBanner extends Document {
  url: string;
  public_id: string;
  type: "website" | "app";
  platform: "desktop" | "mobile";
  linkUrl?: string; 
  altText?: string;  
  startDate?: Date;    // When the banner campaign starts
  endDate?: Date;      // When the banner campaign ends
  isActive: boolean;   // Whether the banner is currently active
  impressions: number; // Count of banner views
  clicks: number;      // Count of banner clicks
  priority: number;    // Priority order for display (lower number = higher priority)
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema: Schema = new Schema(
  {
    url: { type: String, required: true },
    public_id: { type: String, required: true, unique: true },
    type: { type: String, enum: ["website", "app"], required: true },
    platform: { type: String, enum: ["desktop", "mobile"], required: true },
    linkUrl: { type: String },
    altText: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    priority: { type: Number, default: 10 },
  },
  { timestamps: true }
);

// Pre-find middleware to filter out inactive or expired banners
BannerSchema.pre("find", function(next) {
  // This ensures we only return active banners unless explicitly queried otherwise
  if (!this.getQuery().hasOwnProperty('isActive')) {
    this.where({ isActive: true });
  }
  
  // Filter by date range if dates are set
  const now = new Date();
  this.where({
    $or: [
      { startDate: { $exists: false } }, // No start date set
      { startDate: { $lte: now } }       // Or start date is in the past/now
    ]
  }).where({
    $or: [
      { endDate: { $exists: false } },   // No end date set
      { endDate: { $gte: now } }         // Or end date is in the future/now
    ]
  });
  
  next();
});

const Banner = models.Banner || model<IBanner>("Banner", BannerSchema);

export default Banner;
