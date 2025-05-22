import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/database/connect';
import { siteConfig } from '@/lib/site-config';
import WebsiteLogo from '@/lib/database/models/website.logo.model';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Try to fetch the logo from database
    const logo = await WebsiteLogo.findOne({ isActive: true });
    
    // Default logo from site config as fallback
    const defaultLogo = {
      name: siteConfig.name,
      logoUrl: siteConfig.logo.imagePath,
      altText: siteConfig.name,
      isActive: true,
    };
    
    return NextResponse.json({ 
      success: true, 
      logo: logo || defaultLogo,
      defaultLogo
    });
    
  } catch (error: any) {
    console.error('Error fetching website logo:', error);
    
    // Return default logo from site config when there's an error
    const defaultLogo = {
      name: siteConfig.name,
      logoUrl: siteConfig.logo.imagePath,
      altText: siteConfig.name,
      isActive: true,
    };
    
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Failed to fetch website logo',
        defaultLogo
      },
      { status: 500 }
    );
  }
}