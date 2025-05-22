"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function ProtectedRoute({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const { status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      toast.error("Please sign in to continue");
      router.push('/auth/signin?callbackUrl=/checkout');
    } else if (status === "authenticated") {
      setIsLoading(false);
    }
  }, [status, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return <>{children}</>;
}
