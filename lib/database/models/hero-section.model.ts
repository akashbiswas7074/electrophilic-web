import mongoose from "mongoose";

// Type for button
export interface IButton {
  label: string;
  link: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

// Define pattern types
export type HeroPattern = 'standard' | 'brand-control' | 'partner' | 'dont-miss';

// Define the Hero Section content type
export interface IHeroSection {
  _id?: string;
  title: string;           // The main heading "STRENGTH TAKES SWEAT"
  subtitle: string;        // The text below "The training styles that aren't afraid to put in the work."
  buttons: IButton[];      // Array of buttons with label and link
  isActive: boolean;       // Whether this section is currently active
  order: number;           // Display order on the page
  pattern: HeroPattern;    // The layout pattern to use
  layoutId?: string;       // Specific layout ID to define which design to use
  backgroundImage?: string; // Optional background image URL
  contentAlignment?: 'left' | 'center' | 'right'; // Where to align the content
  mediaUrl?: string;       // URL for media (image or video)
  mediaType?: 'image' | 'video'; // Type of media
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the schema for Hero Section
const heroSectionSchema = new mongoose.Schema<IHeroSection>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    subtitle: {
      type: String,
      required: [true, "Subtitle is required"],
      trim: true,
    },
    buttons: [
      {
        label: {
          type: String,
          required: true,
        },
        link: {
          type: String,
          required: true,
        },
        variant: {
          type: String,
          enum: ["primary", "secondary", "outline", "ghost"],
          default: "primary",
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 10,
    },
    pattern: {
      type: String,
      enum: ["standard", "brand-control", "partner", "dont-miss"],
      default: "standard",
      required: true,
    },
    layoutId: {
      type: String,
      default: '',
    },
    backgroundImage: {
      type: String,
      default: '',
    },
    contentAlignment: {
      type: String,
      enum: ["left", "center", "right"],
      default: "center",
      required: true,
    },
    mediaUrl: {
      type: String,
      default: '',
    },
    mediaType: {
      type: String,
      enum: ["image", "video"],
      default: "image",
      required: true,
    },
  },
  { timestamps: true }
);

// Create and export the model
const HeroSection = mongoose.models.HeroSection || mongoose.model<IHeroSection>('HeroSection', heroSectionSchema);

export default HeroSection;