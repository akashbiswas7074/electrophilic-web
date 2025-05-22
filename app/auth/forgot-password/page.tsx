'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, AlertCircle, CheckCircle, Send, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { useWebsiteLogo } from '@/hooks/use-website-logo';

export default function ForgotPasswordPage() {
  const { logo, isLoading: logoLoading } = useWebsiteLogo();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to send reset link. Please try again.');
        toast.error(data.message || 'Failed to send reset link.');
      } else {
        setSuccessMessage(data.message || 'If an account exists, a password reset link has been sent.');
        toast.success(data.message || 'Password reset link sent (if account exists).');
        setEmail(''); // Clear email field on success
      }
    } catch (err) {
      console.error('Forgot password exception:', err);
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
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
          <div className="mt-auto">
            <div className="p-6 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm">
              <p className="italic text-sm mb-3">"I forgot my password once, and {logo?.name || "VibeCart"}'s reset process was quick and hassle-free. I was back to shopping in no time!"</p>
              <div className="flex items-center">
                <div className="rounded-full bg-white h-10 w-10 flex items-center justify-center mr-3">
                  <span className="text-primary font-bold">RJ</span>
                </div>
                <div>
                  <p className="font-medium">Robert Johnson</p>
                  <p className="text-xs opacity-80">{logo?.name || "VibeCart"} Customer</p>
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
                <KeyRound className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold mt-4">Forgot Password</CardTitle>
              <CardDescription>Enter your email to receive a password reset link</CardDescription>
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
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={handleInputChange}
                      required
                      className="pl-10"
                      disabled={isLoading || !!successMessage}
                    />
                  </div>
                </div>
                {!successMessage && (
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Sending Link...' : 'Send Reset Link'}
                    {!isLoading && <Send className="ml-2 h-4 w-4" />}
                  </Button>
                )}
              </form>
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-6 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Remember your password?{' '}
                <Link href="/auth/signin" className="font-medium text-primary hover:underline">
                  Sign In
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
