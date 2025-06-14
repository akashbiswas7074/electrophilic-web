"use client";

import React from 'react';

const ShopLoader = () => {
  return (
    <div className="w-full min-h-[50vh] flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      <p className="mt-4 text-xl font-medium text-gray-700">Loading products...</p>
    </div>
  );
};

export default ShopLoader;