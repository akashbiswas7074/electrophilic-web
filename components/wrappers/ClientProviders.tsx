"use client";

import { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext'; // Import WishlistProvider

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
        <WishlistProvider> {/* Add WishlistProvider wrapper */}
          {children}
        </WishlistProvider> {/* Close WishlistProvider wrapper */}
      </CartProvider>
    </AuthProviderComponent>
  );
}
