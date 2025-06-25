import { NextRequest, NextResponse } from 'next/server';
import { syncHeroSectionsToWebsiteSections } from '@/lib/database/actions/website.section.actions';

export async function POST(request: NextRequest) {
  try {
    const result = await syncHeroSectionsToWebsiteSections();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error syncing hero sections:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to sync hero sections'
    }, { status: 500 });
  }
}