import mongoose, { Schema } from 'mongoose';

// Define the section type for homepage sections
export interface IWebsiteSection {
  _id?: string;
  name: string;             // Display name for the section
  sectionId: string;        // Unique identifier matching component name in page.tsx
  isVisible: boolean;       // Whether section is visible on the website
  order: number;            // Order in which section appears (lower numbers appear first)
  description?: string;     // Optional description of the section
  categoryId?: string;      // Optional: For category-specific product sections
  heroSectionId?: string;   // Optional: For specific hero sections
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the schema for Website Section
const WebsiteSectionSchema = new Schema<IWebsiteSection>(
  {
    name: {
      type: String,
      required: [true, "Section name is required"],
      trim: true,
    },
    sectionId: {
      type: String,
      required: [true, "Section ID is required"],
      trim: true,
      unique: true,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      required: [true, "Order is required"],
      default: 999, // Default to end of list
    },
    description: {
      type: String,
      trim: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    heroSectionId: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Create and export the model
const WebsiteSection = mongoose.models.WebsiteSection || mongoose.model<IWebsiteSection>('WebsiteSection', WebsiteSectionSchema);

export default WebsiteSection;