import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import {
  getWishlistItems,
  addItemToWishlist,
  removeItemFromWishlist,
} from "@/lib/database/actions/wishlist.actions";
import { authOptions } from "@/lib/auth"; // Ensure this path points to your NextAuth options

// Helper to handle errors consistently and return JSON response
const handleError = (error: any, context: string, status: number = 500) => {
  console.error(`API Error in ${context}:`, error);
  // Avoid leaking sensitive details in production
  const message = process.env.NODE_ENV === 'production'
    ? "An internal server error occurred."
    : `${context} failed: ${error.message || "Unknown error"}`;

  return NextResponse.json(
    { success: false, message },
    { status }
  );
};

// GET /api/wishlist - Fetch user's wishlist items
export async function GET(req: NextRequest) {
  const context = "GET /api/wishlist";
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log(`${context}: Unauthorized access attempt.`);
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log(`${context}: Processing request for user: ${userId}`);
    const items = await getWishlistItems(userId);
    console.log(`${context}: Successfully fetched ${items.length} items for user: ${userId}`);
    return NextResponse.json({ success: true, wishlist: items });

  } catch (error: any) {
    // Handle specific errors from actions if needed (e.g., invalid ID)
    if (error.message.includes("Invalid user ID")) {
        return handleError(error, context, 400);
    }
    return handleError(error, context);
  }
}

// POST /api/wishlist - Add an item to the wishlist
export async function POST(req: NextRequest) {
  const context = "POST /api/wishlist";
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log(`${context}: Unauthorized access attempt.`);
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    let body;
    try {
        body = await req.json();
    } catch (parseError) {
        console.error(`${context}: Invalid JSON body received.`);
        return NextResponse.json({ success: false, message: "Invalid request body."}, { status: 400 });
    }

    const { productId } = body;

    if (!productId) {
      console.log(`${context}: Missing productId for user: ${userId}`);
      return NextResponse.json(
        { success: false, message: "Product ID is required" },
        { status: 400 } // Bad Request
      );
    }

    console.log(`${context}: Processing request for user: ${userId}, product: ${productId}`);
    const result = await addItemToWishlist(userId, productId);
    console.log(`${context}: Action result for user ${userId}, product ${productId}:`, result);
    // The action now returns { success, message }, so pass it directly
    return NextResponse.json(result);

  } catch (error: any) {
     if (error.message.includes("Invalid user ID") || error.message.includes("Invalid product ID")) {
        return handleError(error, context, 400);
    }
    return handleError(error, context);
  }
}

// DELETE /api/wishlist - Remove an item from the wishlist
export async function DELETE(req: NextRequest) {
  const context = "DELETE /api/wishlist";
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log(`${context}: Unauthorized access attempt.`);
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      console.log(`${context}: Missing productId query parameter for user: ${userId}`);
      return NextResponse.json(
        { success: false, message: "Product ID query parameter is required" },
        { status: 400 } // Bad Request
      );
    }

    console.log(`${context}: Processing request for user: ${userId}, product: ${productId}`);
    const result = await removeItemFromWishlist(userId, productId);
    console.log(`${context}: Action result for user ${userId}, product ${productId}:`, result);
    // The action returns { success, message }, pass it directly
    return NextResponse.json(result);

  } catch (error: any) {
     if (error.message.includes("Invalid user ID") || error.message.includes("Invalid product ID")) {
        return handleError(error, context, 400);
    }
    return handleError(error, context);
  }
}
