import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import Order from "@/lib/database/models/order.model";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDatabase();
    
    // Get orders for the user, sorted by creation date
    const orders = await Order.find({ user: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      orders: JSON.parse(JSON.stringify(orders))
    });

  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
