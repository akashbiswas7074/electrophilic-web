"use server";

import { connectToDatabase } from "../connect";
import WebsiteSection, { IWebsiteSection } from "../models/website.section.model";
import HeroSection from "../models/hero-section.model";

/**
 * Get all visible website sections sorted by order
 * Used by the homepage to determine which sections to show and in what order
 */
export async function getVisibleWebsiteSections() {
  try {
    await connectToDatabase();
    
    const sections = await WebsiteSection.find({ isVisible: true })
      .sort({ order: 1 })
      .populate('categoryId', 'name slug image');
    
    return {
      success: true,
      sections: JSON.parse(JSON.stringify(sections)),
    };
  } catch (error) {
    console.error("Error getting visible website sections:", error);
    return {
      success: false,
      message: "Failed to get website sections",
      sections: [],
    };
  }
}

/**
 * Get all website sections (visible and hidden) sorted by order
 * Used by admin interface
 */
export async function getAllWebsiteSections() {
  try {
    await connectToDatabase();
    
    const sections = await WebsiteSection.find()
      .sort({ order: 1 })
      .populate('categoryId', 'name slug image');
    
    return {
      success: true,
      sections: JSON.parse(JSON.stringify(sections)),
    };
  } catch (error) {
    console.error("Error getting website sections:", error);
    return {
      success: false,
      message: "Failed to get website sections",
      sections: [],
    };
  }
}

/**
 * Sync hero sections to website sections
 * This ensures each active hero section has a corresponding website section
 */
export async function syncHeroSectionsToWebsiteSections() {
  try {
    await connectToDatabase();
    
    // Get all hero sections
    const heroSections = await HeroSection.find();
    
    // Get existing website sections that are hero sections
    const existingHeroWebsiteSections = await WebsiteSection.find({
      sectionId: { $regex: '^dynamic-hero-section-' }
    });
    
    const existingHeroSectionIds = new Set(
      existingHeroWebsiteSections.map(section => 
        section.sectionId.replace('dynamic-hero-section-', '')
      )
    );
    
    // Create website sections for hero sections that don't have them
    const sectionsToCreate = [];
    let maxOrder = await WebsiteSection.countDocuments() + 1;
    
    for (const heroSection of heroSections) {
      const heroSectionId = heroSection._id.toString();
      
      if (!existingHeroSectionIds.has(heroSectionId)) {
        sectionsToCreate.push({
          name: `Hero: ${heroSection.title}`,
          sectionId: `dynamic-hero-section-${heroSectionId}`,
          isVisible: heroSection.isActive,
          order: maxOrder++,
          description: `Dynamic hero section: ${heroSection.subtitle || heroSection.title}`,
          heroSectionId: heroSectionId,
        });
      }
    }
    
    // Create new website sections
    if (sectionsToCreate.length > 0) {
      await WebsiteSection.insertMany(sectionsToCreate);
    }
    
    // Update existing hero website sections to match hero section status
    for (const heroSection of heroSections) {
      const heroSectionId = heroSection._id.toString();
      const websiteSection = existingHeroWebsiteSections.find(
        section => section.sectionId === `dynamic-hero-section-${heroSectionId}`
      );
      
      if (websiteSection && websiteSection.isVisible !== heroSection.isActive) {
        await WebsiteSection.findByIdAndUpdate(
          websiteSection._id,
          { 
            isVisible: heroSection.isActive,
            name: `Hero: ${heroSection.title}`,
            description: `Dynamic hero section: ${heroSection.subtitle || heroSection.title}`,
            heroSectionId: heroSectionId,
          }
        );
      }
    }
    
    // Remove website sections for deleted hero sections
    const currentHeroSectionIds = new Set(heroSections.map(hs => hs._id.toString()));
    const sectionsToDelete = existingHeroWebsiteSections.filter(
      section => {
        const heroId = section.sectionId.replace('dynamic-hero-section-', '');
        return !currentHeroSectionIds.has(heroId);
      }
    );
    
    if (sectionsToDelete.length > 0) {
      await WebsiteSection.deleteMany({
        _id: { $in: sectionsToDelete.map(s => s._id) }
      });
    }
    
    return {
      success: true,
      message: `Synced ${sectionsToCreate.length} new hero sections, updated existing sections, and removed ${sectionsToDelete.length} orphaned sections`,
      created: sectionsToCreate.length,
      deleted: sectionsToDelete.length,
    };
  } catch (error) {
    console.error("Error syncing hero sections to website sections:", error);
    return {
      success: false,
      message: "Failed to sync hero sections",
    };
  }
}

/**
 * Update section order
 */
export async function updateSectionOrder(sectionId: string, newOrder: number) {
  try {
    await connectToDatabase();
    
    await WebsiteSection.findByIdAndUpdate(sectionId, { order: newOrder });
    
    return {
      success: true,
      message: "Section order updated successfully",
    };
  } catch (error) {
    console.error("Error updating section order:", error);
    return {
      success: false,
      message: "Failed to update section order",
    };
  }
}

/**
 * Toggle section visibility
 */
export async function toggleSectionVisibility(sectionId: string) {
  try {
    await connectToDatabase();
    
    const section = await WebsiteSection.findById(sectionId);
    if (!section) {
      return {
        success: false,
        message: "Section not found",
      };
    }
    
    section.isVisible = !section.isVisible;
    await section.save();
    
    return {
      success: true,
      message: `Section ${section.isVisible ? 'shown' : 'hidden'} successfully`,
      section: JSON.parse(JSON.stringify(section)),
    };
  } catch (error) {
    console.error("Error toggling section visibility:", error);
    return {
      success: false,
      message: "Failed to toggle section visibility",
    };
  }
}