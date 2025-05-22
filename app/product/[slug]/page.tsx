"use client";

import ReactMarkdown from "react-markdown";
import { useSession } from "next-auth/react";
import { Heart, Truck, ShieldCheck, RefreshCcw, ArrowRight, CheckCircle2, Package, Info, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useEffect, useState, useCallback, useRef } from "react";
import ImageThumbnail from "@/components/shared/ImageThumbnail";
import ThumbnailScroller from "@/components/shared/ThumbnailScroller";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  getRelatedProductsBySubCategoryIds,
  getSingleProduct,
} from "@/lib/database/actions/product.actions";
import Link from "next/link";
import ProductCard from "@/components/shared/ProductCard";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import IdInvalidError from "@/components/shared/IdInvalidError";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProductCardGrid from "@/components/shared/ProductCardGrid";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

// --- Skeleton Component ---
const ProductPageSkeleton = () => (
  <div className="w-full md:py-10 lg:py-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Left Column: Image Skeleton */}
        <div className="flex flex-col-reverse lg:flex-row gap-4 lg:gap-6 flex-1 lg:flex-[1.2]">
          <div className="flex lg:flex-col gap-2 lg:w-20 flex-shrink-0">
            <Skeleton className="aspect-square w-16 lg:w-full rounded-md" />
            <Skeleton className="aspect-square w-16 lg:w-full rounded-md" />
            <Skeleton className="aspect-square w-16 lg:w-full rounded-md" />
            <Skeleton className="aspect-square w-16 lg:w-full rounded-md" />
          </div>
          <div className="relative flex-grow aspect-square">
            <Skeleton className="w-full h-full rounded-lg" />
          </div>
        </div>
        {/* Right Column: Details Skeleton */}
        <div className="flex-1 py-3 lg:pt-0 space-y-4">
          <Skeleton className="h-8 w-3/4 rounded" /> {/* Product Name */}
          <Skeleton className="h-6 w-1/4 rounded" /> {/* Category */}
          <div className="space-y-1 pt-2">
            <Skeleton className="h-7 w-1/3 rounded" /> {/* Price */}
            <Skeleton className="h-5 w-1/2 rounded" /> {/* Tax Info */}
          </div>
          {/* Size Skeleton */}
          <div className="space-y-2 pt-4">
            <Skeleton className="h-6 w-1/4 rounded" /> {/* Select Size Label */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          </div>
          {/* Button Skeleton */}
          <div className="flex flex-col gap-3 pt-4">
            <Skeleton className="h-12 w-full rounded-full" /> {/* Add to Cart Button */}
            <Skeleton className="h-12 w-full rounded-full" /> {/* Wishlist Button */}
          </div>
          {/* Details Skeleton */}
          <div className="space-y-2 pt-4">
            <Skeleton className="h-6 w-1/3 rounded" /> {/* Details Label */}
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// --- Main Component ---
const ProductPage = () => {
  const { data: session } = useSession();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addItem } = useCart();

  // --- State ---
  const [selectedSizeIndex, setSelectedSizeIndex] = useState<number | undefined>(undefined);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [showError, setShowError] = useState(false);
  const [productData, setProductData] = useState<any>(null);
  const [relatedProductsData, setRelatedProductsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [initialWishlistFetched, setInitialWishlistFetched] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false); // Added missing state

  // Zoom feature states
  const [isZooming, setIsZooming] = useState(false);
  const [lensPosition, setLensPosition] = useState({ top: 0, left: 0 }); // New state for lens position
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const zoomPaneRef = useRef<HTMLDivElement>(null);

  const ZOOM_FACTOR = 2.5;
  const LENS_SIZE = 120; // Adjusted lens size

  const slug = params.slug as string;

  // --- Derived State (moved up for useEffect dependencies) ---
  const p = productData; // Assuming productData is populated before this component section renders meaningfully for zoom
  const currentImages = p ? (p.subProducts?.[0]?.images || []).map((img: any) =>
    (typeof img === 'string' ? img : img?.url) || '/placeholder.png'
  ).filter(Boolean) : [];

  const selectedImageUrl = currentImages[selectedImageIndex] || '/placeholder.png';

  // --- Data Fetching ---
  const fetchProductData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const urlSizeParam = searchParams.get("size");
      let effectiveInitialSizeIndex = 0; // Default to 0, assuming 0 is a valid default index
      if (urlSizeParam) { // Check if param exists and is not empty
        const parsedIndex = parseInt(urlSizeParam, 10);
        if (!isNaN(parsedIndex) && parsedIndex >= 0) {
          effectiveInitialSizeIndex = parsedIndex;
        } else {
          // Optional: Log that the size param was invalid and a default is being used.
          console.warn(`Invalid 'size' parameter in URL: '${urlSizeParam}'. Defaulting to index 0.`);
        }
      }
      const productResult = await getSingleProduct(slug, effectiveInitialSizeIndex);

      if (!productResult || !productResult.success) {
        console.error("Product not found or error fetching. productResult:", JSON.stringify(productResult, null, 2));
        setProductData(null);
        setRelatedProductsData([]);
        setFetchError("Product not found or failed to load.");
        setIsLoading(false);
        return;
      }

      setProductData(productResult);
      if ('name' in productResult && productResult.name) {
        document.title = `Buy ${productResult.name} | VibeCart`;
      }

      if (urlSizeParam !== null) {
        const urlSizeIndex = Number(urlSizeParam);
        if (
          "sizes" in productResult &&
          Array.isArray(productResult.sizes) &&
          urlSizeIndex >= 0 &&
          urlSizeIndex < productResult.sizes.length
        ) {
          const sizeData = ('subProducts' in productResult && Array.isArray(productResult.subProducts))
            ? productResult.subProducts[0]?.sizes?.[urlSizeIndex]
            : undefined;
          if (sizeData && sizeData.qty > 0) {
            setSelectedSizeIndex(urlSizeIndex);
          } else {
            setSelectedSizeIndex(undefined);
            const currentParams = new URLSearchParams(searchParams.toString());
            currentParams.delete("size");
            router.replace(`/product/${slug}?${currentParams.toString()}`, { scroll: false });
          }
        } else {
          setSelectedSizeIndex(undefined);
        }
      } else {
        setSelectedSizeIndex(undefined);
      }

      const subCategoryIds = (productResult as { subCategories?: any[] }).subCategories?.map((i: any) => i._id) || [];
      if (subCategoryIds.length > 0) {
        console.log("Fetching related products for categories:", subCategoryIds);
        const relatedResult = await getRelatedProductsBySubCategoryIds(subCategoryIds);
        console.log("Related Result:", relatedResult);

        const transformed = relatedResult?.products
          ?.filter((p: any) => p.slug !== slug)
          .map((p: any) => {
            const imageUrl = p.subProducts?.[0]?.images?.[0]?.url || "/placeholder.png";
            const price = p.subProducts?.[0]?.sizes?.[0]?.price ?? p.subProducts?.[0]?.price ?? 0;
            const originalPrice = p.subProducts?.[0]?.sizes?.[0]?.originalPrice ?? p.subProducts?.[0]?.originalPrice;

            return {
              id: p._id,
              name: p.name,
              image: imageUrl,
              price: price,
              originalPrice: originalPrice,
              slug: p.slug,
              discount: p.subProducts?.[0]?.discount,
            };
          }) || [];
        setRelatedProductsData(transformed);
        console.log("Transformed Related Products:", transformed);
      } else {
        setRelatedProductsData([]);
        console.log("No subcategories found for related products.");
      }
    } catch (error: any) {
      console.error("Error fetching product page data:", error);
      setProductData(null);
      setRelatedProductsData([]);
      setFetchError(error.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [slug, searchParams, router]);

  const fetchWishlistStatus = useCallback(async () => {
    if (!session?.user?.id || !productData?._id || initialWishlistFetched) {
      return;
    }
    console.log("Fetching initial wishlist status for product:", productData._id);
    try {
      const response = await fetch(`/api/wishlist`);
      if (!response.ok) {
        throw new Error("Failed to fetch wishlist");
      }
      const data = await response.json();
      console.log("Fetched wishlist data:", data);
      if (data.success && Array.isArray(data.wishlist)) {
        const found = data.wishlist.some((item: any) => item.product === productData._id);
        console.log("Is product in wishlist?", found);
        setIsInWishlist(found);
      } else {
        console.warn("Wishlist fetch response was not successful or data format unexpected:", data);
        setIsInWishlist(false);
      }
    } catch (error) {
      console.error("Error fetching initial wishlist status:", error);
    } finally {
      setInitialWishlistFetched(true);
    }
  }, [session?.user?.id, productData?._id, initialWishlistFetched]);

  // --- Effects ---
  useEffect(() => {
    if (slug) {
      fetchProductData();
    }
  }, [slug, fetchProductData]);

  useEffect(() => {
    if (productData?._id && session?.user?.id && !initialWishlistFetched) {
      fetchWishlistStatus();
    }
  }, [productData, session, initialWishlistFetched, fetchWishlistStatus]);
  // Mobile thumbnail scrolling is now handled by the ThumbnailScroller component

  // Effect to update zoom pane if selected image changes while zooming
  useEffect(() => {
    if (isZooming && zoomPaneRef.current && imageContainerRef.current && selectedImageUrl && selectedImageUrl !== '/placeholder.png') {
      const containerWidth = imageContainerRef.current.offsetWidth;
      const containerHeight = imageContainerRef.current.offsetHeight;
      if (containerWidth > 0 && containerHeight > 0) {
        zoomPaneRef.current.style.backgroundImage = `url(${selectedImageUrl})`;
        zoomPaneRef.current.style.backgroundSize = `${containerWidth * ZOOM_FACTOR}px ${containerHeight * ZOOM_FACTOR}px`;
      } else {
        setIsZooming(false); // Stop zoom if container size is invalid
      }
    }
  }, [isZooming, selectedImageUrl, ZOOM_FACTOR]);

  // --- Handlers ---
  const handleSizeSelect = (index: number) => {
    console.log("Size selected:", index);
    setSelectedSizeIndex(index);
    setShowError(false);
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set("size", index.toString());
    router.replace(`/product/${slug}?${currentParams.toString()}`, { scroll: false });
  };

  const handleAddToCart = () => {
    console.log("Add to cart clicked. Selected size index:", selectedSizeIndex);
    if (selectedSizeIndex === undefined) {
      setShowError(true);
      document.getElementById("sizeGrid")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (!productData || !productData.subProducts?.[0]?.sizes?.[selectedSizeIndex] || !productData.sizes?.[selectedSizeIndex]) {
      console.error("Cannot add to cart: Critical product data or size data missing.", { productData, selectedSizeIndex });
      toast.error("Could not add item to cart. Product data missing.");
      return;
    }

    const selectedSubProduct = productData.subProducts[0];
    const selectedSizeData = selectedSubProduct.sizes[selectedSizeIndex];
    const selectedSizeInfo = productData.sizes[selectedSizeIndex];

    // Check stock before adding to cart
    if (selectedSizeData.qty === undefined || selectedSizeData.qty <= 0) {
      toast.error(`Sorry, "${productData.name}" (Size: ${selectedSizeInfo.size}) is out of stock.`);
      return;
    }

    const subProductDiscount = selectedSubProduct.discount || 0;
    const sizeOriginalPrice = selectedSizeData.originalPrice || selectedSizeData.price || 0;
    const sizeFinalPrice = subProductDiscount > 0
      ? sizeOriginalPrice - (sizeOriginalPrice * subProductDiscount / 100)
      : sizeOriginalPrice;

    const itemToAdd = {
      _id: productData._id,
      _uid: `${productData._id}_${selectedSizeIndex}`,
      name: productData.name,
      image: (selectedSubProduct.images?.[0] ? (typeof selectedSubProduct.images[0] === 'string' ? selectedSubProduct.images[0] : selectedSubProduct.images[0].url) : undefined) || "/placeholder.png",
      price: sizeFinalPrice,
      size: selectedSizeInfo.size,
      slug: productData.slug,
      quantity: 1,
      qty: 1,
      originalPrice: sizeOriginalPrice,
      discount: subProductDiscount,
      availableQty: selectedSizeData.qty || 0,
    };

    console.log("Adding item to cart:", itemToAdd);
    try {
      addItem(itemToAdd);
    } catch (error) {
      console.error("Error calling addItem from cart context:", error);
      toast.error("Failed to add item to cart.");
    }
  };

  const handleWishlistToggle = async () => {
    if (!session?.user?.id) {
      toast.error("Please log in to manage your wishlist.");
      return;
    }

    // Log a serializable version of productData for easier inspection
    try {
      console.log("Product data at wishlist toggle (before check):", productData ? JSON.parse(JSON.stringify(productData)) : null);
    } catch (e) {
      console.log("Product data at wishlist toggle (raw, stringify failed):", productData);
    }
    
    const currentProductId = productData?._id;

    // More robust check for productId
    if (!currentProductId || typeof currentProductId !== 'string' || currentProductId.trim() === '') {
      toast.error("Product data not available or Product ID is invalid.");
      console.error("Attempted to toggle wishlist with invalid productId value:", currentProductId, "Full productData object:", productData);
      return;
    }

    setIsWishlistLoading(true);
    const finalProductId = currentProductId.trim(); // Use trimmed product ID
    const method = isInWishlist ? "DELETE" : "POST";
    const url = isInWishlist ? `/api/wishlist?productId=${finalProductId}` : "/api/wishlist";

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include', // Add credentials to include cookies in the request
        ...(method === "POST" && { body: JSON.stringify({ productId: finalProductId }) }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || `Failed to ${isInWishlist ? 'remove from' : 'add to'} wishlist`);
      }

      setIsInWishlist(!isInWishlist);
      toast.success(result.message || `Item ${isInWishlist ? 'removed from' : 'added to'} wishlist!`);

    } catch (error: any) {
      console.error("Error toggling wishlist:", error);
      toast.error(error.message || "Could not update wishlist.");
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current || !zoomPaneRef.current || !isZooming) return;

    const imgContainerRect = imageContainerRef.current.getBoundingClientRect();
    
    // Calculate mouse position relative to the image container
    let cursorX = e.clientX - imgContainerRect.left;
    let cursorY = e.clientY - imgContainerRect.top;

    // Calculate intended top-left position of the lens
    let newLensLeft = cursorX - LENS_SIZE / 2;
    let newLensTop = cursorY - LENS_SIZE / 2;

    // Clamp lens position to stay within the image boundaries
    newLensLeft = Math.max(0, Math.min(newLensLeft, imgContainerRect.width - LENS_SIZE));
    newLensTop = Math.max(0, Math.min(newLensTop, imgContainerRect.height - LENS_SIZE));
    
    setLensPosition({ top: newLensTop, left: newLensLeft });

    // Calculate the center of the lens relative to the image container (for background positioning)
    const centerOfLensX = newLensLeft + LENS_SIZE / 2;
    const centerOfLensY = newLensTop + LENS_SIZE / 2;

    // Calculate background position for zoom pane
    const bgPosX = -(centerOfLensX * ZOOM_FACTOR - zoomPaneRef.current.offsetWidth / 2);
    const bgPosY = -(centerOfLensY * ZOOM_FACTOR - zoomPaneRef.current.offsetHeight / 2);

    zoomPaneRef.current.style.backgroundPosition = `${bgPosX}px ${bgPosY}px`;
  }, [isZooming, ZOOM_FACTOR, LENS_SIZE]);

  const handleMouseEnter = useCallback(() => {
    if (imageContainerRef.current && selectedImageUrl && selectedImageUrl !== '/placeholder.png') {
      const containerWidth = imageContainerRef.current.offsetWidth;
      const containerHeight = imageContainerRef.current.offsetHeight;

      if (containerWidth > 0 && containerHeight > 0) {
        setIsZooming(true);
        if (zoomPaneRef.current) {
          zoomPaneRef.current.style.backgroundImage = `url(${selectedImageUrl})`;
          zoomPaneRef.current.style.backgroundSize = `${containerWidth * ZOOM_FACTOR}px ${containerHeight * ZOOM_FACTOR}px`;
        }
      } else {
        setIsZooming(false); 
      }
    } else {
      setIsZooming(false);
    }
  }, [selectedImageUrl, ZOOM_FACTOR]);

  const handleMouseLeave = useCallback(() => {
    setIsZooming(false);
  }, []);

  // --- Render Logic ---
  if (isLoading) {
    return <ProductPageSkeleton />;
  }

  if (fetchError || !productData) {
    return <IdInvalidError message={fetchError || "Product could not be loaded."} />;
  }

  const subProductDiscount = p.discount || 0;
  let displayPrice: number | undefined;
  let displayOriginalPrice: number | undefined;

  const selectedSizeData = selectedSizeIndex !== undefined ? p.subProducts?.[0]?.sizes?.[selectedSizeIndex] : undefined;

  if (selectedSizeData) {
    // Determine the original price for display (strikethrough price)
    displayOriginalPrice = selectedSizeData.originalPrice ?? selectedSizeData.price ?? undefined;

    // For the actual calculation of the discounted price,
    // use displayOriginalPrice, but default to 0 if it's undefined to prevent arithmetic errors.
    const priceToCalculateFrom = displayOriginalPrice ?? 0;

    displayPrice = subProductDiscount > 0
      ? priceToCalculateFrom - (priceToCalculateFrom * subProductDiscount / 100)
      : displayOriginalPrice; // If no discount, displayPrice is the same as displayOriginalPrice (could be undefined)
  } else {
    // Logic for when no size is selected - product-level prices
    const productLevelPrice = parseFloat(p.price); // p.price might be a string
    displayPrice = !isNaN(productLevelPrice) ? productLevelPrice : undefined;
    displayOriginalPrice = typeof p.originalPrice === 'number' ? p.originalPrice : undefined;

    // Consistent discount application for product-level price if an original price exists
    if (typeof displayOriginalPrice === 'number' && subProductDiscount > 0) {
      const priceToCalculateFrom = displayOriginalPrice; // Known to be a number here
      displayPrice = priceToCalculateFrom - (priceToCalculateFrom * subProductDiscount / 100);
    } else if (typeof displayOriginalPrice !== 'number' && !isNaN(productLevelPrice) && subProductDiscount > 0) {
      // If no explicit original price, but there's a product price and a discount,
      // apply discount to the product price.
      const priceToCalculateFrom = productLevelPrice;
      displayPrice = priceToCalculateFrom - (priceToCalculateFrom * subProductDiscount / 100);
    }
    // If no discount or no valid prices, displayPrice remains as parsedPPrice or undefined.
    // displayOriginalPrice is set as p.originalPrice or the parsed product price.
  }
  const displayDiscount = subProductDiscount;

  const isSelectedSizeAvailable = selectedSizeIndex !== undefined && selectedSizeData && selectedSizeData.qty > 0;
  const isSelectedSizeChosen = selectedSizeIndex !== undefined;

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 7);
  const formattedDeliveryDate = deliveryDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const isNewProduct = p.createdAt && (new Date().getTime() - new Date(p.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000);  return (
    <div className="w-[90%] mx-auto bg-white">
      {isLoading ? <ProductPageSkeleton /> : (
        productData && Object.keys(productData).length > 0 && !fetchError ? (
          <>
            {ModernProductDisplay()}
            
            {/* Full Screen Long Description Section */}
            {productData.longDescription && (
              <div className="border-t border-b border-gray-200 py-8 my-8">
                <div className="w-[90%] mx-auto px-4 sm:px-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Product Description</h2>
                  </div>
                  
                  <div 
                    className="prose prose-sm md:prose-base lg:prose-lg max-w-none text-gray-700 pb-4"
                    dangerouslySetInnerHTML={{ __html: productData.longDescription }}
                  />
                  
                  {/* Details Table */}
                  {productData.details && productData.details.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Product Details</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Name</th>
                              <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productData.details.map((detail: any, index: number) => (
                              <tr key={detail._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="py-3 px-4 text-sm font-medium text-gray-900 border-t border-gray-200">{detail.name}</td>
                                <td className="py-3 px-4 text-sm text-gray-700 border-t border-gray-200">{detail.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Related Products Section */}
            {relatedProductsData && relatedProductsData.length > 0 ? (
              <div className="bg-gray-50 py-12 mt-6">
                <div className="w-[90%] mx-auto px-4 sm:px-6">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">You Might Also Like</h2>
                      <p className="text-gray-600">Based on your selection</p>
                    </div>
                    <Link href="/shop" className="flex items-center gap-1 font-medium text-gray-900 hover:text-gray-700">
                      Browse All
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                    {relatedProductsData.slice(0, 4).map((product: any) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <IdInvalidError message={fetchError || "Product not found"} />
        )
      )}
    </div>
  );

  function ModernProductDisplay() {
    const p = productData;
    if (!p) return null;

    // All calculations for display state
    const subProduct = p.subProducts?.[0];
    const subProductDiscount = subProduct?.discount || 0;
    const selectedSizeData = selectedSizeIndex !== undefined && subProduct?.sizes?.[selectedSizeIndex];
    const selectedSizeInfo = selectedSizeIndex !== undefined && p.sizes?.[selectedSizeIndex];
    const isSelectedSizeChosen = selectedSizeIndex !== undefined;
    const isSelectedSizeAvailable = selectedSizeData && selectedSizeData.qty > 0;
    
    const displayOriginalPrice = isSelectedSizeChosen && selectedSizeData
      ? (selectedSizeData.originalPrice || selectedSizeData.price || 0)
      : subProduct?.sizes?.[0]?.originalPrice || subProduct?.sizes?.[0]?.price || 0;
      
    const displayPrice = isSelectedSizeChosen && selectedSizeData
      ? (subProductDiscount > 0
        ? displayOriginalPrice - (displayOriginalPrice * subProductDiscount / 100)
        : displayOriginalPrice)
      : (subProductDiscount > 0 && typeof displayOriginalPrice === 'number'
        ? displayOriginalPrice - (displayOriginalPrice * subProductDiscount / 100)
        : displayOriginalPrice);
        
    const displayDiscount = subProductDiscount || 0;
    
    const currentImages = p ? (p.subProducts?.[0]?.images || []).map((img: any) =>
      (typeof img === 'string' ? img : img?.url) || '/placeholder.png'
    ).filter(Boolean) : [];
    
    const selectedImageUrl = currentImages[selectedImageIndex] || '/placeholder.png';
    
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    const formattedDeliveryDate = deliveryDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const isNewProduct = p.createdAt && (new Date().getTime() - new Date(p.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000);

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6">        
        {/* Elegant Breadcrumbs */}
        <div className="py-3 sm:py-4 md:py-6 text-xs sm:text-sm breadcrumbs overflow-x-auto whitespace-nowrap">
          <ol className="flex items-center space-x-1">
            <li><Link href="/" className="text-gray-500 hover:text-black transition-colors">Home</Link></li>
            <li className="text-gray-400">/</li>
            <li><Link href="/shop" className="text-gray-500 hover:text-black transition-colors">Shop</Link></li>
            <li className="text-gray-400">/</li>
            {p.category?.name && (
              <>
                <li>
                  <Link
                    href={`/category/${p.category._id}`}
                    className="text-gray-500 hover:text-black transition-colors"
                  >
                    {p.category.name}
                  </Link>
                </li>
                <li className="text-gray-400">/</li>
              </>
            )}
            <li><span className="text-gray-900 font-semibold truncate max-w-[150px] inline-block align-bottom">{p.name}</span></li>
          </ol>
        </div>
        
        {/* Product Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-10 pb-10 sm:pb-16">
          {/* Left Column: Product Images - 7 columns on large screens */}
          <div className="lg:col-span-7 order-1">
            <div className="sticky top-20 z-10">              {/* Layout with thumbnails on left, main image on right */}
              <div className="flex flex-col-reverse sm:flex-row gap-4 sm:gap-5 md:gap-6">
                {/* Nike-style Thumbnails Gallery - Horizontal on mobile, Vertical on desktop */}
                <ThumbnailScroller className="flex flex-row sm:flex-col gap-2.5 md:gap-3 order-2 sm:order-1 overflow-x-auto sm:overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 pb-2 sm:pb-0 sm:pr-1.5 max-w-full sm:w-20 md:w-24 lg:w-28">
                  {currentImages.map((imgSrc: string, index: number) => (
                    <div key={index} className="flex-shrink-0 min-w-[64px]">
                      <ImageThumbnail
                        src={imgSrc}
                        alt={`${p.name} thumbnail ${index + 1}`}
                        isSelected={selectedImageIndex === index}
                        onClick={() => setSelectedImageIndex(index)}
                      />
                    </div>
                  ))}
                </ThumbnailScroller>
                {/* Main Image - Larger on right */}
                <div 
                  ref={imageContainerRef}
                  className="w-full aspect-square sm:min-h-[400px] md:min-h-[500px] lg:min-h-[550px] bg-[#fafafa] rounded-xl overflow-hidden group relative cursor-zoom-in order-1 sm:order-2 flex-grow mb-4 sm:mb-0"
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  onMouseMove={handleMouseMove}
                >
                  <Image
                    src={selectedImageUrl}
                    alt={`${p.name} - Image ${selectedImageIndex + 1}`}
                    fill 
                    className="object-contain transition-transform duration-300 p-3 md:p-5"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 70vw, 600px"
                    priority
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-col gap-2 z-10">
                    {displayPrice !== undefined && displayOriginalPrice && displayDiscount > 0 && displayOriginalPrice > displayPrice && (
                      <div className="bg-red-600 text-white text-xs sm:text-sm font-medium sm:font-semibold px-2 sm:px-3 py-0.5 sm:py-1">
                        {displayDiscount}% OFF
                      </div>
                    )}
                    {isNewProduct && (
                      <div className="bg-black text-white text-xs sm:text-sm font-medium sm:font-semibold px-2 sm:px-3 py-0.5 sm:py-1">
                        NEW
                      </div>
                    )}
                  </div>

                  {/* Zoom lens */}
                  {isZooming && selectedImageUrl !== '/placeholder.png' && (
                    <div
                      style={{
                        position: 'absolute',
                        border: '2px solid rgba(0,0,0,0.5)',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        width: `${LENS_SIZE}px`,
                        height: `${LENS_SIZE}px`,
                        top: `${lensPosition.top}px`,
                        left: `${lensPosition.left}px`,
                        pointerEvents: 'none',
                        zIndex: 10,
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column: Product Details - 5 columns on large screens */}
          <div className="lg:col-span-5 order-2">              
            {/* Nike-style Zoom Pane - Only visible on desktop */}            {isZooming && selectedImageUrl !== '/placeholder.png' && (
              <div
                ref={zoomPaneRef}
                className="hidden lg:block absolute bg-no-repeat z-20 border border-gray-100 shadow-xl rounded-xl pointer-events-none bg-white"
                style={{
                  width: `450px`, 
                  height: `450px`,
                  top: `40px`,
                  right: `20px`,
                }}
              />
            )}
            
            {/* Product Info */}
            <div className="space-y-5 sm:space-y-6">
              {/* Product Info Header */}
              <div>
                {/* Product Category */}
                <div className="text-sm font-medium text-gray-500 mb-1">
                  {p.category?.name || 'Category'}
                </div>
                
                {/* Product Name */}
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{p.name}</h1>
                
                {/* Product Type & SKU */}
                <div className="flex flex-wrap justify-between text-xs sm:text-sm mb-2 gap-y-1">
                  <span className="text-gray-700">
                    {p.subCategories?.map((sc: any) => sc.name).join(' · ')}
                  </span>
                  {p.sku && <span className="text-gray-500">SKU: {p.sku}</span>}
                </div>
              </div>
              
              {/* Price Section */}
              <div className="space-y-1">
                {displayPrice !== undefined ? (
                  <div className="flex flex-wrap items-baseline gap-2">
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      ₹{displayPrice.toLocaleString('en-IN')}
                    </p>
                    {typeof displayOriginalPrice === 'number' && typeof displayPrice === 'number' && displayOriginalPrice > displayPrice && (
                      <p className="text-base sm:text-lg font-medium line-through text-gray-500">
                        ₹{displayOriginalPrice.toLocaleString('en-IN')}
                      </p>
                    )}
                    
                    {displayDiscount > 0 && (
                      <span className="bg-green-50 text-green-700 text-xs sm:text-sm font-medium px-2 py-0.5 rounded ml-1">
                        {displayDiscount}% OFF
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-lg sm:text-xl font-semibold text-gray-500">Price unavailable</p>
                )}
                <p className="text-xs sm:text-sm text-gray-500">
                  MRP inclusive of all taxes
                </p>
                
                {/* Stock Quantity Indicator */}
                {isSelectedSizeChosen && selectedSizeData && (
                  <div className="mt-2">
                    {selectedSizeData.qty > 0 && selectedSizeData.qty <= 5 ? (
                      <p className="text-xs sm:text-sm text-orange-600 font-medium flex items-center">
                        <AlertCircle size={14} className="mr-1" />
                        Only {selectedSizeData.qty} left in stock!
                      </p>
                    ) : selectedSizeData.qty > 0 ? (
                      <p className="text-xs sm:text-sm text-green-600 font-medium">
                        In stock
                      </p>
                    ) : (
                      <p className="text-xs sm:text-sm text-red-600 font-medium">
                        Out of stock
                      </p>
                    )}
                  </div>
                )}
              </div>              {/* Size Selection */}
              <div id="sizeGrid" className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="font-medium text-sm sm:text-base flex items-center">
                    Select Size
                    {showError && (
                      <span className="text-red-500 ml-2 text-xs sm:text-sm">Please select a size</span>
                    )}
                  </div>
                  <Link
                    href="/size-guide"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-700 hover:text-black"
                  >
                    <Info size={14} className="text-gray-600" />
                    <span className="underline underline-offset-4">Size Guide</span>
                  </Link>
                </div>
                
                {/* Nike-style Size Grid */}                <div className="grid grid-cols-4 xxs:grid-cols-5 xs:grid-cols-6 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-4 gap-1.5 sm:gap-2">
                  {p.sizes?.length > 0 ? (
                    p.sizes.map((s: { size: string }, index: number) => {
                      const sizeData = p.subProducts?.[0]?.sizes?.[index];
                      const sizeAvailable = sizeData && sizeData.qty > 0;
                      const isLowStock = sizeAvailable && sizeData.qty <= 5;
                      
                      return (
                        <button
                          key={index}
                          disabled={!sizeAvailable}
                          className={cn(
                            `rounded-md text-center py-2.5 sm:py-3 px-0.5 font-medium transition-all duration-150 text-xs sm:text-sm`,
                            selectedSizeIndex === index
                              ? "bg-gray-900 text-white" 
                              : sizeAvailable
                                ? "bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-300"
                                : "bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200",
                            isLowStock && selectedSizeIndex !== index && "border-orange-300"
                          )}
                          onClick={() => sizeAvailable && handleSizeSelect(index)}
                        >
                          <span>{s.size}</span>
                          {!sizeAvailable && <span className="block text-[10px] sm:text-xs">Out of Stock</span>}
                          {isLowStock && <span className="block text-[10px] sm:text-xs text-orange-600">Low Stock</span>}
                        </button>
                      );
                    })
                  ) : (
                    <p className="col-span-full text-sm text-gray-500 py-3 text-center border border-dashed rounded-md">No sizes available.</p>
                  )}
                </div>
              </div>
                {/* Call-to-Action Buttons */}
              <div className="flex flex-col gap-3">
                {/* Low Stock Warning */}
                {isSelectedSizeChosen && isSelectedSizeAvailable && selectedSizeData && selectedSizeData.qty <= 5 && (
                  <div className="flex items-center justify-center text-orange-600 text-xs sm:text-sm mb-1">
                    <AlertCircle size={14} className="mr-1" />
                    <span>Hurry, only {selectedSizeData.qty} left in this size!</span>
                  </div>
                )}
                
                {/* Add to Bag Button */}
                <Button
                  size="lg"
                  className={cn(
                    "w-full py-5 sm:py-6 h-auto text-sm sm:text-base rounded-full font-medium transition-all",
                    isSelectedSizeChosen && isSelectedSizeAvailable
                      ? "bg-gray-900 hover:bg-black text-white active:scale-[0.98]"
                      : "bg-gray-300 text-gray-600 cursor-not-allowed"
                  )}
                  onClick={handleAddToCart}
                  disabled={!isSelectedSizeChosen || !isSelectedSizeAvailable}
                >
                  {isSelectedSizeChosen && isSelectedSizeAvailable ? 'Add to Bag' : 'Select Size'}
                </Button>
                
                {/* Favorite Button */}
                <Button
                  variant="outline"
                  size="lg"
                  className={cn(
                    "w-full py-4 sm:py-5 h-auto text-sm sm:text-base rounded-full border font-medium transition-all flex items-center justify-center gap-2",
                    isInWishlist
                      ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                      : "border-gray-300 hover:border-gray-400 text-gray-900"
                  )}
                  onClick={handleWishlistToggle}
                  disabled={!productData || isWishlistLoading}
                >
                  <Heart
                    size={18}
                    fill={isInWishlist ? "currentColor" : "none"}
                    className={cn(isInWishlist && "text-red-600")}
                  />
                  {isWishlistLoading
                    ? 'Updating...'
                    : isInWishlist ? 'Favorite' : 'Favorite'
                  }
                </Button>
              </div>

              {/* Product Details with Modified Tabs - Removed Long Description Tab */}
              <div className="border-t pt-5 sm:pt-6">
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid grid-cols-2 mb-6">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="shipping">Shipping</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="space-y-4">
                    <h3 className="font-bold text-base sm:text-lg mb-3">Product Information</h3>
                    
                    {p.description && (
                      <div className="prose prose-sm max-w-none prose-p:my-1.5 sm:prose-p:my-2 prose-p:text-gray-700 text-sm">
                        <ReactMarkdown>{p.description}</ReactMarkdown>
                      </div>
                    )}
                    
                    {/* Benefits */}
                    {Array.isArray(p.benefits) && p.benefits.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-sm sm:text-base mb-2">Benefits</h4>
                        <ul className="space-y-1.5">
                          {p.benefits.map((benefit: any, index: number) => (
                            <li key={index} className="flex items-start">
                              <CheckCircle2 size={16} className="text-black mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-xs sm:text-sm text-gray-800">{benefit.name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="shipping" className="space-y-4">
                    <h3 className="font-bold text-base sm:text-lg mb-3">Shipping & Returns</h3>
                    
                    <div className="space-y-4 text-sm text-gray-700">
                      <div className="flex items-start gap-3">
                        <Truck size={18} className="text-gray-700 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium mb-1">Free Standard Shipping</p>
                          <p>On all orders above ₹999. Orders typically arrive within 5-7 business days.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <RefreshCcw size={18} className="text-gray-700 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium mb-1">30-Day Returns</p>
                          <p>Not completely satisfied? Return unworn items within 30 days for a full refund.</p>
                          <Link href="/return-policy" className="underline text-gray-900 mt-1 inline-block">
                            View our complete return policy
                          </Link>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

}

export default ProductPage;