"use client";

import CheckoutComponent from "@/components/shared/checkout";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation"; // Use 'next/navigation' for App Router

export default function CheckoutPage() {
  const router = useRouter(); // Add useRouter hook
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      // Redirect to sign-in page with callback URL
      // window.location.href = "/auth/signin?callbackUrl=/checkout";
      router.push("/auth/signin?callbackUrl=/checkout"); // Use router.push
    },
  });

  // No need to handle "unauthenticated" status here because useSession with required: true handles redirection

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Only render CheckoutComponent if authenticated (status === "authenticated")
  // useSession with required: true ensures this component only renders when authenticated
  return (
    <div className="container mx-auto">
      <CheckoutComponent />
    </div>
  );
}
