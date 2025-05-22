"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { MinusCircle, PlusCircle, ShoppingBag, Loader2 } from 'lucide-react'; // Import Loader2
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useCartStore } from '@/store/cart'; // Import the Zustand store

interface AddToCartProps {
  product: {
    _id: string;
    name: string;
    price: number; // This might be the base price, actual price depends on size
    originalPrice?: number; // Base original price
    image?: string;
    images?: { url: string }[];
    quantity?: number; // This might represent total stock, not per size
    // Add other necessary product fields if needed by the cart
    slug?: string; // Include slug if needed by cart/context
    sizes?: any[]; // Include sizes if needed for price calculation here (though better done on product page)
    subProducts?: any[]; // Include subProducts if needed for price/discount calc here
  };
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  selectedSize?: string; // Size string like "M", "L"
  selectedSizeIndex?: number; // Index of the selected size
}

// Helper function to safely convert to string
const safeToString = (value: any): string => {
    if (value === null || value === undefined) {
        return "";
    }
    return String(value);
};

export default function AddToCart({
  product,
  variant = 'default',
  size = 'default',
  selectedSize, // Size string "M", "L" etc.
  selectedSizeIndex, // Index of the selected size
}: AddToCartProps) {
  // Use the Zustand store action directly
  const addToCartStore = useCartStore((state: any) => state.addToCart);
  const { status } = useSession();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  // Function to get the primary image URL (assuming first subProduct)
  const getPrimaryImage = () => {
    const firstSubProduct = product.subProducts?.[0];
    return firstSubProduct?.images?.[0]?.url || product.image || "/placeholder-product.png";
  };

  const handleAddToCart = async () => {
    // Validation
    if (!product || !product._id) {
      toast.error("Invalid product data");
      return;
    }
    if (!selectedSize || selectedSizeIndex === undefined) {
      toast.warning("Please select a size.");
      // Optionally scroll to size selection
      document.getElementById("sizeGrid")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // --- Recalculate Price & Get Available Qty for the selected size ---
    // This logic should ideally mirror the product page calculation
    const subProduct = product.subProducts?.[0];
    const sizeData = subProduct?.sizes?.[selectedSizeIndex];

    if (!subProduct || !sizeData) {
        toast.error("Could not find details for the selected size.");
        return;
    }

    const subProductDiscount = subProduct.discount || 0;
    const sizeOriginalPrice = sizeData.originalPrice || sizeData.price || 0;
    const sizeFinalPrice = subProductDiscount > 0
        ? sizeOriginalPrice - (sizeOriginalPrice * subProductDiscount / 100)
        : sizeOriginalPrice;
    const availableQuantity = sizeData.qty || 0;
    // --- End Recalculation ---

    if (availableQuantity < quantity) {
      toast.error(`Sorry, "${product.name}" (Size: ${selectedSize}) has insufficient quantity (requested ${quantity}, only ${availableQuantity} available).`);
      return;
    }

    setIsAdding(true);
    const toastId = toast.loading("Adding item to cart...");

    try {
      console.log(`Adding ${product.name} (Size: ${selectedSize}) to cart`);

      // Prepare item for the Zustand store
      const cartItem = {
        // Base product info
        _id: product._id,
        name: product.name,
        slug: product.slug, // Include slug if needed

        // Use calculated price for the selected size
        price: sizeFinalPrice,
        originalPrice: sizeOriginalPrice, // Include original price for potential savings display
        discount: subProductDiscount, // Include discount

        image: getPrimaryImage(),

        // Variant/Selection info
        size: selectedSize, // The size string ("M", "L")

        // Quantity
        quantity: quantity,
        qty: quantity,

        // Add available quantity information for cart validation
        availableQty: availableQuantity
      };

      // Call the Zustand store action
      addToCartStore(cartItem);
      toast.success(`${product.name} added to cart!`, { id: toastId });
      setQuantity(1); // Reset quantity after adding

    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add item to cart. Please try again.", { id: toastId });
    } finally {
      setIsAdding(false);
    }
  };

  // Determine max quantity based on available stock for the selected size
  const maxQuantity = selectedSizeIndex !== undefined && product.subProducts?.[0]?.sizes
    ? product.subProducts[0].sizes[selectedSizeIndex]?.qty || 0
    : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Quantity Selector */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
          disabled={isAdding || quantity <= 1} // Disable if adding or quantity is 1
        >
          <MinusCircle className="h-4 w-4" />
        </Button>

        <span className="w-10 text-center font-medium">{quantity}</span>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setQuantity(prev => Math.min(maxQuantity, prev + 1))} // Prevent exceeding stock
          // Disable if adding, no size selected, or max stock reached
          disabled={isAdding || selectedSizeIndex === undefined || quantity >= maxQuantity}
        >
          <PlusCircle className="h-4 w-4" />
        </Button>
        {selectedSizeIndex !== undefined && maxQuantity > 0 && (
           <span className="text-xs text-gray-500 ml-2">({maxQuantity} available)</span>
        )}
         {selectedSizeIndex !== undefined && maxQuantity <= 0 && (
           <span className="text-xs text-red-500 ml-2">(Out of stock)</span>
        )}
      </div>

      {/* Add to Cart Button */}
      <Button
        onClick={handleAddToCart}
        variant={variant}
        size={size}
        className="flex items-center justify-center gap-2" // Center content
        // Disable button if adding, or if size hasn't been selected or is out of stock
        disabled={isAdding || selectedSizeIndex === undefined || maxQuantity <= 0}
      >
        {isAdding ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> {/* Use Loader2 */}
            <span>Adding...</span>
          </>
        ) : (
          <>
            <ShoppingBag className="h-4 w-4" />
            Add to Cart
          </>
        )}
      </Button>
    </div>
  );
}
