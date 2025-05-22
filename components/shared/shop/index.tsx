"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getAllCategories } from "@/lib/database/actions/categories.actions";
import { getAllSubCategoriesByParentId } from "@/lib/database/actions/subCategory.actions";
import { handleError } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Define a type for your category object if you haven't already
// This is a basic example, adjust according to your actual category structure
interface Category {
  _id: string;
  name: string;
  // Add other properties of category here
}

const ShopPageComponent = () => {
  const [allCategories, setAllCategories] = useState<Category[]>([]); // Typed useState
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(""); // Explicitly string
  const [subCategories, setSubCategories] = useState<any[]>([]); // Consider typing this as well if possible
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        await getAllCategories().then((res) => {
          if (res?.success) {
            setAllCategories(res?.categories || []);
            setSelectedCategoryId(res?.categories[0]?._id || "");
          }
        });
      } catch (error) {
        handleError(error);
      }
    };
    fetchCategories();
  }, []);
  useEffect(() => {
    async function fetchSubCategories() {
      if (selectedCategoryId === "") return;
      await getAllSubCategoriesByParentId(selectedCategoryId)
        .then((res) => {
          setSubCategories(res?.subCategories);
        })
        .catch((err) => {
          toast.error(err);
          console.log(err);
        });
    }
    fetchSubCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId]);
  return (
    <div className="conatiner my-[50px]">
      <h1 className="heading mb-8 text-center">Shop All Products</h1>
      <RadioGroup
        value={selectedCategoryId}
        onValueChange={setSelectedCategoryId}
      >
        <div className="flex flex-row justify-center items-center gap-[10px]">
          {allCategories.map((category: any, index: number) => (
            <div key={category._id} className="flex items-center space-x-2">
              <RadioGroupItem value={category._id} id={category._id} />
              <Label htmlFor={category._id}>{category.name}</Label>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {subCategories.map((item: any, index: number) => (
            <div className="p-4 border rounded" key={index}>
              <Link href={`/shop/subCategory/${item._id}?name=${item.name}`}>
                <Image
                  src={item.images[0].url}
                  alt={item.name}
                  width={450}
                  height={320}
                />
              </Link>
              <div className="">{item.name}</div>
              <Link href={`/shop/subCategory/${item._id}?name=${item.name}`}>
                <Button>See All Products</Button>
              </Link>
            </div>
          ))}
        </div>
      </RadioGroup>
    </div>
  );
};

export default ShopPageComponent;
