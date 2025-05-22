import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { batchSyncOrderItemStatusesWithProducts } from '@/lib/database/actions/order.actions';

/**
 * This API endpoint synchronizes all order statuses between orderItems and products arrays
 * It is a maintenance endpoint that should be called rarely, typically after identifying inconsistencies
 * It helps fix historical data where these arrays got out of sync
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authorization
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session?.user?.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        message: "Unauthorized. Admin access required." 
      }, { status: 401 });
    }
    
    // Run the batch sync operation
    const result = await batchSyncOrderItemStatusesWithProducts();
    
    return NextResponse.json({
      success: true,
      message: `Order status synchronization complete. Processed ${result.total} orders, updated ${result.updated} orders.`,
      details: result
    });
    
  } catch (error: any) {
    console.error('Error in sync-statuses route:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || "Error synchronizing order statuses" 
    }, { status: 500 });
  }
}
