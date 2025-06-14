"use client";
import useEmblaCarousel from "embla-carousel-react";
import { Star, ChevronLeft, ChevronRight, CheckCircle, MessageSquare, ShoppingBag } from "lucide-react";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { CiInstagram } from "react-icons/ci";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

// TypeScript interfaces
interface Review {
  id?: string | number;
  _id?: string;
  name?: string;
  userName?: string;
  userLastName?: string;
  instagram?: string;
  image?: string;
  userImage?: string;
  rating?: number;
  text?: string;
  comment?: string;
  verified?: boolean;
  productName?: string;
  productSlug?: string;
  productImage?: string;
  productId?: string;
  review?: {
    verified?: boolean;
    userImage?: string;
    comment?: string;
    rating?: number;
    userName?: string;
    userLastName?: string;
  };
}

interface Product {
  id: string;
  name: string;
  slug: string;
  image: string;
  avgRating: number;
  reviewCount: number;
}

interface ProductReviewData {
  product: Product;
  reviews: Review[];
  totalReviews?: number;
}

interface ReviewCommentProps {
  review: Review;
  productView?: boolean;
}

interface ProductReviewCardProps {
  productData: ProductReviewData;
}

// Fallback reviews in case API fails
const fallbackReviews = [
	{
		id: 1,
		name: "Milinda Thakur",
		instagram: "milli_thanur_123",
		image: "/images/avatar-placeholder.png",
		rating: 5,
		text: "VIBECART has set a new standard in the fragrance market, offering exceptional quality at remarkably affordable prices.",
		verified: true,
		productName: "Premium Perfume Collection",
		productSlug: "premium-perfume-collection",
		productImage: "/images/placeholder-product.png"
	},
	{
		id: 2,
		name: "Shubhman Ravi",
		instagram: "shubhman_92_ravi",
		image: "/images/avatar-placeholder.png",
		rating: 5,
		text: "Amazed by the lasting power of these scents. VIBECART provides high-end fragrances at unmatched prices.",
		verified: true,
		productName: "Premium Perfume Collection",
		productSlug: "premium-perfume-collection",
		productImage: "/images/placeholder-product.png"
	},
	{
		id: 3,
		name: "Raghav varma",
		instagram: "raghav.varma_89",
		image: "/images/avatar-placeholder.png",
		rating: 5,
		text: "Discovered my signature fragrance with VIBECART. The meticulous craftsmanship in their perfumes is truly impressive.",
		verified: true,
		productName: "Signature Scent Collection",
		productSlug: "signature-scent-collection",
		productImage: "/images/placeholder-product.png"
	},
];

