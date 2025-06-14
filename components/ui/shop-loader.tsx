"use client";

import React from 'react';

export const ShopLoader = () => {
  return (
    <div className="flex justify-center items-center min-h-[500px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
};