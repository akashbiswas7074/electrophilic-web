import React from "react";

const CategorySection = ({ subCategories }: { subCategories: any[] }) => {
  return (
    <div className="container mx-auto px-4 mb-[20px]">
      <div className="heading my-[10px] ownContainer text-center uppercase heading ownContainer  sm:my-[40px]">
        LUXURY CATEGORIES
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {subCategories.map((category, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className="bg-gray-100">
              <img
                src={category.images[0].url}
                alt={category.name}
                className="w-full h-auto object-cover"
              />
            </div>
            <span className="text-sm font-medium text-center">
              {category.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategorySection;
