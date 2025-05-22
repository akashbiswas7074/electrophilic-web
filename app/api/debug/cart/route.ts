import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/database/connect";
import User from "@/lib/database/models/user.model";
import Cart from "@/lib/database/models/cart.model";
import { getServerSession } from "next-auth/next";
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
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" }, 
        { status: 404 }
      );
    }
    
    const cart = await Cart.findOne({ user: user._id });
    
    return NextResponse.json({
      success: true,
      cart: cart ? {
        _id: cart._id,
        products: cart.products.map((p: { product: any; name: any; price: any; qty: any; }) => ({
          id: p.product,
          name: p.name,
          price: p.price,
          quantity: p.qty
        })),
        cartTotal: cart.cartTotal,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt
      } : null
    });
  } catch (error) {
    console.error("Debug cart error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get cart debug info" },
      { status: 500 }
    );
  }
}
