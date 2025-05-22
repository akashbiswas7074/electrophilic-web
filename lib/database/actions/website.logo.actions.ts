'use server';

import { connectToDatabase } from '@/lib/database/connect';
import WebsiteLogo, { IWebsiteLogo } from '../models/website.logo.model';

/**
 * Helper function to serialize MongoDB objects to plain objects
 */
function serializeMongoObject(obj: any) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Create a new website logo
 */
export async function createWebsiteLogo(logoData: Partial<IWebsiteLogo>) {
  try {
    await connectToDatabase();

    // If this logo should be active, deactivate all others first
    if (logoData.isActive) {
      await WebsiteLogo.updateMany({}, { isActive: false });
    }

    const newLogo = await WebsiteLogo.create(logoData);
    
    return { 
      success: true, 
      message: 'Logo created successfully', 
      logo: serializeMongoObject(newLogo) 
    };
  } catch (error: any) {
    console.error('Error creating website logo:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to create logo' 
    };
  }
}

/**
 * Get all website logos
 */
export async function getAllWebsiteLogos() {
  try {
    await connectToDatabase();
    
    const logos = await WebsiteLogo.find().sort({ createdAt: -1 });
    
    return { 
      success: true, 
      logos: serializeMongoObject(logos) 
    };
  } catch (error: any) {
    console.error('Error fetching website logos:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to fetch logos' 
    };
  }
}

/**
 * Get the active website logo
 */
export async function getActiveWebsiteLogo() {
  try {
    await connectToDatabase();
    
    const logo = await WebsiteLogo.findOne({ isActive: true });
    
    if (!logo) {
      return { 
        success: false, 
        message: 'No active logo found' 
      };
    }
    
    return { 
      success: true, 
      logo: serializeMongoObject(logo) 
    };
  } catch (error: any) {
    console.error('Error fetching active logo:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to fetch active logo' 
    };
  }
}

/**
 * Update a website logo by ID
 */
export async function updateWebsiteLogo(id: string, logoData: Partial<IWebsiteLogo>) {
  try {
    await connectToDatabase();
    
    // If this logo should be active, deactivate all others first
    if (logoData.isActive) {
      await WebsiteLogo.updateMany({ _id: { $ne: id } }, { isActive: false });
    }
    
    const updatedLogo = await WebsiteLogo.findByIdAndUpdate(
      id,
      { $set: logoData },
      { new: true }
    );
    
    if (!updatedLogo) {
      return { 
        success: false, 
        message: 'Logo not found' 
      };
    }
    
    return { 
      success: true, 
      message: 'Logo updated successfully', 
      logo: serializeMongoObject(updatedLogo) 
    };
  } catch (error: any) {
    console.error(`Error updating logo ${id}:`, error);
    return { 
      success: false, 
      message: error.message || 'Failed to update logo' 
    };
  }
}

/**
 * Delete a website logo by ID
 */
export async function deleteWebsiteLogo(id: string) {
  try {
    await connectToDatabase();
    
    const logoToDelete = await WebsiteLogo.findById(id);
    
    if (!logoToDelete) {
      return { 
        success: false, 
        message: 'Logo not found' 
      };
    }
    
    // If we're deleting the active logo, make sure to check if we need to set another one as active
    const wasActive = logoToDelete.isActive;
    
    await WebsiteLogo.findByIdAndDelete(id);
    
    // If the deleted logo was active, set another one as active if available
    if (wasActive) {
      const anotherLogo = await WebsiteLogo.findOne();
      if (anotherLogo) {
        anotherLogo.isActive = true;
        await anotherLogo.save();
      }
    }
    
    return { 
      success: true, 
      message: 'Logo deleted successfully' 
    };
  } catch (error: any) {
    console.error(`Error deleting logo ${id}:`, error);
    return { 
      success: false, 
      message: error.message || 'Failed to delete logo' 
    };
  }
}

/**
 * Set a logo as active by ID
 */
export async function setLogoAsActive(id: string) {
  try {
    await connectToDatabase();
    
    // First deactivate all logos
    await WebsiteLogo.updateMany({}, { isActive: false });
    
    // Then set the specified one as active
    const activatedLogo = await WebsiteLogo.findByIdAndUpdate(
      id, 
      { isActive: true },
      { new: true }
    );
    
    if (!activatedLogo) {
      return { 
        success: false, 
        message: 'Logo not found' 
      };
    }
    
    return { 
      success: true, 
      message: 'Logo set as active successfully', 
      logo: serializeMongoObject(activatedLogo) 
    };
  } catch (error: any) {
    console.error(`Error setting logo ${id} as active:`, error);
    return { 
      success: false, 
      message: error.message || 'Failed to set logo as active' 
    };
  }
}