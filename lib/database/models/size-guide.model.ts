import mongoose, { Schema, Document, models, model } from "mongoose";

// Interface for size chart entry
export interface ISizeChartEntry {
  size: string;
  measurements: {
    [key: string]: string; // Dynamic measurements like chest, waist, length, etc.
  };
  order: number;
}

// Interface for size guide section
export interface ISizeGuideSection {
  title: string;
  content: string; // Rich text HTML content
  icon?: string;
  isActive: boolean;
  order: number;
}

// Interface for size guide document
export interface ISizeGuide extends Document {
  title: string;
  subtitle?: string;
  heroIcon?: string;
  sections: ISizeGuideSection[];
  sizeChart?: {
    enabled: boolean;
    measurementLabels: string[]; // e.g., ['Chest', 'Waist', 'Length']
    entries: ISizeChartEntry[];
  };
  howToMeasure?: {
    enabled: boolean;
    content: string; // Rich text HTML content
    images?: string[];
  };
  fitTips?: {
    enabled: boolean;
    content: string; // Rich text HTML content
  };
  isActive: boolean;
  metaTitle?: string;
  metaDescription?: string;
  customCSS?: string;
  lastUpdatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Size Chart Entry Schema
const SizeChartEntrySchema = new Schema<ISizeChartEntry>({
  size: {
    type: String,
    required: [true, "Size is required"],
    trim: true,
  },
  measurements: {
    type: Map,
    of: String,
    default: {},
  },
  order: {
    type: Number,
    required: true,
    default: 0,
  },
}, { _id: false });

// Size Guide Section Schema
const SizeGuideSectionSchema = new Schema<ISizeGuideSection>({
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
    default: "📏",
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

// Size Guide Schema
const SizeGuideSchema = new Schema<ISizeGuide>({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    default: "Size Guide",
  },
  subtitle: {
    type: String,
    trim: true,
    default: "Find your perfect fit",
  },
  heroIcon: {
    type: String,
    default: "📐",
  },
  sections: [SizeGuideSectionSchema],
  sizeChart: {
    enabled: {
      type: Boolean,
      default: true,
    },
    measurementLabels: [{
      type: String,
      trim: true,
    }],
    entries: [SizeChartEntrySchema],
  },
  howToMeasure: {
    enabled: {
      type: Boolean,
      default: true,
    },
    content: {
      type: String,
      default: "",
    },
    images: [{
      type: String,
      trim: true,
    }],
  },
  fitTips: {
    enabled: {
      type: Boolean,
      default: true,
    },
    content: {
      type: String,
      default: "",
    },
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
  isActive: {
    type: Boolean,
    default: false,
  },
  lastUpdatedBy: {
    type: String,
    trim: true,
  },
}, { timestamps: true });

// Only one size guide can be active at a time
SizeGuideSchema.pre("save", async function (next) {
  if (this.isModified("isActive") && this.isActive) {
    await (this.constructor as any).updateMany(
      { _id: { $ne: this._id } },
      { $set: { isActive: false } }
    );
  }
  next();
});

// Update the updatedAt field before saving
SizeGuideSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});


// Create and export the model
const SizeGuide = models.SizeGuide || model<ISizeGuide>("SizeGuide", SizeGuideSchema);

export default SizeGuide;