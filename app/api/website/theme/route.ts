import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import WebsiteSettings, { IWebsiteSettings } from "@/lib/database/models/website.settings.model";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    
    const activeSettings = await WebsiteSettings.findOne({ isActive: true }).lean() as IWebsiteSettings | null;
    
    if (activeSettings) {
      return NextResponse.json({ 
        success: true, 
        theme: {
          primaryColor: activeSettings.themeSettings?.primaryColor || '#2B2B2B',
          secondaryColor: activeSettings.themeSettings?.secondaryColor || '#6B7280',
          accentColor: activeSettings.themeSettings?.accentColor || '#3B82F6',
          backgroundColor: activeSettings.themeSettings?.backgroundColor || '#FFFFFF',
          textColor: activeSettings.themeSettings?.textColor || '#1F2937',
          borderRadius: activeSettings.themeSettings?.borderRadius || '0.5rem',
          fontFamily: activeSettings.themeSettings?.fontFamily || 'Inter',
          customCSS: activeSettings.themeSettings?.customCSS || '',
          darkMode: activeSettings.themeSettings?.darkMode || false,
        }
      });
    }

    // Return default theme
    return NextResponse.json({ 
      success: true, 
      theme: {
        primaryColor: '#2B2B2B',
        secondaryColor: '#6B7280',
        accentColor: '#3B82F6',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        borderRadius: '0.5rem',
        fontFamily: 'Inter',
        customCSS: '',
        darkMode: false,
      }
    });

  } catch (error) {
    console.error("Error fetching theme settings:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch theme settings" },
      { status: 500 }
    );
  }
}