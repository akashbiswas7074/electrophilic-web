import Wishlist from "../models/wishlist.model";
import Product from "../models/product.model"; // Ensure Product model is imported for population
import { connectToDatabase } from "../connect";
import { revalidatePath } from "next/cache"; // Import revalidatePath if needed for cache invalidation
import mongoose from "mongoose";

// Define the interface for wishlist items
interface IWishlist {
  user: mongoose.Types.ObjectId | string;
  items: Array<{
    product: {
      _id: mongoose.Types.ObjectId | string;
      name: string;
      slug: string;
      subProducts?: Array<{
        images?: Array<{ url: string }>;
        discount?: number;
        sizes?: Array<{
          price: number;
          originalPrice?: number;
        }>;
      }>;
    };
    addedAt: Date;
  }>;
}

// Helper function to safely stringify complex objects for logging
const safeJsonStringify = (obj: any) => {
  try {
    // Limit depth or handle circular references if necessary
    return JSON.stringify(obj, null, 2); // Pretty print for readability
  } catch (error) {
    console.error("Error stringifying object:", error);
    return "[Unserializable Object]";
  }
};

export async function getWishlistItems(userId: string) {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    console.error("getWishlistItems: Invalid userId provided.");
    throw new Error("Invalid user ID.");
  }
  try {
    await connectToDatabase();
    console.log(`Fetching wishlist for user: ${userId}`);

    const rawWishlist = await Wishlist.findOne({ user: userId })
      .populate({
        path: "items.product",
        model: Product, // Explicitly specify the model for population
        select: "name slug subProducts", // Select necessary fields from Product
      })
      .lean(); // Use lean for plain JS objects, faster reads

    if (!rawWishlist) {
      console.log(`No wishlist found for user: ${userId}`);
      return []; // Return empty array if no wishlist found
    }

    // Cast the lean object to your IWishlist interface
    const wishlist = rawWishlist as unknown as IWishlist; // Replace IWishlist with your actual interface name if different

    if (!wishlist.items || wishlist.items.length === 0) {
      console.log(`Wishlist found but is empty for user: ${userId}`);
      return []; // Return empty array if no items
    }

    console.log(`Found wishlist for user ${userId} with ${wishlist.items.length} items.`);

    // Map items and safely access potentially missing nested properties
    const mappedItems = wishlist.items
      .map((item: any) => {
        // Check if product was populated correctly and is an object
        if (!item.product || typeof item.product !== 'object') {
          console.warn(`Item with product ref ${item.product} could not be populated correctly for user ${userId}. Skipping.`);
          return null; // Skip this item if product data is missing or not populated
        }

        // Safely access nested properties with optional chaining and nullish coalescing
        const firstSubProduct = item.product.subProducts?.[0];
        const firstSize = firstSubProduct?.sizes?.[0];

        return {
          _id: item.product._id.toString(), // Ensure ID is a string
          name: item.product.name ?? "Product Name Unavailable",
          slug: item.product.slug ?? "#",
          // Provide a default placeholder image
          image: firstSubProduct?.images?.[0]?.url ?? "/images/placeholder-product.png",
          price: firstSize?.price ?? 0,
          originalPrice: firstSize?.originalPrice, // Can be undefined
          discount: firstSubProduct?.discount, // Can be undefined
          addedAt: item.addedAt, // Keep the date object or format if needed
        };
      })
      .filter(Boolean); // Remove any null items resulting from population issues

    console.log(`Mapped ${mappedItems.length} wishlist items for user ${userId}.`);
    // Uncomment for detailed logging if needed:
    // console.log(`Mapped wishlist items for user ${userId}:`, safeJsonStringify(mappedItems));
    return mappedItems;

  } catch (error: any) {
    console.error(`Error fetching wishlist for user ${userId}:`, error);
    // Throw a more specific error or handle based on error type
    throw new Error(`Failed to fetch wishlist: ${error.message}`);
  }
}

export async function addItemToWishlist(userId: string, productId: string) {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    console.error("addItemToWishlist: Invalid userId provided.");
    throw new Error("Invalid user ID.");
  }
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    console.error("addItemToWishlist: Invalid productId provided.");
    throw new Error("Invalid product ID.");
  }

  try {
    await connectToDatabase();
    console.log(`Attempting to add product ${productId} to wishlist for user ${userId}`);

    // Find the user's wishlist or create a new one if it doesn't exist
    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      console.log(`Wishlist not found for user ${userId}. Creating new wishlist.`);
      wishlist = new Wishlist({ user: userId, items: [] });
    }

    // Check if the product is already in the wishlist
    const itemExists = wishlist.items.some(
      (item: any) => item.product.toString() === productId
    );

    if (itemExists) {
      console.log(`Product ${productId} already exists in wishlist for user ${userId}.`);
      // Return a clear status, not an error
      return { success: true, message: "Item already in wishlist." };
    }

    // Add the new item with the current timestamp
    wishlist.items.push({ product: new mongoose.Types.ObjectId(productId), addedAt: new Date() });
    await wishlist.save();

    console.log(`Product ${productId} added successfully to wishlist for user ${userId}`);

    // Optional: Revalidate paths if using Next.js App Router caching heavily
    // revalidatePath('/wishlist');
    // Consider revalidating product page if wishlist status is shown there statically
    // revalidatePath(`/product/[slug]`); // Needs specific slug

    return { success: true, message: "Item added to wishlist." };

  } catch (error: any) {
    console.error(`Error adding item ${productId} to wishlist for user ${userId}:`, error);
    // Check for specific Mongoose errors if needed (e.g., validation)
    throw new Error(`Failed to add item to wishlist: ${error.message}`);
  }
}

export async function removeItemFromWishlist(userId: string, productId: string) {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    console.error("removeItemFromWishlist: Invalid userId provided.");
    throw new Error("Invalid user ID.");
  }
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    console.error("removeItemFromWishlist: Invalid productId provided.");
    throw new Error("Invalid product ID.");
  }

  try {
    await connectToDatabase();
    console.log(`Attempting to remove product ${productId} from wishlist for user ${userId}`);

    const result = await Wishlist.updateOne(
      { user: userId },
      // Use $pull to remove the item matching the product ID from the items array
      { $pull: { items: { product: new mongoose.Types.ObjectId(productId) } } }
    );

    // Check if any document was modified
    if (result.modifiedCount === 0) {
      console.log(`Product ${productId} not found in wishlist or already removed for user ${userId}. No update performed.`);
      // It's often okay if the item wasn't there; return success unless strict check needed
      // return { success: false, message: "Item not found in wishlist." };
    } else {
       console.log(`Product ${productId} removed successfully from wishlist for user ${userId}`);
    }

    // Optional: Revalidate relevant paths
    // revalidatePath('/wishlist');

    return { success: true, message: "Item removed from wishlist." };

  } catch (error: any) {
    console.error(`Error removing item ${productId} from wishlist for user ${userId}:`, error);
    throw new Error(`Failed to remove item from wishlist: ${error.message}`);
  }
}
