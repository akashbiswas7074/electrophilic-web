import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import { siteConfig } from "@/lib/site-config";
import WebsiteFooter from "@/lib/database/models/website.footer.model";

export const dynamic = 'force-dynamic'; // Disable caching of this route

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Try to fetch the footer from database with explicit lean() for better performance
    const footer = await WebsiteFooter.findOne({ isActive: true }).lean();
    
    // Default footer from site config as fallback
    const defaultFooter = {
      name: siteConfig.name,
      contactInfo: {
        email: siteConfig.contact.email,
        phone: siteConfig.contact.phone,
        address: siteConfig.contact.address,
      },
      socialMedia: {
        facebook: siteConfig.social?.facebook || "",
        twitter: siteConfig.social?.twitter || "",
        instagram: siteConfig.social?.instagram || "",
        youtube: siteConfig.social?.youtube || "",
        linkedin: "",
      },
      companyLinks: [
        { title: "About Us", url: "/about" },
        { title: "Contact Us", url: "/contact" }
      ],
      shopLinks: [
        { title: "All Products", url: "/shop" },
        { title: "New Arrivals", url: "/shop/new-arrivals" }
      ],
      helpLinks: [
        { title: "FAQs", url: "/faqs" },
        { title: "Shipping", url: "/shipping" }
      ],
      copyrightText: `© ${new Date().getFullYear()} ${siteConfig.name}. All rights reserved.`,
      isActive: true
    };

    // Log for debugging purposes
    console.log("Fetched footer from MongoDB:", !!footer);
    
    // Convert MongoDB document to plain object to avoid serialization issues
    const serializedFooter = footer ? JSON.parse(JSON.stringify(footer)) : null;
    
    return NextResponse.json({ 
      success: true, 
      footer: serializedFooter || defaultFooter
    });
    
  } catch (error: any) {
    console.error("Error fetching website footer:", error);
    
    // Return default footer when there's an error
    const defaultFooter = {
      name: siteConfig.name,
      contactInfo: {
        email: siteConfig.contact.email,
        phone: siteConfig.contact.phone,
        address: siteConfig.contact.address,
      },
      socialMedia: {
        facebook: siteConfig.social?.facebook || "",
        twitter: siteConfig.social?.twitter || "",
        instagram: siteConfig.social?.instagram || "",
        youtube: siteConfig.social?.youtube || "",
        linkedin: "",
      },
      copyrightText: `© ${new Date().getFullYear()} ${siteConfig.name}. All rights reserved.`,
    };
    
    return NextResponse.json(
      { 
        success: true, // Still return success to prevent breaking the UI
        message: error.message || "Failed to fetch website footer",
        footer: defaultFooter
      },
      { status: 200 } // Return 200 with default footer rather than error
    );
  }
}