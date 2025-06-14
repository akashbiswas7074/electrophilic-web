import mongoose, { Schema, Document } from 'mongoose';

export interface IButton {
  label: string;
  link: string;
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  target?: '_blank' | '_self';
  icon?: string;
}

export interface IContentSection {
  _id?: string;
  type: 'text' | 'image' | 'video' | 'button' | 'html' | 'hero' | 'grid' | 'carousel';
  title?: string;
  content?: string; // Rich HTML content
  htmlContent?: string; // Raw HTML for html type
  imageUrl?: string;
  videoUrl?: string;
  buttons?: IButton[];
  order: number;
  isVisible: boolean;
  className?: string; // Custom CSS classes
  styles?: Record<string, any>; // Inline styles
  settings?: Record<string, any>; // Section-specific settings
}

export interface IDynamicPage extends Document {
  title: string;
  slug: string; // URL slug for the page
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  isPublished: boolean;
  isHomePage: boolean; // Mark if this is the homepage
  template: 'default' | 'landing' | 'blog' | 'custom';
  sections: IContentSection[];
  customCSS?: string; // Custom CSS for the page
  customJS?: string; // Custom JavaScript for the page
  headerSettings?: {
    showHeader: boolean;
    headerType: 'default' | 'minimal' | 'transparent';
  };
  footerSettings?: {
    showFooter: boolean;
    footerType: 'default' | 'minimal';
  };
  seoSettings?: {
    canonicalUrl?: string;
    noIndex?: boolean;
    noFollow?: boolean;
    ogImage?: string;
    ogTitle?: string;
    ogDescription?: string;
  };
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string; // Admin user ID
  lastEditedBy?: string; // Admin user ID
}

// Content Section Schema
const ContentSectionSchema = new Schema<IContentSection>({
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'button', 'html', 'hero', 'grid', 'carousel'],
    required: true
  },
  title: String,
  content: String, // Rich HTML content from editor
  htmlContent: String, // Raw HTML for advanced users
  imageUrl: String,
  videoUrl: String,
  buttons: [{
    label: { type: String, required: true },
    link: { type: String, required: true },
    variant: {
      type: String,
      enum: ['primary', 'secondary', 'outline', 'ghost'],
      default: 'primary'
    },
    target: {
      type: String,
      enum: ['_blank', '_self'],
      default: '_self'
    },
    icon: String
  }],
  order: { type: Number, required: true, default: 0 },
  isVisible: { type: Boolean, default: true },
  className: String,
  styles: { type: Schema.Types.Mixed },
  settings: { type: Schema.Types.Mixed }
}, { timestamps: true });

// Dynamic Page Schema
const DynamicPageSchema = new Schema<IDynamicPage>({
  title: { type: String, required: true },
  slug: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  metaTitle: String,
  metaDescription: String,
  metaKeywords: [String],
  isPublished: { type: Boolean, default: false },
  isHomePage: { type: Boolean, default: false },
  template: {
    type: String,
    enum: ['default', 'landing', 'blog', 'custom'],
    default: 'default'
  },
  sections: [ContentSectionSchema],
  customCSS: String,
  customJS: String,
  headerSettings: {
    showHeader: { type: Boolean, default: true },
    headerType: {
      type: String,
      enum: ['default', 'minimal', 'transparent'],
      default: 'default'
    }
  },
  footerSettings: {
    showFooter: { type: Boolean, default: true },
    footerType: {
      type: String,
      enum: ['default', 'minimal'],
      default: 'default'
    }
  },
  seoSettings: {
    canonicalUrl: String,
    noIndex: { type: Boolean, default: false },
    noFollow: { type: Boolean, default: false },
    ogImage: String,
    ogTitle: String,
    ogDescription: String
  },
  publishedAt: Date,
  createdBy: String,
  lastEditedBy: String
}, { timestamps: true });

// Middleware to handle homepage uniqueness
DynamicPageSchema.pre('save', async function(next) {
  if (this.isHomePage && this.isModified('isHomePage')) {
    // Remove homepage flag from other pages
    await mongoose.model('DynamicPage').updateMany(
      { _id: { $ne: this._id } },
      { isHomePage: false }
    );
  }
  
  // Set publishedAt when first published
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Create indexes
DynamicPageSchema.index({ slug: 1 });
DynamicPageSchema.index({ isPublished: 1 });
DynamicPageSchema.index({ isHomePage: 1 });
DynamicPageSchema.index({ createdAt: -1 });

const DynamicPage = mongoose.models.DynamicPage || mongoose.model<IDynamicPage>('DynamicPage', DynamicPageSchema);

export default DynamicPage;