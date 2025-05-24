import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/database/connect";
import Wishlist from "@/lib/database/models/wishlist.model";
import User from "@/lib/database/models/user.model";
import Product from "@/lib/database/models/product.model";
import mongoose from "mongoose";

// GET user's wishlist
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    
    // Get user's wishlist with populated product data
    const wishlist = await Wishlist.findOne({ user: session.user.id })
      .populate({
        path: 'items.product',
        model: Product,
        select: 'name slug subProducts price rating numReviews',
      });

    if (!wishlist) {
      return NextResponse.json({ success: true, wishlist: [] });
    }

    // Transform data to include necessary product details
    const transformedWishlist = wishlist.items.map((item: any) => {
      const productData = item.product;
      let image = '/placeholder-product.png';
      let price = productData?.price || 0;

      if (productData?.subProducts && productData.subProducts.length > 0) {
        const firstSubProduct = productData.subProducts[0];
        if (firstSubProduct.images && firstSubProduct.images.length > 0) {
          image = typeof firstSubProduct.images[0] === 'string' 
            ? firstSubProduct.images[0] 
            : firstSubProduct.images[0]?.url;
        }
        
        // Get price from subProduct sizes if available
        if (firstSubProduct.sizes && firstSubProduct.sizes.length > 0) {
          const validPrices = firstSubProduct.sizes
            .map((s: any) => parseFloat(s.price))
            .filter((p: any) => !isNaN(p) && p > 0);
            
          if (validPrices.length > 0) {
            price = Math.min(...validPrices);
          } else {
            price = parseFloat(firstSubProduct.price) || price;
          }
        } else {
          price = parseFloat(firstSubProduct.price) || price;
        }
      }

      return {
        _id: productData._id, // Use the PRODUCT ID for frontend operations
        name: productData?.name || "Product Name Unavailable",
        slug: productData?.slug || "#",
        image: image,
        price: price,
        rating: productData?.rating || 0,
        reviews: productData?.numReviews || 0,
        addedAt: item.addedAt,
      };
    });

    return NextResponse.json({ success: true, wishlist: transformedWishlist });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch wishlist", error: (error as Error).message }, 
      { status: 500 }
    );
  }
}

// POST add item to wishlist
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ success: false, message: "Product ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    // Validate product exists
    const productExists = await Product.findById(productId);
    if (!productExists) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    // Find or create wishlist for user
    let wishlist = await Wishlist.findOne({ user: session.user.id });
    
    if (!wishlist) {
      // Create new wishlist if it doesn't exist
      wishlist = new Wishlist({
        user: session.user.id,
        items: []
      });
    }

    // Check if product already exists in wishlist
    const itemExists = wishlist.items.some(
      (item: any) => item.product.toString() === productId
    );

    if (itemExists) {
      return NextResponse.json(
        { success: true, message: "Item already in wishlist" },
        { status: 200 }
      );
    }

    // Add the new item to items array
    wishlist.items.push({
      product: new mongoose.Types.ObjectId(productId),
      addedAt: new Date()
    });
    
    await wishlist.save();

    return NextResponse.json(
      { success: true, message: "Item added to wishlist" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add item to wishlist", error: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE remove item from wishlist
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get productId from query parameters
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { success: false, message: "Product ID is required in query parameters" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Use $pull to remove the item from the items array
    const result = await Wishlist.updateOne(
      { user: session.user.id },
      { $pull: { items: { product: new mongoose.Types.ObjectId(productId) } } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Wishlist not found" },
        { status: 404 }
      );
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Item not found in wishlist" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Item removed from wishlist" });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return NextResponse.json(
      { success: false, message: "Failed to remove item from wishlist", error: (error as Error).message },
      { status: 500 }
    );
  }
}
