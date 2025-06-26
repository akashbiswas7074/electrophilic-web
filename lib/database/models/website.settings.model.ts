import mongoose, { Schema, Document } from 'mongoose';

// Theme Settings Interface
export interface IThemeSettings {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  fontFamily?: string;
  customCSS?: string;
  darkMode?: boolean;
}

export interface IWebsiteSettings extends Document {
  _id: string;
  // SEO Meta Tags
  siteName: string;
  siteDescription: string;
  siteKeywords: string[];
  defaultTitle: string;
  titleSeparator: string;
  
  // Open Graph
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType: string;
  
  // Twitter Card
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterCard: string;
  twitterSite?: string;
  twitterCreator?: string;
  
  // Favicons
  favicon?: string;
  favicon16?: string;
  favicon32?: string;
  appleTouchIcon?: string;
  androidChrome192?: string;
  androidChrome512?: string;
  safariPinnedTab?: string;
  msTileColor?: string;
  themeColor?: string;
  
  // Additional Meta Tags
  author?: string;
  robots?: string;
  canonical?: string;
  
  // Analytics & Tracking
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  facebookPixelId?: string;
  
  // Schema.org
  organizationName?: string;
  organizationUrl?: string;
  organizationLogo?: string;
  organizationType: string;
  
  // Theme Settings
  themeSettings?: IThemeSettings;
  
  // Status
  isActive: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Theme Settings Schema
const ThemeSettingsSchema = new Schema<IThemeSettings>({
  primaryColor: {
    type: String,
    default: '#2B2B2B'
  },
  secondaryColor: {
    type: String,
    default: '#6B7280'
  },
  accentColor: {
    type: String,
    default: '#3B82F6'
  },
  backgroundColor: {
    type: String,
    default: '#FFFFFF'
  },
  textColor: {
    type: String,
    default: '#1F2937'
  },
  borderRadius: {
    type: String,
    default: '0.5rem'
  },
  fontFamily: {
    type: String,
    default: 'Inter'
  },
  customCSS: {
    type: String,
    default: ''
  },
  darkMode: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const WebsiteSettingsSchema = new Schema<IWebsiteSettings>({
  // SEO Meta Tags
  siteName: {
    type: String,
    required: [true, 'Site name is required'],
    trim: true,
    maxlength: [100, 'Site name cannot exceed 100 characters']
  },
  siteDescription: {
    type: String,
    required: [true, 'Site description is required'],
    trim: true,
    maxlength: [160, 'Site description cannot exceed 160 characters']
  },
  siteKeywords: [{
    type: String,
    trim: true
  }],
  defaultTitle: {
    type: String,
    required: [true, 'Default title is required'],
    trim: true,
    maxlength: [60, 'Default title cannot exceed 60 characters']
  },
  titleSeparator: {
    type: String,
    default: ' | ',
    trim: true
  },
  
  // Open Graph
  ogTitle: {
    type: String,
    trim: true,
    maxlength: [40, 'OG title cannot exceed 40 characters']
  },
  ogDescription: {
    type: String,
    trim: true,
    maxlength: [300, 'OG description cannot exceed 300 characters']
  },
  ogImage: {
    type: String,
    trim: true
  },
  ogType: {
    type: String,
    default: 'website',
    enum: ['website', 'article', 'product', 'profile']
  },
  
  // Twitter Card
  twitterTitle: {
    type: String,
    trim: true,
    maxlength: [70, 'Twitter title cannot exceed 70 characters']
  },
  twitterDescription: {
    type: String,
    trim: true,
    maxlength: [200, 'Twitter description cannot exceed 200 characters']
  },
  twitterImage: {
    type: String,
    trim: true
  },
  twitterCard: {
    type: String,
    default: 'summary_large_image',
    enum: ['summary', 'summary_large_image', 'app', 'player']
  },
  twitterSite: {
    type: String,
    trim: true
  },
  twitterCreator: {
    type: String,
    trim: true
  },
  
  // Favicons
  favicon: String,
  favicon16: String,
  favicon32: String,
  appleTouchIcon: String,
  androidChrome192: String,
  androidChrome512: String,
  safariPinnedTab: String,
  msTileColor: {
    type: String,
    default: '#da532c'
  },
  themeColor: {
    type: String,
    default: '#ffffff'
  },
  
  // Additional Meta Tags
  author: String,
  robots: {
    type: String,
    default: 'index, follow'
  },
  canonical: String,
  
  // Analytics & Tracking
  googleAnalyticsId: String,
  googleTagManagerId: String,
  facebookPixelId: String,
  
  // Schema.org
  organizationName: String,
  organizationUrl: String,
  organizationLogo: String,
  organizationType: {
    type: String,
    default: 'Organization',
    enum: ['Organization', 'Corporation', 'EducationalOrganization', 'LocalBusiness', 'Store']
  },
  
  // Theme Settings
  themeSettings: {
    type: ThemeSettingsSchema,
    default: () => ({})
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
WebsiteSettingsSchema.index({ isActive: 1 });
WebsiteSettingsSchema.index({ createdAt: -1 });

const WebsiteSettings = mongoose.models.WebsiteSettings || mongoose.model<IWebsiteSettings>('WebsiteSettings', WebsiteSettingsSchema);

export default WebsiteSettings;