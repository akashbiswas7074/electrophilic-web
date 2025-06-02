'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useProductOrderCounts } from '@/hooks/use-product-order-counts';

interface ProductOrderCountsContextType {
  orderCounts: Record<string, number>;
  loading: boolean;
  error: string | null;
}

const ProductOrderCountsContext = createContext<ProductOrderCountsContextType>({
  orderCounts: {},
  loading: false,
  error: null
});

export const useProductOrderCountsContext = () => useContext(ProductOrderCountsContext);

interface ProductOrderCountsProviderProps {
  children: ReactNode;
}

export const ProductOrderCountsProvider: React.FC<ProductOrderCountsProviderProps> = ({ children }) => {
  const { counts, loading, error } = useProductOrderCounts();

  return (
    <ProductOrderCountsContext.Provider value={{ orderCounts: counts, loading, error }}>
      {children}
    </ProductOrderCountsContext.Provider>
  );
};