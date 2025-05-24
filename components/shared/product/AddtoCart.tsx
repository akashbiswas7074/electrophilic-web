"use client";

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { MinusCircle, PlusCircle, ShoppingBag, Loader2 } from 'lucide-react'; // Import Loader2
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useCartStore } from '@/store/cart'; // Import the Zustand store

interface AddToCartProps {
  product: {
    _id: string;
    name: string;
    price: number;
    image?: string; // Make image optional
    images?: { url: string }[]; // Add images array
    quantity?: number; // Available stock
    subProducts?: { // Added subProducts for variant handling
      _id: string;
      sizes: { size: string; qty: number; price: number; originalPrice?: number }[]; // Size-specific inventory
    }[];
    // Add other necessary product fields
    style?: any; // Ensure style is passed
    size?: any; // Ensure size is passed
  };
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  selectedSize?: string;
  selectedStyle?: any; // Use selectedStyle instead of selectedColor
}

export default function AddToCart({
  product,
  variant = 'default',
  size = 'default',
  selectedSize,
  selectedStyle, // Use selectedStyle
}: AddToCartProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const addToCartStore = useCartStore((state: any) => state.addToCart);
  const { status } = useSession();

  // Determine max quantity based on available stock if provided
  const maxQuantity = product.quantity || Infinity;

  // Find the specific inventory for the selected size
  const getInventoryForSelectedSize = useCallback(() => {
    // If no size is selected or no subProducts exist, return default maxQuantity
    if (!selectedSize || !product.subProducts || product.subProducts.length === 0) {
      return maxQuantity;
    }
    
    // Try to find the specific size inventory in subProducts
    try {
      const subProduct = product.subProducts[0]; // Assuming first subProduct is the relevant one
      if (subProduct && subProduct.sizes) {
        const sizeVariant = subProduct.sizes.find(
          (s: any) => s.size === selectedSize
        );
        if (sizeVariant && typeof sizeVariant.qty === 'number') {
          return sizeVariant.qty;
        }
      }
    } catch (err) {
      console.error('Error finding inventory for selected size:', err);
    }
    
    // Default fallback
    return maxQuantity;
  }, [product, selectedSize, maxQuantity]);

  // Get the actual inventory level for the selected size
  const availableStock = getInventoryForSelectedSize();

  // Function to get the primary image URL
  const getPrimaryImage = () => {
    if (product.image) return product.image;
    if (product.images && product.images.length > 0 && product.images[0].url) {
      return product.images[0].url;
    }
    return "/placeholder-product.png"; // Fallback image
  };

  const handleAddToCart = async () => {
    // Validation
    if (!product || !product._id) {
      toast.error("Invalid product data");
      return;
    }
    
    // Check if product has sizes - if it does, require size selection
    const productHasSizes = product.subProducts && 
                           product.subProducts.length > 0 && 
                           product.subProducts[0]?.sizes && 
                           product.subProducts[0].sizes.length > 0;
    
    if (productHasSizes && !selectedSize) {
      toast.warning("Please select a size.");
      return;
    }
    
    if (selectedStyle === undefined || selectedStyle === null) { // Check for undefined/null style
      toast.warning("Please select a style/color.");
      return;
    }

    setIsAdding(true);
    const toastId = toast.loading("Adding item to cart...");

    try {
      console.log(`Adding ${product.name} ${productHasSizes ? `(Size: ${selectedSize}, Style: ${selectedStyle})` : `(Style: ${selectedStyle})`} to cart`);

      // Prepare item for the Zustand store
      const cartItem = {
        ...product, // Spread all product details
        _id: product._id,
        name: product.name,
        price: product.price,
        image: getPrimaryImage(), // Use the primary image
        qty: quantity, // Pass the selected quantity
        quantity: quantity, // Keep both qty and quantity for compatibility
        size: productHasSizes ? selectedSize : undefined, // Only include size if product has sizes
        style: selectedStyle, // Pass the selected style
        // _uid will be generated in the store if not provided
      };

      // Call the Zustand store action
      addToCartStore(cartItem);

      // Optionally: Trigger immediate save if needed, though store might handle debouncing
      // if (status === 'authenticated' && session?.user?.id) { ... save logic ... }

      toast.success(`${product.name} added to cart!`, { id: toastId });
      setQuantity(1); // Reset quantity after adding

    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add item to cart. Please try again.", { id: toastId });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
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
          onClick={() => setQuantity(prev => Math.min(availableStock, prev + 1))} // Prevent exceeding stock
          disabled={isAdding || quantity >= availableStock} // Disable if at max available stock
        >
          <PlusCircle className="h-4 w-4" />
        </Button>
      </div>
      
      {availableStock < 10 && (
        <p className="text-xs text-amber-600">
          Only {availableStock} {availableStock === 1 ? 'item' : 'items'} left
        </p>
      )}

      <Button
        onClick={handleAddToCart}
        disabled={isAdding || availableStock < 1 || (product.subProducts && product.subProducts.length > 0 && product.subProducts[0]?.sizes && product.subProducts[0].sizes.length > 0 && !selectedSize)}
        variant={variant === 'default' ? 'default' : 'secondary'}
        size={size === 'default' ? 'default' : 'sm'}
        className="w-full"
      >
        {isAdding ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adding...
          </>
        ) : availableStock < 1 ? (
          "Out of Stock"
        ) : (
          "Add to Cart"
        )}
      </Button>
    </div>
  );
}
