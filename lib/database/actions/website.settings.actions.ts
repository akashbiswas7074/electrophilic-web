"use server";

import { connectToDatabase } from "@/lib/database/connect";
import WebsiteSettings, { IWebsiteSettings } from "@/lib/database/models/website.settings.model";

// Get active website settings
export const getActiveWebsiteSettings = async () => {
  try {
    await connectToDatabase();
    
    const settings = await WebsiteSettings.findOne({ isActive: true }).lean();
    
    return {
      success: true,
      settings: settings ? JSON.parse(JSON.stringify(settings)) : null
    };
  } catch (error: any) {
    console.error("Error fetching active website settings:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch website settings"
    };
  }
};

// Get all website settings
export const getAllWebsiteSettings = async () => {
  try {
    await connectToDatabase();
    
    const settings = await WebsiteSettings.find({})
      .sort({ createdAt: -1 })
      .lean();
    
    return {
      success: true,
      settings: JSON.parse(JSON.stringify(settings))
    };
  } catch (error: any) {
    console.error("Error fetching all website settings:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch website settings"
    };
  }
};

// Create or update website settings
export const createOrUpdateWebsiteSettings = async (data: Partial<IWebsiteSettings>) => {
  try {
    await connectToDatabase();
    
    // First, deactivate all existing settings
    await WebsiteSettings.updateMany({}, { isActive: false });
    
    // Create new settings or update existing one
    const settings = await WebsiteSettings.findOneAndUpdate(
      { isActive: true },
      { ...data, isActive: true },
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    );
    
    return {
      success: true,
      message: "Website settings saved successfully",
      settings: JSON.parse(JSON.stringify(settings))
    };
  } catch (error: any) {
    console.error("Error saving website settings:", error);
    return {
      success: false,
      message: error.message || "Failed to save website settings"
    };
  }
};

// Update favicon settings specifically
export const updateFavicons = async (faviconData: {
  favicon?: string;
  favicon16?: string;
  favicon32?: string;
  appleTouchIcon?: string;
  androidChrome192?: string;
  androidChrome512?: string;
  safariPinnedTab?: string;
  msTileColor?: string;
  themeColor?: string;
}) => {
  try {
    await connectToDatabase();
    
    const settings = await WebsiteSettings.findOneAndUpdate(
      { isActive: true },
      { $set: faviconData },
      { new: true, runValidators: true }
    );
    
    if (!settings) {
      return {
        success: false,
        message: "No active website settings found"
      };
    }
    
    return {
      success: true,
      message: "Favicon settings updated successfully",
      settings: JSON.parse(JSON.stringify(settings))
    };
  } catch (error: any) {
    console.error("Error updating favicon settings:", error);
    return {
      success: false,
      message: error.message || "Failed to update favicon settings"
    };
  }
};

// Update SEO metadata specifically
export const updateSEOMetadata = async (seoData: {
  siteName?: string;
  siteDescription?: string;
  siteKeywords?: string[];
  defaultTitle?: string;
  titleSeparator?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterCard?: string;
  twitterSite?: string;
  twitterCreator?: string;
  author?: string;
  robots?: string;
  canonical?: string;
}) => {
  try {
    await connectToDatabase();
    
    const settings = await WebsiteSettings.findOneAndUpdate(
      { isActive: true },
      { $set: seoData },
      { new: true, runValidators: true }
    );
    
    if (!settings) {
      return {
        success: false,
        message: "No active website settings found"
      };
    }
    
    return {
      success: true,
      message: "SEO metadata updated successfully",
      settings: JSON.parse(JSON.stringify(settings))
    };
  } catch (error: any) {
    console.error("Error updating SEO metadata:", error);
    return {
      success: false,
      message: error.message || "Failed to update SEO metadata"
    };
  }
};

// Update analytics and tracking settings
export const updateAnalyticsTracking = async (analyticsData: {
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  facebookPixelId?: string;
}) => {
  try {
    await connectToDatabase();
    
    const settings = await WebsiteSettings.findOneAndUpdate(
      { isActive: true },
      { $set: analyticsData },
      { new: true, runValidators: true }
    );
    
    if (!settings) {
      return {
        success: false,
        message: "No active website settings found"
      };
    }
    
    return {
      success: true,
      message: "Analytics settings updated successfully",
      settings: JSON.parse(JSON.stringify(settings))
    };
  } catch (error: any) {
    console.error("Error updating analytics settings:", error);
    return {
      success: false,
      message: error.message || "Failed to update analytics settings"
    };
  }
};

// Update organization schema
export const updateOrganizationSchema = async (orgData: {
  organizationName?: string;
  organizationUrl?: string;
  organizationLogo?: string;
  organizationType?: string;
}) => {
  try {
    await connectToDatabase();
    
    const settings = await WebsiteSettings.findOneAndUpdate(
      { isActive: true },
      { $set: orgData },
      { new: true, runValidators: true }
    );
    
    if (!settings) {
      return {
        success: false,
        message: "No active website settings found"
      };
    }
    
    return {
      success: true,
      message: "Organization schema updated successfully",
      settings: JSON.parse(JSON.stringify(settings))
    };
  } catch (error: any) {
    console.error("Error updating organization schema:", error);
    return {
      success: false,
      message: error.message || "Failed to update organization schema"
    };
  }
};

// Delete website settings
export const deleteWebsiteSettings = async (id: string) => {
  try {
    await connectToDatabase();
    
    const settings = await WebsiteSettings.findByIdAndDelete(id);
    
    if (!settings) {
      return {
        success: false,
        message: "Website settings not found"
      };
    }
    
    return {
      success: true,
      message: "Website settings deleted successfully"
    };
  } catch (error: any) {
    console.error("Error deleting website settings:", error);
    return {
      success: false,
      message: error.message || "Failed to delete website settings"
    };
  }
};

// Activate specific website settings
export const activateWebsiteSettings = async (id: string) => {
  try {
    await connectToDatabase();
    
    // First, deactivate all settings
    await WebsiteSettings.updateMany({}, { isActive: false });
    
    // Then activate the specified settings
    const settings = await WebsiteSettings.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true, runValidators: true }
    );
    
    if (!settings) {
      return {
        success: false,
        message: "Website settings not found"
      };
    }
    
    return {
      success: true,
      message: "Website settings activated successfully",
      settings: JSON.parse(JSON.stringify(settings))
    };
  } catch (error: any) {
    console.error("Error activating website settings:", error);
    return {
      success: false,
      message: error.message || "Failed to activate website settings"
    };
  }
};