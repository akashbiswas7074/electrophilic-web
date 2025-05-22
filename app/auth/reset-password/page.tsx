'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle, RotateCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { useWebsiteLogo } from '@/hooks/use-website-logo';

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { logo, isLoading: logoLoading } = useWebsiteLogo();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing password reset token.');
      toast.error('Invalid or missing password reset token.');
    }
  }, [token, router]);

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!token) {
      setError('Password reset token is missing.');
      toast.error('Password reset token is missing.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      toast.error('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        toast.error('Password must be at least 6 characters long.');
        return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
        credentials: 'include', // Add credentials to include cookies in the request
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to reset password. The link may be invalid or expired.');
        toast.error(data.message || 'Failed to reset password.');
      } else {
        setSuccessMessage(data.message || 'Password reset successfully! You can now sign in.');
        toast.success(data.message || 'Password reset successfully!');
        // Redirect to sign-in page after a short delay
        setTimeout(() => router.push('/auth/signin'), 2000);
      }
    } catch (err) {
      console.error('Reset password exception:', err);
      setError('An unexpected error occurred. Please try again.');
      toast.error('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

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
              <CardTitle className="text-2xl font-bold mt-4">Reset Password</CardTitle>
              <CardDescription>Enter your new password below</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                {successMessage && (
                  <div className="flex items-center p-3 text-sm text-green-700 bg-green-50 rounded-md border border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800">
                    <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}
                {!token && !successMessage && (
                  <div className="flex items-center p-3 text-sm text-yellow-700 bg-yellow-50 rounded-md border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-800">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span>Invalid or missing reset token. Please request a new password reset link.</span>
                  </div>
                )}
                {token && !successMessage && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium">New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={handleInputChange(setPassword)}
                          required
                          className="pl-10 pr-10"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={handleInputChange(setConfirmPassword)}
                          required
                          className="pl-10 pr-10"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading || !token}>
                      {isLoading ? 'Resetting Password...' : 'Reset Password'}
                      {!isLoading && <RotateCw className="ml-2 h-4 w-4" />}
                    </Button>
                  </>
                )}
              </form>
            </CardContent>
            {(successMessage || error) && (
              <CardFooter className="flex justify-center border-t pt-6 dark:border-gray-700">
                <Button asChild variant="outline">
                  <Link href="/auth/signin">Return to Sign In</Link>
                </Button>
              </CardFooter>
            )}
          </Card>
          
          <p className="text-center text-xs text-gray-500 mt-6 dark:text-gray-400">
            Need help? <Link href="/contact" className="hover:underline">Contact Support</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <ResetPasswordFormContent />
    </Suspense>
  );
}
