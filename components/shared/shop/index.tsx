"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getAllCategories } from "@/lib/database/actions/categories.actions";
import { getAllSubCategoriesByParentId } from "@/lib/database/actions/subCategory.actions";
import { getProductsBySubcategory } from "@/lib/database/actions/product.actions";
import { handleError } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ProductCardSmall } from "@/components/shared/product/ProductCardSmall";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Define a type for your category object if you haven't already
// This is a basic example, adjust according to your actual category structure
interface Category {
  _id: string;
  name: string;
  slug?: string;
  images?: any[];
}

interface SubCategory {
  _id: string;
  name: string;
  images?: { url: string; public_id: string }[];
}

const ShopPageComponent = () => {
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [subCategoriesLoading, setSubCategoriesLoading] = useState(false);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>("");
  const [subcategoryProducts, setSubcategoryProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const res = await getAllCategories();
        if (res?.success && res?.categories) {
          setAllCategories(res.categories);
          if (res.categories.length > 0) {
            setSelectedCategoryId(res.categories[0]._id);
          }
        } else {
          toast.error(res?.message || "Failed to fetch categories");
          setAllCategories([]);
        }
      } catch (error: any) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to fetch categories");
        setAllCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchSubCategories = async () => {
      if (!selectedCategoryId) {
        setSubCategories([]);
        return;
      }

      try {
        setSubCategoriesLoading(true);
        const res = await getAllSubCategoriesByParentId(selectedCategoryId);
        if (res?.success && res?.subCategories) {
          setSubCategories(res.subCategories);
        } else {
          console.warn("No subcategories found for category:", selectedCategoryId);
          setSubCategories([]);
        }
      } catch (error: any) {
        console.error("Error fetching subcategories:", error);
        toast.error("Failed to fetch subcategories");
        setSubCategories([]);
      } finally {
        setSubCategoriesLoading(false);
      }
    };

    fetchSubCategories();
  }, [selectedCategoryId]);

  useEffect(() => {
    const fetchSubcategoryProducts = async () => {
      if (!selectedSubcategoryId) {
        setSubcategoryProducts([]);
        return;
      }

      try {
        setProductsLoading(true);
        const selectedSubcategory = subCategories.find(sub => sub._id === selectedSubcategoryId);
        if (!selectedSubcategory) {
          setSubcategoryProducts([]);
          return;
        }

        const res = await getProductsBySubcategory(selectedSubcategory.name);
        if (res?.success && res?.products) {
          setSubcategoryProducts(res.products);
        } else {
          console.warn("No products found for subcategory:", selectedSubcategory.name);
          setSubcategoryProducts([]);
        }
      } catch (error: any) {
        console.error("Error fetching subcategory products:", error);
        toast.error("Failed to fetch products");
        setSubcategoryProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchSubcategoryProducts();
  }, [selectedSubcategoryId, subCategories]);

  if (loading) {
    return (
      <div className="container my-[50px]">
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="text-lg">Loading categories...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container my-[50px]">
      <h1 className="heading mb-8 text-center">Shop All Products</h1>

      {allCategories.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No categories available</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Category Selection */}
          <RadioGroup
            value={selectedCategoryId}
            onValueChange={setSelectedCategoryId}
          >
            <div className="flex flex-row justify-center items-center gap-[10px] flex-wrap">
              {allCategories.map((category) => (
                <div key={category._id} className="flex items-center space-x-2">
                  <RadioGroupItem value={category._id} id={category._id} />
                  <Label htmlFor={category._id}>{category.name}</Label>
                </div>
              ))}
            </div>
          </RadioGroup>

          {/* Subcategory Selection */}
          {subCategoriesLoading ? (
            <div className="text-center py-8">
              <div className="text-lg">Loading subcategories...</div>
            </div>
          ) : subCategories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No subcategories available for this category</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Subcategory buttons */}
              <div className="flex justify-center">
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button
                    variant={selectedSubcategoryId === "" ? "default" : "outline"}
                    onClick={() => setSelectedSubcategoryId("")}
                    className="min-w-[100px]"
                  >
                    All Subcategories
                  </Button>
                  {subCategories.map((item) => (
                    <Button
                      key={item._id}
                      variant={selectedSubcategoryId === item._id ? "default" : "outline"}
                      onClick={() => setSelectedSubcategoryId(item._id)}
                      className="min-w-[100px]"
                    >
                      {item.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Subcategory showcase when no specific subcategory is selected */}
              {selectedSubcategoryId === "" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {subCategories.map((item) => (
                    <div className="p-4 border rounded hover:shadow-md transition-shadow cursor-pointer" 
                         key={item._id}
                         onClick={() => setSelectedSubcategoryId(item._id)}>
                      {item.images && item.images.length > 0 && item.images[0]?.url ? (
                        <Image
                          src={item.images[0].url}
                          alt={item.name || "Subcategory"}
                          width={450}
                          height={320}
                          className="w-full h-auto rounded"
                          onError={(e) => {
                            console.error("Image failed to load:", item.images?.[0]?.url);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-gray-500">No image available</span>
                        </div>
                      )}
                      <div className="mt-2 font-semibold text-center">{item.name}</div>
                      <div className="mt-2 text-center">
                        <Badge variant="outline">View Products</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Products display when subcategory is selected */}
              {selectedSubcategoryId && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">
                      {subCategories.find(sub => sub._id === selectedSubcategoryId)?.name} Products
                    </h2>
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedSubcategoryId("")}
                      className="flex items-center gap-2"
                    >
                      <ChevronLeft size={16} />
                      Back to Subcategories
                    </Button>
                  </div>

                  {productsLoading ? (
                    <div className="text-center py-8">
                      <div className="text-lg">Loading products...</div>
                    </div>
                  ) : subcategoryProducts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No products available in this subcategory</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {subcategoryProducts.map((product) => (
                        <ProductCardSmall
                          key={product._id || product.id}
                          product={product}
                          viewMode="grid"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShopPageComponent;
