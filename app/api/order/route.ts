import { NextRequest, NextResponse } from 'next/server';
import { processCheckoutSteps } from '@/lib/database/actions/order.actions';

export async function POST(request: NextRequest) {
  console.log('[API /api/order] Received POST request.'); // Log start
  try {
    const data = await request.json();
    console.log('[API /api/order] Request body parsed:', data);

    // Call the processing function
    console.log('[API /api/order] Calling processCheckoutSteps...');
    const result = await processCheckoutSteps(data);
    console.log('[API /api/order] processCheckoutSteps returned:', result);

    // Check the result and return appropriate response
    if (result && typeof result === 'object') {
      console.log(`[API /api/order] Sending JSON response: ${JSON.stringify(result)}`);
      return NextResponse.json(result);
    } else {
      // Handle cases where processCheckoutSteps might return something unexpected
      console.error('[API /api/order] Unexpected result from processCheckoutSteps:', result);
      return NextResponse.json({ success: false, message: 'Internal server error: Invalid processing result' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[API /api/order] Error caught in POST handler:', error);
    // Ensure a JSON response is sent even on error
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Internal Server Error' 
      }, 
      { status: 500 }
    );
  }
}
