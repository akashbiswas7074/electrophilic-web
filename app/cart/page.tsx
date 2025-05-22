"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// ...existing imports and code...
export default function CartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  // ...existing cart state and logic...
  const handleCheckout = () => {
    if (status !== "authenticated") {
      toast.error("Please sign in to checkout");
      router.push("/auth/signin?callbackUrl=/checkout");
    } else {
      router.push("/checkout");
    }
  };
  // ...existing code...
}