// Enhanced Review Loading Skeleton Component
const ProductReviewSkeleton = () => (
	<div className="flex-[0_0_100%] min-w-0 px-4 sm:px-6">
		<div className="bg-white rounded-lg shadow-md p-4 sm:p-6 transition-all duration-300">
			{/* Product Info Skeleton */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 pb-4 border-b">
				<Skeleton className="w-full sm:w-20 h-40 sm:h-20 rounded-md mb-3 sm:mb-0" />
				<div className="flex-1 w-full">
					<Skeleton className="h-5 w-full sm:w-3/4 mb-2" />
					<Skeleton className="h-4 w-2/3 sm:w-1/2 mb-2" />
					<Skeleton className="h-4 w-1/3 sm:w-1/4" />
				</div>
			</div>
			
			{/* Reviews Skeleton */}
			<div className="space-y-6">
				<Skeleton className="h-4 w-40 mb-4" />
				<div className="flex gap-3">
					<Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
					<div className="flex-1">
						<div className="flex items-center gap-2 mb-1">
							<Skeleton className="h-4 w-24" />
							<div className="flex gap-0.5">
								{[...Array(5)].map((_, j) => (
									<Skeleton key={j} className="w-3 h-3" />
								))}
							</div>
						</div>
						<Skeleton className="h-3 w-full mb-1" />
						<Skeleton className="h-3 w-4/5" />
					</div>
				</div>
			</div>
		</div>
	</div>
);

// Individual Review Comment Component
const ReviewComment: React.FC<ReviewCommentProps> = ({ review, productView = false }) => {
	// Helper functions to extract data from review objects with different structures
	const isVerified = () => {
		if (review.review?.verified) return true;
		if (review.verified) return true;
		return false;
	};

	const getUserImage = () => {
		if (review.image) return review.image;
		if (review.review?.userImage) return review.review.userImage;
		if (review.userImage) return review.userImage;
		return "/images/avatar-placeholder.png";
	};

	const getReviewText = () => {
		if (review.text) return review.text;
		if (review.review?.comment) return review.review.comment;
		if (review.comment) return review.comment;
		return "Great product! Highly recommended.";
	};

	const getRating = () => {
		if (typeof review.rating === 'number') return review.rating;
		if (typeof review.review?.rating === 'number') return review.review.rating;
		return 5;
	};

	const getUserName = () => {
		if (review.name) return review.name;
		if (review.review?.userName) return `${review.review.userName} ${review.review.userLastName || ''}`;
		if (review.userName) return review.userName;
		return "Happy Customer";
	};

	return (
		<div className="flex gap-3 mb-4 transition-all duration-300 hover:bg-gray-50 p-2 rounded">
			{/* User Avatar */}
			<div className="relative flex-shrink-0">
				<Image
					src={getUserImage()}
					alt={`${getUserName()}'s profile`}
					width={productView ? 40 : 64}
					height={productView ? 40 : 64}
					className="rounded-full object-cover border border-gray-200 shadow-sm"
				/>
				{isVerified() && !productView && (
					<div className="absolute -bottom-1 -right-1 bg-green-100 border border-green-400 rounded-full p-0.5">
						<CheckCircle size={12} className="text-green-600" />
					</div>
				)}
			</div>
			
			{/* Review Content */}
			<div className="flex-1">
				{/* User Name and Rating */}
				<div className="flex items-center flex-wrap gap-2 mb-1">
					<p className={`font-medium ${productView ? 'text-sm' : 'text-base'}`}>
						{getUserName()}
					</p>
					
					{/* Verified Badge (inline in product view) */}
					{isVerified() && productView && (
						<span className="text-xs font-medium text-green-600 px-1.5 py-0.5 bg-green-50 rounded-full">
							Verified
						</span>
					)}
					
					{/* Star Rating */}
					<div className="flex gap-0.5">
						{[...Array(5)].map((_, i) => (
							<Star
								key={i}
								className={`${productView ? 'w-3 h-3' : 'w-4 h-4'} ${
									i < getRating()
										? "text-yellow-400 fill-current"
										: "text-gray-300"
								}`}
							/>
						))}
					</div>
				</div>
				
				{/* Review Text */}
				<p className={`${productView ? 'text-sm' : 'text-base'} text-gray-700`}>
					{getReviewText()}
				</p>
				
				{/* Instagram Handle (for fallback reviews) */}
				{review.instagram && (
					<p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
						<CiInstagram size={12} />
						{review.instagram}
					</p>
				)}
			</div>
		</div>
	);
};

// Product Review Card Component (groups reviews by product)
const ProductReviewCard: React.FC<ProductReviewCardProps> = ({ productData }) => {
	const { product, reviews } = productData;
	
	return (
		<div className="flex-[0_0_100%] min-w-0 px-2 sm:px-4 md:px-6">
			<div className="bg-white rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-all duration-300">
				{/* Product Header */}
				<div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 pb-4 border-b">
					{/* Product Image */}
					<div className="relative w-full h-[180px] sm:w-24 sm:h-24 rounded-md overflow-hidden flex-shrink-0">
						<Image
							src={product.image || "/images/placeholder-product.png"}
							alt={product.name}
							fill
							className="object-cover"
							sizes="(max-width: 640px) 100vw, 96px"
						/>
					</div>
					
					{/* Product Info */}
					<div className="w-full sm:w-auto">
						<h3 className="font-semibold text-xl sm:text-lg mb-2 line-clamp-2">
							{product.name}
						</h3>
						<div className="flex items-center gap-2 mb-2">
							<div className="flex">
								{[...Array(5)].map((_, i) => (
									<Star
										key={i}
										className={`w-4 h-4 ${
											i < product.avgRating
												? "text-yellow-400 fill-current"
												: "text-gray-300"
										}`}
									/>
								))}
							</div>
							<span className="text-sm text-gray-500">
								({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
							</span>
						</div>
						
						{/* Product Link */}
						<Link
							href={`/product/${product.slug}`}
							className="text-sm inline-flex items-center gap-1 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors font-medium mt-1"
						>
							<ShoppingBag size={14} />
							View Product
						</Link>
					</div>
				</div>
				
				{/* Reviews List */}
				<div className="space-y-5">
					<h4 className="text-sm font-medium flex items-center gap-1 text-gray-700 pb-2 border-b border-gray-100">
						<MessageSquare size={16} />
						Top Customer Review
					</h4>
					
					{reviews.map((review, idx) => (
						<ReviewComment 
							key={review._id || review.id || idx} 
							review={review} 
							productView={true} 
						/>
					))}
				</div>
			</div>
		</div>
	);
};

const ReviewSection = () => {
	const [emblaRef, emblaApi] = useEmblaCarousel({ 
		loop: true,
		align: 'center',
		breakpoints: {
			'(min-width: 768px)': { align: 'center' }
		}
	});
	const [reviews, setReviews] = useState<Review[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [currentSlide, setCurrentSlide] = useState(0);
	const [slidesInView, setSlidesInView] = useState(1);

	// Fetch top reviews
	useEffect(() => {
		const fetchTopReviews = async () => {
			try {
				console.log("Fetching verified reviews from API...");
				const response = await fetch('/api/reviews/top?limit=10'); // Fetch more reviews to group
				
				if (!response.ok) {
					console.error(`API error: ${response.status} ${response.statusText}`);
					throw new Error(`Failed to fetch top reviews: ${response.statusText}`);
				}
				
				const data = await response.json();
				
				if (data.success && Array.isArray(data.reviews) && data.reviews.length > 0) {
					console.log(`Successfully fetched ${data.reviews.length} reviews`);
					setReviews(data.reviews);
				} else {
					console.warn("API returned empty reviews or unexpected format, using fallbacks");
					setReviews(fallbackReviews);
				}
			} catch (error) {
				console.error('Error fetching top reviews:', error);
				setError(true);
				setReviews(fallbackReviews);
			} finally {
				setLoading(false);
			}
		};

		fetchTopReviews();
	}, []);

	// Determine viewport size and adjust slides in view
	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth >= 1024) {
				setSlidesInView(3);
			} else if (window.innerWidth >= 768) {
				setSlidesInView(2);
			} else {
				setSlidesInView(1);
			}
		};

		// Initial call
		handleResize();

		// Set up listener
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	// Track current slide index
	useEffect(() => {
		if (!emblaApi) return;

		const onSelect = () => {
			setCurrentSlide(emblaApi.selectedScrollSnap());
		};

		emblaApi.on('select', onSelect);
		onSelect(); // Initialize

		return () => {
			emblaApi.off('select', onSelect);
		};
	}, [emblaApi]);

	// Group reviews by product
	const groupedReviews = useMemo(() => {
		// Helper to get product ID from review
		const getProductId = (review: Review): string => {
			// Extract the product ID correctly based on the data structure
			// MongoDB ObjectIDs are stored as strings in the response
			return review.productId || (review.id && String(review.id)) || 'unknown';
		};
		
		// Helper to get product name
		const getProductName = (review: Review): string => {
			return review.productName || 'Product';
		};
		
		// Helper to get product slug
		const getProductSlug = (review: Review): string => {
			return review.productSlug || 'product';
		};
		
		// Helper to get product image
		const getProductImage = (review: Review): string => {
			if (review.productImage) return review.productImage;
			return "/images/placeholder-product.png";
		};
		
		// Group reviews by product ID
		const groupedByProduct: Record<string, ProductReviewData & { totalReviews?: number }> = {};
		reviews.forEach(review => {
			// Create a consistent key for grouping
			// For API reviews, use the productId property
			const productId = getProductId(review);
			
			if (!groupedByProduct[productId]) {
				// Initialize with the product info and the first review for this product
				groupedByProduct[productId] = {
					product: {
						id: productId,
						name: getProductName(review),
						slug: getProductSlug(review),
						image: getProductImage(review),
						avgRating: 0,
						reviewCount: 0,
					},
					reviews: [review] // Start with just this review
				};
			} else {
				// For existing products, just track the review count but don't add to the reviews array
				// This ensures we only keep the first (top) review for each product
				groupedByProduct[productId].totalReviews = (groupedByProduct[productId].totalReviews || 1) + 1;
			}
		});
		
		// Calculate average rating for each product
		const result: ProductReviewData[] = Object.values(groupedByProduct).map(group => {
			// Get rating from the first review (top review)
			const rating = group.reviews[0].review?.rating || group.reviews[0].rating || 5;
			
			// Store both the rating from the top review and the total review count
			group.product.avgRating = rating;
			group.product.reviewCount = group.totalReviews || 1;
			
			return group;
		});
		
		console.log(`Showing top review for ${result.length} products`);
		
		return result;
	}, [reviews]);

	const scrollPrev = useCallback(() => {
		if (emblaApi) emblaApi.scrollPrev();
	}, [emblaApi]);

	const scrollNext = useCallback(() => {
		if (emblaApi) emblaApi.scrollNext();
	}, [emblaApi]);

	return (
		<section className="w-full bg-gradient-to-b from-gray-50 to-white py-12 md:py-16">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8">
				<h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4 text-gray-800">
					WHAT OUR CUSTOMERS HAVE TO SAY
				</h2>
				<p className="text-center text-gray-600 max-w-2xl mx-auto mb-12">
					Discover why customers love our products with these verified reviews from real shoppers
				</p>
				
				<div className="relative max-w-6xl mx-auto">
					{/* Carousel Container */}
					<div className="overflow-hidden rounded-lg" ref={emblaRef}>
						<div className="flex py-4">
							{loading ? (
								// Show skeletons while loading
								<>
									<ProductReviewSkeleton />
									<ProductReviewSkeleton />
									<ProductReviewSkeleton />
								</>
							) : groupedReviews.length > 0 ? (
								// Show product review cards
								groupedReviews.map((groupData, index) => (
									<ProductReviewCard 
										key={groupData.product.id || index} 
										productData={groupData} 
									/>
								))
							) : (
								// Show message if no reviews are available
								<div className="flex-[0_0_100%] min-w-0 px-4">
									<div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
										<Image
											src="/images/placeholder-review.png"
											alt="No reviews"
											width={120}
											height={120}
											className="mb-4 opacity-50"
										/>
										<h3 className="text-lg font-medium mb-2">No Reviews Yet</h3>
										<p className="text-gray-500 text-center">
											Be the first to leave a review and help other shoppers make their decision!
										</p>
									</div>
								</div>
							)}
						</div>
					</div>
					
					{/* Navigation buttons - Enhanced for better visibility and responsiveness */}
					{groupedReviews.length > 1 && (
						<>
							<button
								onClick={scrollPrev}
								className="absolute top-1/2 -left-1 sm:left-2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md z-10 transition-all duration-300 backdrop-blur-sm"
								aria-label="Previous review"
							>
								<ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
							</button>
							<button
								onClick={scrollNext}
								className="absolute top-1/2 -right-1 sm:right-2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md z-10 transition-all duration-300 backdrop-blur-sm"
								aria-label="Next review"
							>
								<ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
							</button>
						</>
					)}
					
					{/* Dots navigation */}
					{groupedReviews.length > 1 && (
						<div className="flex justify-center mt-6 gap-2">
							{groupedReviews.map((_, index) => (
								<button
									key={index}
									onClick={() => emblaApi?.scrollTo(index)}
									className={`w-2 h-2 rounded-full transition-all duration-300 ${
										currentSlide === index 
											? 'bg-blue-600 w-6' 
											: 'bg-gray-300 hover:bg-gray-400'
									}`}
									aria-label={`Go to slide ${index + 1}`}
								/>
							))}
						</div>
					)}
				</div>
			</div>
		</section>
	);
};

export default ReviewSection;
