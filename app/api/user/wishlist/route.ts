import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/database/connect";
import Wishlist from "@/lib/database/models/wishlist.model";
import User from "@/lib/database/models/user.model"; // Ensure User model is imported
import Product from "@/lib/database/models/product.model"; // Ensure Product model is imported

// GET user's wishlist
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const wishlistItems = await Wishlist.find({ user: session.user.id })
      .populate({
        path: 'product',
        model: Product, // Explicitly specify the model
        select: 'name slug subProducts price rating numReviews', // Select fields you need
        populate: { // If you need details from subProducts like image
          path: 'subProducts',
          select: 'images price originalPrice discount sizes color',
        }
      })
      .sort({ addedAt: -1 }); // Sort by most recently added

    // Transform data to include necessary product details like image and price from subProducts
    const transformedWishlist = wishlistItems.map(item => {
      const productData = item.product as any; // Type assertion
      let image = '/placeholder-product.png';
      let price = productData?.price || 0; // Default price from product level

      if (productData?.subProducts && productData.subProducts.length > 0) {
        const firstSubProduct = productData.subProducts[0];
        if (firstSubProduct.images && firstSubProduct.images.length > 0) {
          image = typeof firstSubProduct.images[0] === 'string' ? firstSubProduct.images[0] : firstSubProduct.images[0]?.url;
        }
        // Use price from subProduct if available, potentially the lowest price among sizes
        if (firstSubProduct.sizes && firstSubProduct.sizes.length > 0) {
           const validPrices = firstSubProduct.sizes.map((s: any) => parseFloat(s.price)).filter((p: number) => !isNaN(p) && p > 0);
           if (validPrices.length > 0) {
             price = Math.min(...validPrices);
           } else {
             price = parseFloat(firstSubProduct.price) || price; // Fallback to subProduct price
           }
        } else {
           price = parseFloat(firstSubProduct.price) || price; // Fallback if no sizes
        }
      }

      return {
        _id: item._id, // Wishlist item ID
        productId: productData?._id,
        name: productData?.name,
        slug: productData?.slug,
        image: image,
        price: price,
        rating: productData?.rating,
        reviews: productData?.numReviews,
        addedAt: item.addedAt,
      };
    });


    return NextResponse.json({ success: true, wishlist: transformedWishlist });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return NextResponse.json({ message: "Failed to fetch wishlist", error: (error as Error).message }, { status: 500 });
  }
}

// POST add item to wishlist
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ message: "Product ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    // Check if user and product exist (optional but good practice)
    const userExists = await User.findById(session.user.id);
    if (!userExists) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    const productExists = await Product.findById(productId);
    if (!productExists) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    // Check if item already exists in wishlist
    const existingItem = await Wishlist.findOne({ user: session.user.id, product: productId });
    if (existingItem) {
      return NextResponse.json({ success: true, message: "Item already in wishlist", wishlistItem: existingItem }, { status: 200 }); // Or 409 Conflict
    }

    // Create new wishlist item
    const newItem = new Wishlist({
      user: session.user.id,
      product: productId,
    });
    await newItem.save();

    return NextResponse.json({ success: true, message: "Item added to wishlist", wishlistItem: newItem }, { status: 201 });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    // Handle potential duplicate key error from the unique index
     if ((error as any).code === 11000) {
       return NextResponse.json({ message: "Item already exists in wishlist" }, { status: 409 });
     }
    return NextResponse.json({ message: "Failed to add item to wishlist", error: (error as Error).message }, { status: 500 });
  }
}

// DELETE remove item from wishlist
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get productId from query parameters
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ message: "Product ID is required in query parameters" }, { status: 400 });
    }

    await connectToDatabase();

    const result = await Wishlist.deleteOne({ user: session.user.id, product: productId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Item not found in wishlist" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Item removed from wishlist" });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return NextResponse.json({ message: "Failed to remove item from wishlist", error: (error as Error).message }, { status: 500 });
  }
}
