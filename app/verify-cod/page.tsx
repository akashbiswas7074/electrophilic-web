"use client";
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useCartStore } from "@/store/cart"; // Import useCartStore

function VerifyCodPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderIdFromUrl = searchParams?.get('orderId') || null;

  const [orderId, setOrderId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { emptyCart } = useCartStore(); // Get emptyCart from the store

  useEffect(() => {
    if (orderIdFromUrl) {
      setOrderId(orderIdFromUrl);
      console.log("[VerifyCodPage] Order ID from URL:", orderIdFromUrl);
    } else {
      console.error("[VerifyCodPage] Order ID not found in URL.");
      toast.error("Order ID is missing. Cannot verify.");
      // Optionally redirect if orderId is crucial and missing
      // router.push('/');
    }
  }, [orderIdFromUrl, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!orderId) {
      toast.error("Order ID is missing. Cannot submit verification.");
      setError("Order ID is missing. Please go back to checkout and try again.");
      return;
    }
    if (!verificationCode.trim()) {
      toast.error("Please enter the verification code.");
      setError("Verification code cannot be empty.");
      return;
    }

    setIsLoading(true);
    toast.loading("Verifying your code...");
    console.log("[VerifyCodPage] Submitting verification for Order ID:", orderId, "Code:", verificationCode);

    try {
      const response = await fetch('/api/order/verify-cod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, verificationCode }),
        credentials: 'include', // Add credentials to include cookies in the request
      });

      let result;
      try {
        // Safely parse the response JSON
        const responseText = await response.text();
        console.log("[VerifyCodPage] Raw response:", responseText);
        result = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("[VerifyCodPage] Failed to parse API response:", parseError);
        result = { success: false, message: "Failed to parse server response" };
      }

      toast.dismiss();

      if (response.ok && result && result.success) {
        console.log("[VerifyCodPage] Verification successful:", result);
        toast.success(result.message || "Order verified successfully!");
        emptyCart(); // Clear the cart upon successful verification
        
        // Use the new order ID returned from the API instead of the pending order ID
        const newOrderId = result.orderId || orderId;
        router.push(`/order/${newOrderId}?status=cod_verified_success`); // Redirect to order details/success page
      } else {
        const errorMessage = result?.message || 
          `Verification failed with status: ${response.status} ${response.statusText}`;
        console.error("[VerifyCodPage] Verification failed:", result || "Empty response");
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err: any) {
      toast.dismiss();
      console.error("[VerifyCodPage] Error during verification API call:", err);
      setError("An unexpected error occurred. Please try again.");
      toast.error("An error occurred while trying to verify your code.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!orderIdFromUrl && !orderId) { // Show loading or error if orderId isn't even in URL yet
    return (
      <div className="container mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader className="animate-spin h-10 w-10 text-primary mb-4" />
        <p className="text-muted-foreground">Loading order details...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-xl rounded-lg border">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Verify Your Order</h1>
          <p className="text-muted-foreground mt-1">
            Enter the verification code sent to your email for Order ID: <span className="font-semibold">{orderId || 'N/A'}</span>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-1">
              Verification Code
            </label>
            <Input
              id="verificationCode"
              name="verificationCode"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              required
              className="w-full"
              disabled={isLoading}
              maxLength={6} // Assuming a 6-digit code
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Verification Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isLoading || !orderId || !verificationCode.trim()}>
            {isLoading ? (
              <><Loader className="animate-spin mr-2 h-4 w-4" /> Verifying...</>
            ) : (
              'Verify & Confirm Order'
            )}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          <p>If you haven't received the code, please check your spam/junk folder or <button onClick={() => router.push('/contact')} className="underline hover:text-primary">contact support</button>.</p>
        </div>
      </div>
    </div>
  );
}

// Wrap the component with Suspense for useSearchParams
export default function VerifyCodPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}> {/* Basic fallback for Suspense */}
      <VerifyCodPageContent />
    </Suspense>
  );
}
