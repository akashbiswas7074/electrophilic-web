"use client";

import React, { useEffect, useState, useRef } from "react"; // Updated import statement
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader, Search, X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import {
  getProductsByQuery,
  getTopSellingProducts,
} from "@/lib/database/actions/product.actions";
import Link from "next/link";
import Image from "next/image"; // Import next/image
import { handleError } from "@/lib/utils";
import toast from "react-hot-toast";

const SearchModal = ({ setOpen }: { setOpen: any }) => {
  const [query, setQuery] = useState<string>("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Handle click outside to close the modal
  const modalRef = useRef<HTMLDivElement>(null); // Changed from React.useRef to useRef
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    // Add escape key support
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [setOpen]);
  useEffect(() => {
    async function fetchBestSellerProducts() {
      try {
        await getTopSellingProducts().then((res) => {
          if (res?.success) {
            setProducts(res?.products);
            console.log(res?.products);
          } else {
            setProducts(res?.products);
            toast.error(res?.message);
          }
        });
      } catch (error) {
        handleError(error);
      }
    }
    fetchBestSellerProducts();
  }, []);
  useEffect(() => {
    async function fetchDataByQuery() {
      try {
        setLoading(true);
        const res = await getProductsByQuery(query);
        if (res?.success) {
          setProducts(res?.products);
          setLoading(false);
        } else {
          setProducts(res?.products);
          // toast.error(res?.message);
          setLoading(false);
        }
      } catch (error) {
        handleError(error);
      }
    }

    if (query.length > 0) fetchDataByQuery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]); // Added query to dependency array
  const trendingSearches = [
    "Perfume",
    "Bath & Body",
    "Gifting",
    "Crazy Deals",
    "Combos",
  ];
  // Handle product click to close modal
  const handleProductClick = () => {
    setOpen(false);
  };

  // Handle backdrop click to close the modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking the backdrop itself, not its children
    if (e.target === e.currentTarget) {
      setOpen(false);
    }
  };
  
  return (    
    <div className="fixed inset-0 z-[200]" onClick={handleBackdropClick}>
      {/* Add semi-transparent backdrop */}
      <div className="fixed inset-0 " aria-hidden="true" />
      <div className="fixed inset-0 flex items-start justify-center pt-[10vh] sm:pt-[15vh]">
        <div 
          ref={modalRef} 
          className="w-full max-w-md md:max-w-lg lg:max-w-2xl mx-4 md:mx-6 lg:mx-auto bg-white rounded-2xl shadow-2xl z-50 border border-gray-100 overflow-hidden max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()} // Prevent clicks inside modal from closing it
        >
          {/* Header with improved styling */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Search className="mr-3 text-gray-600" size={20} />
              Search Products
            </h2>
            <Button
              variant={"ghost"}
              size={"icon"}
              onClick={() => setOpen(false)}
              className="rounded-full hover:bg-gray-100 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search input with improved styling */}
          <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50">
            <div className="relative">
              <Input
                type="search"
                placeholder="Type to search products..."
                className="w-full pl-10 pr-4 py-3 h-12 text-base border border-gray-300 rounded-lg focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-black shadow-sm"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
            </div>
          </div>
          
          {/* Trending searches with improved styling */}
          <div className="p-4 sm:p-5 border-b border-gray-100 bg-white">
            <h3 className="text-sm font-semibold mb-3 text-gray-700 flex items-center">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500 mr-2"></span>
              Trending Searches
            </h3>
            <div className="flex flex-wrap gap-2">
              {trendingSearches.map((search) => (
                <Button
                  onClick={() => setQuery(search)}
                  key={search}
                  variant={"outline"}
                  size={"sm"}
                  className="rounded-full bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-colors shadow-sm"
                >
                  {search}
                </Button>
              ))}
            </div>
          </div>          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            <h3 className="text-sm font-semibold mb-4 text-gray-700 flex items-center">
              {query.length > 0 ? (
                <>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></span>
                  <span className="mr-2">Search Results</span>
                  {!loading && products.length > 0 && (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium ml-2">
                      {products.length} items found
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-2"></span>
                  Recommended for you
                </>
              )}
            </h3>
            {loading && (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center">
                  <Loader className="animate-spin text-gray-500 mb-3" size={40} />
                  <p className="text-sm text-gray-500">Searching products...</p>
                </div>
              </div>
            )}
            {!loading && query.length > 0 && products.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-xl">
                <div className="bg-white rounded-full p-4 mb-4 shadow-sm">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No results found</h4>
                <p className="text-sm text-gray-500 max-w-sm">Try different keywords or browse our trending searches above</p>
              </div>
            )}            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {query.length > 0
                ? products.map((product: any, index: number) => (
                    <Link 
                      key={index} 
                      href={`/product/${product.slug}?style=0`} 
                      className="group"
                      onClick={handleProductClick}
                    >
                      <div className="space-y-2 transition-all duration-300 hover:shadow-md rounded-lg overflow-hidden bg-white border border-gray-100">
                        <div className="aspect-square relative overflow-hidden bg-gray-50">
                          <Image 
                            src={
                              product.subProducts[0]?.images[0]?.url ||
                              "/placeholder-image.png"
                            }
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />

                          {product.subProducts[0]?.discount > 0 && (
                            <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-medium px-2 py-0.5 rounded shadow-sm">
                              {product.subProducts[0]?.discount}% OFF
                            </span>
                          )}
                        </div>
                        <div className="p-2">
                          <h4 className="font-medium text-sm text-gray-900 line-clamp-1 group-hover:text-black">
                            {product.name}
                          </h4>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="font-semibold text-gray-900">
                              ₹{product.subProducts[0]?.sizes[0]?.price}
                            </span>
                            {product.subProducts[0]?.discount > 0 && (
                              <span className="text-xs text-gray-500 line-through">
                                ₹
                                {Math.round(product.subProducts[0]?.sizes[0]?.price *
                                  (1 + product.subProducts[0]?.discount / 100))}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                : products.map((product: any, index: number) => (
                    <Link 
                      key={index} 
                      href={`/product/${product.slug}?style=0`} 
                      className="group"
                      onClick={handleProductClick}
                    >
                      <div className="space-y-2 transition-all duration-300 hover:shadow-md rounded-lg overflow-hidden bg-white border border-gray-100">
                        <div className="aspect-square relative bg-gray-50">
                          <Image
                            src={
                              product.subProducts[0]?.images[0]?.url ||
                              "/placeholder-image.png"
                            }
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {product.subProducts[0]?.discount > 0 && (
                            <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-medium px-2 py-0.5 rounded shadow-sm">
                              {product.subProducts[0].discount}% OFF
                            </span>
                          )}
                        </div>
                        <div className="p-2">
                          <h4 className="font-medium text-sm text-gray-900 line-clamp-1 group-hover:text-black">
                            {product.name}
                          </h4>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="font-semibold text-gray-900">
                              ₹
                              {product.subProducts[0]?.discount > 0
                                ? Math.round(
                                    product.subProducts[0].sizes[0].price -
                                    (product.subProducts[0].sizes[0].price *
                                      product.subProducts[0].discount) /
                                      100
                                  )
                                : product.subProducts[0].sizes[0].price}
                            </span>
                            {product.subProducts[0]?.discount > 0 && (
                              <span className="text-xs text-gray-500 line-through">
                                ₹{product.subProducts[0]?.sizes[0]?.price}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
