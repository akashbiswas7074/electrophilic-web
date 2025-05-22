"use server";

import { connectToDatabase } from "@/lib/database/connect";
import WebsiteFooter, { IWebsiteFooter } from "../models/website.footer.model";
import { revalidatePath } from "next/cache";

interface FooterFormData {
  name: string;
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    linkedin?: string;
  };
  companyLinks?: Array<{ title: string; url: string }>;
  shopLinks?: Array<{ title: string; url: string }>;
  helpLinks?: Array<{ title: string; url: string }>;
  copyrightText?: string;
  isActive?: boolean;
}

// Create a new footer configuration
export async function createWebsiteFooter(footerData: FooterFormData): Promise<{ success: boolean; message: string; footer?: IWebsiteFooter }> {
  try {
    await connectToDatabase();

    // Trim whitespace from text fields
    const cleanedFooterData = {
      ...footerData,
      name: footerData.name.trim(),
      copyrightText: footerData.copyrightText?.trim() || "",
      contactInfo: {
        email: footerData.contactInfo?.email?.trim() || "",
        phone: footerData.contactInfo?.phone?.trim() || "",
        address: footerData.contactInfo?.address?.trim() || "",
      }
    };

    // Create new footer configuration
    const newFooter = await WebsiteFooter.create(cleanedFooterData);

    // If this footer should be active, deactivate all others
    if (footerData.isActive) {
      await setActiveFooter(newFooter._id.toString());
    }

    revalidatePath("/admin/dashboard/customization/website-footer");
    revalidatePath("/");

    return { 
      success: true, 
      message: "Footer configuration created successfully.", 
      footer: newFooter 
    };
  } catch (error: any) {
    console.error("Error creating footer configuration:", error);
    return { 
      success: false, 
      message: error.message || "Failed to create footer configuration." 
    };
  }
}

// Get a specific footer configuration by ID
export async function getWebsiteFooterById(id: string): Promise<{ success: boolean; footer?: IWebsiteFooter; message?: string }> {
  try {
    await connectToDatabase();
    
    const footer = await WebsiteFooter.findById(id);
    
    if (!footer) {
      return { 
        success: false, 
        message: "Footer configuration not found." 
      };
    }
    
    return { 
      success: true, 
      footer 
    };
  } catch (error: any) {
    console.error("Error fetching footer configuration:", error);
    return { 
      success: false, 
      message: error.message || "Failed to fetch footer configuration." 
    };
  }
}

// Get all footer configurations
export async function getAllWebsiteFooters(): Promise<{ success: boolean; footers?: IWebsiteFooter[]; message?: string }> {
  try {
    await connectToDatabase();
    
    const footers = await WebsiteFooter.find().sort({ createdAt: -1 });
    
    return { 
      success: true, 
      footers 
    };
  } catch (error: any) {
    console.error("Error fetching footer configurations:", error);
    return { 
      success: false, 
      message: error.message || "Failed to fetch footer configurations." 
    };
  }
}

// Get the active footer configuration
export async function getActiveWebsiteFooter(): Promise<{ success: boolean; footer?: IWebsiteFooter | null; message?: string }> {
  try {
    await connectToDatabase();
    
    const footer = await WebsiteFooter.findOne({ isActive: true });
    
    // Process the footer data to ensure values are properly formatted if a footer is found
    const processedFooter = footer ? {
      ...footer.toObject(),
      name: footer.name?.trim(),
      copyrightText: footer.copyrightText?.trim(),
      contactInfo: {
        email: footer.contactInfo?.email?.trim() || "",
        phone: footer.contactInfo?.phone?.trim() || "",
        address: footer.contactInfo?.address?.trim() || "",
      }
    } : null;
    
    return { 
      success: true, 
      footer: processedFooter 
    };
  } catch (error: any) {
    console.error("Error fetching active footer configuration:", error);
    return { 
      success: false, 
      message: error.message || "Failed to fetch active footer configuration." 
    };
  }
}

// Set a specific footer as active and deactivate all others
export async function setActiveFooter(id: string): Promise<{ success: boolean; message: string }> {
  try {
    await connectToDatabase();
    
    // First deactivate all footers
    await WebsiteFooter.updateMany({}, { $set: { isActive: false } });
    
    // Then activate the specified one
    await WebsiteFooter.findByIdAndUpdate(id, { $set: { isActive: true } });
    
    revalidatePath("/admin/dashboard/customization/website-footer");
    revalidatePath("/");
    
    return { 
      success: true, 
      message: "Footer configuration activated successfully." 
    };
  } catch (error: any) {
    console.error("Error activating footer configuration:", error);
    return { 
      success: false, 
      message: error.message || "Failed to activate footer configuration." 
    };
  }
}

// Update an existing footer configuration
export async function updateWebsiteFooter(id: string, footerData: Partial<FooterFormData>): Promise<{ success: boolean; message: string; footer?: IWebsiteFooter }> {
  try {
    await connectToDatabase();
    
    // Clean data by trimming whitespace
    const cleanedData: Partial<FooterFormData> = { ...footerData };
    if (typeof cleanedData.name === 'string') cleanedData.name = cleanedData.name.trim();
    if (typeof cleanedData.copyrightText === 'string') cleanedData.copyrightText = cleanedData.copyrightText.trim();
    
    // Handle contact info
    if (cleanedData.contactInfo) {
      cleanedData.contactInfo = {
        email: cleanedData.contactInfo.email?.trim() || "",
        phone: cleanedData.contactInfo.phone?.trim() || "",
        address: cleanedData.contactInfo.address?.trim() || "",
      };
    }
    
    const updatedFooter = await WebsiteFooter.findByIdAndUpdate(
      id,
      { $set: cleanedData },
      { new: true }
    );
    
    if (!updatedFooter) {
      return { 
        success: false, 
        message: "Footer configuration not found." 
      };
    }
    
    // If this footer should be active, deactivate all others
    if (footerData.isActive) {
      await setActiveFooter(id);
    }
    
    revalidatePath("/admin/dashboard/customization/website-footer");
    revalidatePath("/");
    
    return { 
      success: true, 
      message: "Footer configuration updated successfully.", 
      footer: updatedFooter 
    };
  } catch (error: any) {
    console.error("Error updating footer configuration:", error);
    return { 
      success: false, 
      message: error.message || "Failed to update footer configuration." 
    };
  }
}

// Delete a footer configuration
export async function deleteWebsiteFooter(id: string): Promise<{ success: boolean; message: string }> {
  try {
    await connectToDatabase();
    
    const footer = await WebsiteFooter.findById(id);
    
    if (!footer) {
      return { 
        success: false, 
        message: "Footer configuration not found." 
      };
    }
    
    // Don't allow deleting the active footer
    if (footer.isActive) {
      return { 
        success: false, 
        message: "Cannot delete the active footer configuration. Please activate another footer first." 
      };
    }
    
    await WebsiteFooter.findByIdAndDelete(id);
    
    revalidatePath("/admin/dashboard/customization/website-footer");
    
    return { 
      success: true, 
      message: "Footer configuration deleted successfully." 
    };
  } catch (error: any) {
    console.error("Error deleting footer configuration:", error);
    return { 
      success: false, 
      message: error.message || "Failed to delete footer configuration." 
    };
  }
}