import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, X, Minus, Plus, Eye } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';

interface QuickViewProps {
  product: {
    id: string;
    name: string;
    price: number;
    discount?: number;
    image: string;
    images?: string[];
    slug: string;
    description?: string;
    stock?: number;
    brandName?: string;
    sizes?: { size: string; inStock: boolean }[]; // Added sizes prop
  };
  children: React.ReactNode;
}

const QuickView = ({ product, children }: QuickViewProps) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(product.image);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  
  // Set default size if product has sizes
  useEffect(() => {
    if (product.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0].size);
    }
  }, [product.sizes]);
  
  const handleAddToCart = () => {
    // For products with sizes, require size selection
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert('Please select a size before adding to cart.');
      return;
    }
    
    addItem({
      _id: product.id,
      _uid: `${product.id}_${selectedSize || 'default'}_default`,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: quantity,
      size: selectedSize || undefined, // Only include size if one is selected
    });
  };
  
  const handleToggleWishlist = () => {
    if (isInWishlist(product.id)) {
      toggleWishlist(product.id);
    } else {
      toggleWishlist(product.id);
    }
  };
  
  // Calculate final price
  const finalPrice = product.discount 
    ? product.price - (product.price * (product.discount / 100))
    : product.price;
  
  // Generate additional images array or use empty array if not provided
  const additionalImages = product.images || [];
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Images */}
          <div className="p-4 flex flex-col">
            <div className="relative h-[300px] md:h-[400px] w-full mb-4 bg-gray-100 rounded">
              <Image 
                src={selectedImage} 
                alt={product.name} 
                fill
                className="object-contain"
              />
            </div>
            
            {/* Thumbnail images */}
            {additionalImages.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                <div 
                  className={`w-16 h-16 border rounded cursor-pointer ${selectedImage === product.image ? 'border-black' : 'border-gray-200'}`}
                  onClick={() => setSelectedImage(product.image)}
                >
                  <div className="relative w-full h-full">
                    <Image 
                      src={product.image} 
                      alt={product.name} 
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                
                {additionalImages.map((img, idx) => (
                  <div 
                    key={idx}
                    className={`w-16 h-16 border rounded cursor-pointer ${selectedImage === img ? 'border-black' : 'border-gray-200'}`}
                    onClick={() => setSelectedImage(img)}
                  >
                    <div className="relative w-full h-full">
                      <Image 
                        src={img} 
                        alt={`${product.name} - ${idx + 1}`} 
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Product Info */}
          <div className="p-6 flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">{product.name}</h2>
                {product.brandName && (
                  <p className="text-gray-600 mb-2">by {product.brandName}</p>
                )}
              </div>
              <button 
                onClick={handleToggleWishlist}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <Heart 
                  className={`h-6 w-6 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} 
                />
              </button>
            </div>
            
            <div className="my-4">
              {product.discount ? (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">${finalPrice.toFixed(2)}</span>
                  <span className="text-gray-500 line-through">${product.price.toFixed(2)}</span>
                  <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-semibold">
                    {product.discount}% OFF
                  </span>
                </div>
              ) : (
                <span className="text-2xl font-bold">${product.price.toFixed(2)}</span>
              )}
            </div>
            
            <div className="mb-4">
              <p className="text-gray-700 line-clamp-4">
                {product.description || "No description available for this product."}
              </p>
            </div>
            
            {/* Size Selector - Only for products with sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-4">
                <span className="block text-sm font-medium text-gray-700 mb-2">Size:</span>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((sizeOption) => (
                    <button 
                      key={sizeOption.size}
                      onClick={() => setSelectedSize(sizeOption.size)}
                      className={`px-4 py-2 border rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                        selectedSize === sizeOption.size 
                          ? 'bg-blue-500 text-white border-blue-500' 
                          : 'bg-white text-gray-700 border-gray-300'
                      } ${!sizeOption.inStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={!sizeOption.inStock}
                    >
                      {sizeOption.size}
                      {!sizeOption.inStock && (
                        <span className="text-red-500 text-xs font-semibold">(Out of stock)</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Quantity Selector */}
            <div className="flex items-center mb-6">
              <span className="mr-4 font-medium">Quantity:</span>
              <div className="flex items-center border rounded">
                <button 
                  className="px-3 py-1 border-r"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 py-1 text-center min-w-[40px]">{quantity}</span>
                <button 
                  className="px-3 py-1 border-l"
                  onClick={() => setQuantity(Math.min((product.stock || 10), quantity + 1))}
                  disabled={quantity >= (product.stock || 10)}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {product.stock !== undefined && (
                <span className="ml-4 text-sm text-gray-500">{product.stock} in stock</span>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-auto">
              <Button 
                className="flex-1"
                onClick={handleAddToCart}
                disabled={!product.stock || product.stock <= 0}
              >
                Add to Cart
              </Button>
              <Link href={`/product/${product.slug}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  View Details
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        <button 
          className="absolute top-4 right-4 p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition"
          onClick={(e) => {
            e.stopPropagation();
            const closeButton = document.querySelector('[role="dialog"]')?.querySelector('button[data-state]') as HTMLButtonElement;
            closeButton?.click();
          }}
        >
          <X className="h-4 w-4" />
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default QuickView;