"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database/connect";
import HeroSection, { IHeroSection } from "../models/hero-section.model";
import { syncHeroSectionsToWebsiteSections } from "./website.section.actions";

/**
 * Create a new hero section
 */
export async function createHeroSection(formData: any) {
  try {
    await connectToDatabase();
    
    // Create the hero section
    const heroSection = await HeroSection.create(formData);
    
    // Sync hero sections to website sections
    await syncHeroSectionsToWebsiteSections();
    
    revalidatePath("/admin/dashboard/hero-sections");
    revalidatePath("/");
    
    return {
      success: true,
      message: "Hero section created successfully",
      section: heroSection,
    };
  } catch (error: any) {
    console.error("Error creating hero section:", error);
    
    return {
      success: false,
      message: error.message || "Failed to create hero section",
    };
  }
}

/**
 * Update an existing hero section
 */
export async function updateHeroSection(id: string, formData: any) {
  try {
    await connectToDatabase();
    
    // Find and update the hero section
    const updatedSection = await HeroSection.findByIdAndUpdate(
      id,
      { $set: formData },
      { new: true }
    );
    
    if (!updatedSection) {
      return {
        success: false,
        message: "Hero section not found",
      };
    }
    
    // Sync hero sections to website sections
    await syncHeroSectionsToWebsiteSections();
    
    revalidatePath("/admin/dashboard/hero-sections");
    revalidatePath("/");
    
    return {
      success: true,
      message: "Hero section updated successfully",
      section: updatedSection,
    };
  } catch (error: any) {
    console.error("Error updating hero section:", error);
    
    return {
      success: false,
      message: error.message || "Failed to update hero section",
    };
  }
}

/**
 * Delete a hero section
 */
export async function deleteHeroSection(id: string) {
  try {
    await connectToDatabase();
    
    // Find and delete the hero section
    const deletedSection = await HeroSection.findByIdAndDelete(id);
    
    if (!deletedSection) {
      return {
        success: false,
        message: "Hero section not found",
      };
    }
    
    // Sync hero sections to website sections (this will remove orphaned website sections)
    await syncHeroSectionsToWebsiteSections();
    
    revalidatePath("/admin/dashboard/hero-sections");
    revalidatePath("/");
    
    return {
      success: true,
      message: "Hero section deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting hero section:", error);
    
    return {
      success: false,
      message: error.message || "Failed to delete hero section",
    };
  }
}

/**
 * Get a single hero section by ID
 */
export async function getHeroSectionById(id: string) {
  try {
    await connectToDatabase();
    
    const section = await HeroSection.findById(id);
    
    if (!section) {
      return {
        success: false,
        message: "Hero section not found",
      };
    }
    
    return {
      success: true,
      section,
    };
  } catch (error: any) {
    console.error("Error fetching hero section:", error);
    
    return {
      success: false,
      message: error.message || "Failed to fetch hero section",
    };
  }
}

/**
 * Get all hero sections
 */
export async function getAllHeroSections() {
  try {
    await connectToDatabase();
    
    const sections = await HeroSection.find().sort({ order: 1 });
    
    return {
      success: true,
      sections,
    };
  } catch (error: any) {
    console.error("Error fetching hero sections:", error);
    
    return {
      success: false,
      message: error.message || "Failed to fetch hero sections",
    };
  }
}

/**
 * Get all active hero sections for the website
 */
export async function getActiveHeroSections() {
  try {
    await connectToDatabase();
    
    const sections = await HeroSection.find({ isActive: true }).sort({ order: 1 });
    
    return {
      success: true,
      sections,
    };
  } catch (error: any) {
    console.error("Error fetching active hero sections:", error);
    
    return {
      success: false,
      message: error.message || "Failed to fetch active hero sections",
    };
  }
}

/**
 * Toggle a hero section's active status
 */
export async function toggleHeroSectionActive(id: string) {
  try {
    await connectToDatabase();
    
    // Find the hero section
    const section = await HeroSection.findById(id);
    
    if (!section) {
      return {
        success: false,
        message: "Hero section not found",
      };
    }
    
    // Toggle the isActive status
    section.isActive = !section.isActive;
    await section.save();
    
    // Sync hero sections to website sections to update visibility
    await syncHeroSectionsToWebsiteSections();
    
    revalidatePath("/admin/dashboard/hero-sections");
    revalidatePath("/");
    
    return {
      success: true,
      message: `Hero section ${section.isActive ? "activated" : "deactivated"} successfully`,
      section,
    };
  } catch (error: any) {
    console.error("Error toggling hero section status:", error);
    
    return {
      success: false,
      message: error.message || "Failed to toggle hero section status",
    };
  }
}

/**
 * Update the order of hero sections
 */
export async function updateHeroSectionOrder(orderedIds: string[]) {
  try {
    await connectToDatabase();
    
    // Update the order for each section
    const updatePromises = orderedIds.map((id, index) => {
      return HeroSection.findByIdAndUpdate(id, { order: index + 1 });
    });
    
    await Promise.all(updatePromises);
    
    revalidatePath("/admin/dashboard/hero-sections");
    revalidatePath("/");
    
    return {
      success: true,
      message: "Hero section order updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating hero section order:", error);
    
    return {
      success: false,
      message: error.message || "Failed to update hero section order",
    };
  }
}