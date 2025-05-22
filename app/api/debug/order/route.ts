import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/database/connect';
import Order from '@/lib/database/models/order.model';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get the Order model schema
    const orderSchema = Order.schema;
    
    let statusEnumValues: string[] = [];
    
    // Try to safely access enum values with type assertion
    try {
      // Access the enum values safely with type assertion
      const statusPath = orderSchema.path('status') as any;
      statusEnumValues = statusPath?.enumValues || statusPath?.options?.enum || [];
    } catch (err) {
      console.warn("Could not access status enum values:", err);
    }
    
    // Check if pending_cod_verification exists in the enum
    const hasPendingCodStatus = statusEnumValues.includes('pending_cod_verification');
    
    return NextResponse.json({
      success: true,
      message: "Debug info for Order schema retrieved",
      statusEnumValues,
      hasPendingCodStatus,
      modelName: Order.modelName,
      isCompiled: !!Order.schema.paths,
    });
  } catch (error: any) {
    console.error("Error in debug route:", error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}