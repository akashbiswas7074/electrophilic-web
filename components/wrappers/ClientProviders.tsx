"use client";

import { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { ProductOrderCountsProvider } from '@/contexts/ProductOrderCountsContext';

// Dynamic import for NextAuthProvider
const AuthProviderComponent = dynamic(
  () => import('@/providers/NextAuthProvider').then(mod => ({ default: mod.NextAuthProvider })),
  {
    ssr: false,
    loading: () => <></>,
  }
);

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProviderComponent>
      <CartProvider>
        <WishlistProvider>
          <ProductOrderCountsProvider>
            {children}
          </ProductOrderCountsProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProviderComponent>
  );
}
