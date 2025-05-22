"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, ShieldCheck, CheckCircle, Lock } from "lucide-react";
import Image from "next/image";
import { useWebsiteLogo } from "@/hooks/use-website-logo";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;
  const { logo, isLoading: logoLoading } = useWebsiteLogo();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Automatically redirect after success
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSuccess) {
      timer = setTimeout(() => {
        router.push("/auth/signin");
      }, 3000); // Redirect after 3 seconds
    }
    // Cleanup function to clear the timeout if the component unmounts
    // or if isSuccess becomes false before the timeout finishes
    return () => clearTimeout(timer);
  }, [isSuccess, router]);


  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      toast.error("Passwords do not match");
      return;
    }

    // Basic password strength check (example)
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
        credentials: 'include', // Add credentials to include cookies in the request
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      toast.success("Password reset successfully! Redirecting to sign in..."); // Update toast message
      setIsSuccess(true);
      // Automatic redirect is now handled by the useEffect hook

    } catch (error: any) {
      console.error("Password reset error:", error);
      setError(error.message || "An error occurred");
      toast.error(error.message || "An error occurred during password reset");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary">
          {/* Left side background and content (similar to the other blocks) */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary to-primary-foreground opacity-90"></div>
          <div className="absolute inset-0 bg-[url('/auth-pattern.svg')] opacity-30"></div>
          <div className="relative z-10 flex flex-col justify-center px-8 py-12 text-white h-full">
            {/* Content same as reset-password/page.tsx */}
            <div className="mb-8">
              <Image 
                src={logo?.mobileLogoUrl || logo?.logoUrl || "/logo-white.png"} 
                alt={logo?.altText || "Company Logo"} 
                width={180} 
                height={50}
                className="mb-8"
              />
              <h1 className="text-4xl font-bold mb-6">Password Updated!</h1>
              <p className="text-lg opacity-80 mb-6">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="text-center mb-8 lg:hidden">
              <Image 
                src={logo?.logoUrl || "/logo.png"} 
                alt={logo?.altText || "Company Logo"} 
                width={150} 
                height={40}
                className="mx-auto mb-6"
              />
            </div>
            
            <Card className="border-none shadow-lg dark:bg-gray-800 text-center">
              <CardHeader>
                <div className="mx-auto bg-green-100 rounded-full p-3 w-fit dark:bg-green-900/30">
                  <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-2xl mt-4">Password Reset Successful</CardTitle>
                <CardDescription>Your password has been updated.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">You will be redirected to the sign-in page shortly...</p>
                <Button asChild className="w-full">
                  <Link href="/auth/signin">Proceed to Sign In</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Left column - Brand/Image section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary to-primary-foreground opacity-90"></div>
        <div className="absolute inset-0 bg-[url('/auth-pattern.svg')] opacity-30"></div>
        <div className="relative z-10 flex flex-col justify-center px-8 py-12 text-white h-full">
          <div className="mb-8">
            <Image 
              src={logo?.mobileLogoUrl || logo?.logoUrl || "/logo-white.png"} 
              alt={logo?.altText || "Company Logo"} 
              width={180} 
              height={50}
              className="mb-8"
            />
            <h1 className="text-4xl font-bold mb-6">Reset Your Password</h1>
            <p className="text-lg opacity-80 mb-6">
              Create a new password for your {logo?.name || "VibeCart"} account to ensure your account remains secure.
            </p>
          </div>
          <div className="mt-auto">
            <div className="p-6 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm">
              <p className="italic text-sm mb-3">"Setting a strong, unique password is essential for protecting your online accounts. {logo?.name || "VibeCart"}'s commitment to security gives me peace of mind when shopping."</p>
              <div className="flex items-center">
                <div className="rounded-full bg-white h-10 w-10 flex items-center justify-center mr-3">
                  <span className="text-primary font-bold">SP</span>
                </div>
                <div>
                  <p className="font-medium">Sarah Parker</p>
                  <p className="text-xs opacity-80">Cybersecurity Specialist</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right column - Form section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <Image 
              src={logo?.logoUrl || "/logo.png"} 
              alt={logo?.altText || "Company Logo"} 
              width={150} 
              height={40}
              className="mx-auto mb-6"
            />
          </div>
          
          <Card className="border-none shadow-lg dark:bg-gray-800">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit dark:bg-primary/20">
                <ShieldCheck className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold mt-4">Reset Your Password</CardTitle>
              <CardDescription>Enter your new password below</CardDescription>
            </CardHeader>
            
            <CardContent>
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded dark:bg-red-900/30 dark:border-red-700">
                  <p className="text-red-700 text-sm dark:text-red-200">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2 relative">
                  <Label className="text-sm font-medium" htmlFor="password">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="pl-10 pr-10" 
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters</p>
                </div>

                <div className="space-y-2 relative">
                  <Label className="text-sm font-medium" htmlFor="confirmPassword">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                  {isLoading ? "Resetting Password..." : "Reset Password"}
                </Button>
              </form>
            </CardContent>
            
            <CardFooter className="flex justify-center border-t pt-6 dark:border-gray-700">
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Remembered your password?{" "}
                <Link href="/auth/signin" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>
          
          <p className="text-center text-xs text-gray-500 mt-6 dark:text-gray-400">
            Need help? <Link href="/contact" className="hover:underline">Contact Support</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
