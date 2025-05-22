"use client"
import { Button } from '../ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Star, ShoppingCart, AlertCircle, Tag, BadgeCheck, TruckIcon, CreditCard } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';

interface Size {
  size: string;
  price: number;
  qty: number;
}

interface FeaturedProduct {
  reviews: number;
  id: string;
  name: string;
  price: number;
  image: string;
  slug: string;
  rating?: number;
  discount?: number;
  originalPrice?: number;
  description?: string;
  sizes?: Size[];
  color?: string;
  colorName?: string;
  gallery?: string[];
}

interface HeroProps {
  featuredProducts: FeaturedProduct[];
}

export default function Hero({ featuredProducts = [] }: HeroProps) {
  // Move all hooks to the top, before any conditional returns
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [autoPlay, setAutoPlay] = useState(true);
  const [isClient, setIsClient] = useState(false);
  
  // Progress bar ref
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  // Set isClient to true on component mount to avoid hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Create memoized navigation functions
  const nextProduct = useCallback(() => {
    if (featuredProducts.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % featuredProducts.length);
  }, [featuredProducts.length]);

  const prevProduct = useCallback(() => {
    if (featuredProducts.length <= 1) return;
    setCurrentIndex((prev) => 
      prev === 0 ? featuredProducts.length - 1 : prev - 1
    );
  }, [featuredProducts.length]);
  
  // Auto-slide functionality
  useEffect(() => {
    if (!isClient) return; // Don't run on server
    
    let interval: NodeJS.Timeout;
    let animationFrame: number;
    
    if (autoPlay && featuredProducts.length > 1) {
      // Start time for animation
      const startTime = Date.now();
      const duration = 3000; // 3 seconds
      
      // Animate progress bar with requestAnimationFrame instead of CSS animation
      const animateProgress = () => {
        if (!progressBarRef.current) return;
        
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration * 100, 100);
        
        progressBarRef.current.style.width = `${progress}%`;
        
        if (elapsed < duration) {
          animationFrame = requestAnimationFrame(animateProgress);
        }
      };
      
      // Start animation
      animationFrame = requestAnimationFrame(animateProgress);
      
      // Set interval for slide change
      interval = setInterval(() => {
        nextProduct();
        // Reset animation
        if (progressBarRef.current) {
          progressBarRef.current.style.width = '0%';
        }
        requestAnimationFrame(animateProgress);
      }, duration);
    }
    
    return () => {
      if (interval) clearInterval(interval);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [autoPlay, nextProduct, featuredProducts.length, isClient]);
  
  // Reset selected size when product changes
  useEffect(() => {
    // Safety check for currentProduct
    if (!featuredProducts || featuredProducts.length === 0) return;
    
    const safeIndex = Math.min(currentIndex, featuredProducts.length - 1);
    const currentProduct = featuredProducts[safeIndex];
    
    if (currentProduct.sizes && Array.isArray(currentProduct.sizes) && currentProduct.sizes.length > 0) {
      setSelectedSize(currentProduct.sizes[0].size);
    } else {
      setSelectedSize(null);
    }
  }, [currentIndex, featuredProducts]);
  
  // Safety check - if no products, don't render (move after all hooks)
  if (!featuredProducts || featuredProducts.length === 0) {
    return null;
  }
  
  // Ensure currentIndex is valid
  const safeIndex = Math.min(currentIndex, featuredProducts.length - 1);
  const currentProduct = featuredProducts[safeIndex];

  // Final safety check - if no current product, don't render
  if (!currentProduct) return null;
  
  // Pause autoplay on hover
  const pauseAutoPlay = () => setAutoPlay(false);
  const resumeAutoPlay = () => setAutoPlay(true);

  // Get price based on selected size with safety checks
  const getPrice = () => {
    if (!currentProduct) return 0;
    
    if (selectedSize && currentProduct.sizes && Array.isArray(currentProduct.sizes)) {
      const sizeData = currentProduct.sizes.find(s => s.size === selectedSize);
      return sizeData?.price || currentProduct.price;
    }
    return currentProduct.price;
  };

  const currentPrice = getPrice();

  // Get the correct product URL with style parameter
  const getProductUrl = () => {
    return `/product/${currentProduct.slug}?style=0`;
  };

  // Calculate discount percentage if not provided directly
  const getDiscountPercentage = () => {
    if (currentProduct.discount) return currentProduct.discount;
    
    if (currentProduct.originalPrice && currentProduct.price && currentProduct.originalPrice > currentProduct.price) {
      const discount = ((currentProduct.originalPrice - currentPrice) / currentProduct.originalPrice) * 100;
      return Math.round(discount);
    }
    return 0;
  };
  
  const discountPercentage = getDiscountPercentage();
  
  // Calculate stock status
  const stockQty = selectedSize && currentProduct.sizes ? 
    currentProduct.sizes.find(s => s.size === selectedSize)?.qty || 0 : 0;
  const lowStock = stockQty > 0 && stockQty <= 5;

  // Calculate discount savings amount
  const savingsAmount = currentProduct.originalPrice ? 
    (currentProduct.originalPrice - currentPrice).toFixed(2) : 0;

  return (
    <div className="relative h-auto min-h-[100vh] lg:h-[90vh] overflow-hidden bg-white" onMouseEnter={pauseAutoPlay} onMouseLeave={resumeAutoPlay}>
      {/* Light background with subtle patterns */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 opacity-5 bg-[url('/pattern-dots.svg')] bg-repeat"></div>
        
        {/* Animated floating circles */}
        <div className="floating-circle absolute top-[10%] right-[15%] w-24 h-24 rounded-full bg-gradient-to-r from-gray-100 to-gray-50 opacity-70"></div>
        <div className="floating-circle-delay absolute bottom-[20%] left-[10%] w-32 h-32 rounded-full bg-gradient-to-r from-gray-50 to-gray-100 opacity-50"></div>
        <div className="floating-circle-slow absolute top-[30%] left-[25%] w-16 h-16 rounded-full bg-gradient-to-r from-gray-100 to-gray-50 opacity-60"></div>
        
        {/* Animated gradient lines */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-line"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-line-reverse"></div>
      </div>
      
      {/* Container layout with improved spacing */}
      <div className="relative z-10 h-full container mx-auto px-4 flex flex-col lg:flex-row items-center justify-between py-12 lg:py-6 gap-8">
        {/* Mobile Product Image */}
        <div className="w-full lg:hidden order-1 relative">
          <div className="h-[350px] w-full relative">
            {isClient && featuredProducts.map((product, index) => (
              <Link href={`/product/${product.slug}?style=0`} key={product.id}>
                <div 
                  className={`absolute inset-0 transition-all duration-700 ease-in-out
                    ${index === currentIndex ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-95'}`}
                >
                  <div className="relative w-full h-full group cursor-pointer">
                    {/* Product image container with modern shadow */}
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className="absolute inset-0 rounded-2xl bg-white shadow-xl opacity-80"></div>
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-100/50 to-gray-50/50"></div>
                      
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-contain p-5 drop-shadow-xl transform transition-all duration-700 group-hover:scale-105"
                        priority={index === currentIndex}
                      />
                      
                      {/* Animated discount badge */}
                      {(product.discount || 0) > 0 && (
                        <div className="pulse-badge absolute top-2 left-2 bg-gradient-to-r from-gray-800 to-[#2B2B2B] text-white w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg z-10 shadow-lg">
                          -{product.discount}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          {/* Add side arrows for better mobile interaction */}
          <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-between px-2 z-20 pointer-events-none">
            <Button 
              size="icon" 
              variant="outline"
              className="rounded-full border-gray-300 bg-white/95 shadow-md text-[#2B2B2B] h-10 w-10 pointer-events-auto"
              onClick={prevProduct}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button 
              size="icon"
              variant="outline" 
              className="rounded-full border-gray-300 bg-white/95 shadow-md text-[#2B2B2B] h-10 w-10 pointer-events-auto"
              onClick={nextProduct}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Mobile slider controls with improved styling */}
          <div className="flex justify-center items-center gap-4 mt-6">
            <Button 
              size="icon" 
              className="h-9 w-9 rounded-full bg-white text-[#2B2B2B] border border-gray-300 hover:border-gray-400 hover:bg-gray-50 shadow-sm"
              onClick={prevProduct}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            {/* Navigation dots */}
            <div className="flex gap-2 items-center">
              {featuredProducts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`transition-all duration-300 rounded-full
                    ${index === currentIndex 
                      ? 'bg-[#2B2B2B] w-8 h-2' 
                      : 'bg-gray-300 w-2 h-2 hover:bg-gray-400'}`}
                  aria-label={`Go to product ${index + 1}`}
                />
              ))}
            </div>
            
            <Button 
              size="icon"
              className="h-9 w-9 rounded-full bg-white text-[#2B2B2B] border border-gray-300 hover:border-gray-400 hover:bg-gray-50 shadow-sm"
              onClick={nextProduct}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Left Content Panel with light styling */}
        <div className="max-w-xl flex flex-col justify-center order-2 lg:order-1 w-full lg:w-[45%]">
          {/* Brand heading with subtle animations */}
          <div className="slide-in-left mb-8 lg:mb-10">
            <span className="px-3 py-1 text-xs font-semibold tracking-wider uppercase bg-gray-100 text-[#2B2B2B] rounded-full">Premium Collection</span>
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold text-[#2B2B2B] leading-tight">
              Elevate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-700">Style</span> With Vibecart
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Discover this season's most stylish and comfortable footwear collection
            </p>
            {/* Added Navigation Links */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/bestsellers">
                <Button variant="outline" className="border-gray-300 text-[#2B2B2B] hover:bg-gray-50">
                  Best Sellers
                </Button>
              </Link>
              <Link href="/new-arrivals">
                <Button variant="outline" className="border-gray-300 text-[#2B2B2B] hover:bg-gray-50">
                  New Arrivals
                </Button>
              </Link>
              <Link href="/shop">
                <Button className="bg-[#2B2B2B] hover:bg-gray-800 text-white">
                  Shop All
                </Button>
              </Link>
            </div>
          </div>

          {/* Product Card with light clean design */}
          <div className="fade-in bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden transform-gpu">
            {/* Card Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
              <div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-[#2B2B2B] mr-2 animate-pulse"></div>
                  <h5 className="text-[#2B2B2B] font-medium text-sm">FEATURED PRODUCT</h5>
                </div>
                <h1 className="text-xl font-bold text-gray-900 mt-1">{currentProduct.name}</h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full mr-2">
                  {currentIndex + 1}/{featuredProducts.length}
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-7 w-7 p-0 rounded-full border-gray-300 bg-white hover:bg-gray-50 text-[#2B2B2B]"
                    onClick={prevProduct}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline" 
                    className="h-7 w-7 p-0 rounded-full border-gray-300 bg-white hover:bg-gray-50 text-[#2B2B2B]"
                    onClick={nextProduct}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Product Content */}
            <div className="p-6">
              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < (currentProduct.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} />
                ))}
                <span className="text-gray-600 text-sm ml-2">
                  {currentProduct.reviews || 0} Reviews
                </span>
              </div>
              
              {/* Price section with improved layout */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1">
                  <p className="text-2xl font-bold text-gray-900">₹{currentPrice.toFixed(2)}</p>
                  {discountPercentage > 0 && currentProduct.originalPrice && (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-gray-500 line-through">₹{currentProduct.originalPrice.toFixed(2)}</p>
                      <span className="text-sm font-medium text-green-600">Save ₹{savingsAmount}</span>
                    </div>
                  )}
                </div>
                
                {discountPercentage > 0 && (
                  <div className="flex-shrink-0 px-3 py-1 bg-gray-100 text-[#2B2B2B] text-sm font-semibold rounded-full border border-gray-200">
                    {discountPercentage}% OFF
                  </div>
                )}
              </div>
              
              {/* Size selection with modern buttons */}
              {currentProduct.sizes && Array.isArray(currentProduct.sizes) && currentProduct.sizes.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-gray-900">Select Size</p>
                    <button className="text-xs text-[#2B2B2B] hover:text-gray-700">Size Guide</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentProduct.sizes.map((size) => (
                      <button
                        key={size.size}
                        onClick={() => setSelectedSize(size.size)}
                        className={`h-10 min-w-[40px] px-3 rounded-lg transition-all duration-200 text-sm
                          ${selectedSize === size.size 
                            ? 'bg-[#2B2B2B] text-white shadow-md ring-2 ring-gray-200' 
                            : 'bg-white text-gray-800 border border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}
                      >
                        {size.size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Product badges with modern design */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="flex items-center gap-1 text-sm bg-gray-100 text-[#2B2B2B] px-3 py-1 rounded-full">
                  <BadgeCheck className="h-4 w-4" />
                  <span>Authentic</span>
                </span>
                
                <span className="flex items-center gap-1 text-sm bg-gray-100 text-[#2B2B2B] px-3 py-1 rounded-full">
                  <TruckIcon className="h-4 w-4" />
                  <span>Free Shipping</span>
                </span>
                
                {lowStock && (
                  <span className="flex items-center gap-1 text-sm bg-gray-100 text-[#2B2B2B] px-3 py-1 rounded-full">
                    <AlertCircle className="h-4 w-4" />
                    <span>Only {stockQty} Left</span>
                  </span>
                )}
              </div>
              
              {/* Action buttons with dark design for #2B2B2B */}
              <div className="flex gap-3 mt-4">
                <Link href={getProductUrl()} className="flex-1">
                  <Button variant="outline" className="w-full border-gray-300 text-[#2B2B2B] hover:bg-gray-50">
                    View Details
                  </Button>
                </Link>
                <Button className="flex-1 bg-[#2B2B2B] hover:bg-gray-800 text-white shadow-md hover:shadow-lg transition-all duration-200">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Product Showcase with floating effect */}
        <div className="hidden lg:block relative order-2 w-[55%] h-[500px]">
          {/* Product images with 3D effect */}
          <div className="float-animation absolute right-0 w-[450px] h-[450px]">
            {isClient && featuredProducts.map((product, index) => (
              <Link href={`/product/${product.slug}?style=0`} key={product.id}>
                <div 
                  className={`absolute inset-0 transition-all duration-1000 ease-in-out
                    ${index === currentIndex ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-95 rotate-3'}`}
                >
                  <div className="relative w-full h-full group cursor-pointer">
                    {/* Product spotlight */}
                    <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-gray-100/50 via-white/30 to-gray-100/50 blur-xl"></div>
                    
                    {/* Product platform */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gray-900/10 blur-md rounded-full"></div>
                    
                    {/* Product image */}
                    <div className="relative h-full">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-contain drop-shadow-2xl transform transition-transform duration-700 group-hover:scale-105 group-hover:rotate-1"
                        priority={index === currentIndex}
                      />
                      
                      {/* Discount badge */}
                      {(product.discount || 0) > 0 && (
                        <div className="pulse-badge absolute top-6 left-6 bg-gradient-to-r from-gray-800 to-[#2B2B2B] text-white w-20 h-20 rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                          -{product.discount}%
                        </div>
                      )}
                      
                      {/* Color badge */}
                      {product.colorName && (
                        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-5 py-2 rounded-full text-gray-800 text-sm shadow-md border border-gray-200">
                          {product.colorName}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          {/* Navigation circles */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-3 py-4" >
            {featuredProducts.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300
                  ${index === currentIndex 
                    ? 'bg-[#2B2B2B] w-10 h-3' 
                    : 'bg-gray-300 w-3 h-3 hover:bg-gray-400'}`}
                aria-label={`Go to product ${index + 1}`}
              />
            ))}
          </div>
          
          {/* Side navigation controls */}
          <div className="absolute top-1/2 transform -translate-y-1/2 z-20 -left-6 flex flex-col gap-3">
            <Button 
              size="icon" 
              variant="outline"
              className="rounded-full border-gray-300 bg-white/95 backdrop-blur-sm shadow-md text-[#2B2B2B] hover:bg-gray-50 h-12 w-12 transition-all duration-200 hover:scale-110"
              onClick={prevProduct}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button 
              size="icon"
              variant="outline" 
              className="rounded-full border-gray-300 bg-white/95 backdrop-blur-sm shadow-md text-[#2B2B2B] hover:bg-gray-50 h-12 w-12 transition-all duration-200 hover:scale-110"
              onClick={nextProduct}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
        <div 
          ref={progressBarRef}
          className="h-full bg-[#2B2B2B] transition-all duration-300 ease-linear w-0"
        />
      </div>
      
      {/* Custom animations */}
      <style jsx>{`
        /* Floating animation */
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        
        .float-animation {
          animation: float 6s ease-in-out infinite;
        }
        
        /* Floating circles */
        @keyframes floatCircle {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(10px, 10px); }
          50% { transform: translate(0, 20px); }
          75% { transform: translate(-10px, 10px); }
        }
        
        .floating-circle {
          animation: floatCircle 12s ease-in-out infinite;
        }
        
        .floating-circle-delay {
          animation: floatCircle 16s ease-in-out infinite 2s;
        }
        
        .floating-circle-slow {
          animation: floatCircle 20s ease-in-out infinite 1s;
        }
        
        /* Pulse animation */
        @keyframes pulseBadge {
          0%, 100% { transform: scale(1); box-shadow: 0 5px 15px rgba(43, 43, 43, 0.2); }
          50% { transform: scale(1.05); box-shadow: 0 5px 25px rgba(43, 43, 43, 0.4); }
        }
        
        .pulse-badge {
          animation: pulseBadge 2s ease-in-out infinite;
        }
        
        /* Slide in animation */
        @keyframes slideInLeft {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        .slide-in-left {
          animation: slideInLeft 0.8s ease-out forwards;
        }
        
        /* Fade in animation */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .fade-in {
          animation: fadeIn 1s ease-out forwards;
          animation-delay: 0.3s;
          opacity: 0;
        }
        
        /* Gradient line animation */
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .bg-gradient-line {
          background: linear-gradient(90deg, transparent, rgba(43, 43, 43, 0.1), transparent);
          background-size: 200% 200%;
          animation: gradientMove 8s linear infinite;
        }
        
        .bg-gradient-line-reverse {
          background: linear-gradient(90deg, transparent, rgba(43, 43, 43, 0.1), transparent);
          background-size: 200% 200%;
          animation: gradientMove 8s linear infinite reverse;
        }
      `}</style>
    </div>
  );
}
