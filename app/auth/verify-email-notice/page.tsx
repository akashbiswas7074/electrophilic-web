'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MailCheck } from 'lucide-react';
import Image from 'next/image';
import { useWebsiteLogo } from '@/hooks/use-website-logo';

export default function VerifyEmailNoticePage() {
  const { logo, isLoading: logoLoading } = useWebsiteLogo();
  
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
            <h1 className="text-4xl font-bold mb-6">Verify Your Email</h1>
            <p className="text-lg opacity-80 mb-6">
              Thank you for registering with {logo?.name || "VibeCart"}. Please check your email to verify your account.
            </p>
          </div>
          <div className="mt-auto">
            <div className="p-6 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm">
              <p className="italic text-sm mb-3">"{logo?.name || "VibeCart"} offers a secure and seamless shopping experience. I love how they prioritize account security with email verification!"</p>
              <div className="flex items-center">
                <div className="rounded-full bg-white h-10 w-10 flex items-center justify-center mr-3">
                  <span className="text-primary font-bold">EB</span>
                </div>
                <div>
                  <p className="font-medium">Emma Brown</p>
                  <p className="text-xs opacity-80">Verified Customer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right column - Content section */}
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
            <CardHeader className="text-center">
              <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit dark:bg-primary/20">
                <MailCheck className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold mt-4">Check Your Email</CardTitle>
              <CardDescription>We've sent a verification link to your email address. Please click the link to activate your account.</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Didn't receive the email? Check your spam folder or request a new link.
              </p>
              <Button asChild className="w-full">
                <Link href="/auth/signin">Return to Sign In</Link>
              </Button>
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-6 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Need help? <Link href="/contact" className="font-medium text-primary hover:underline">Contact Support</Link>
              </p>
            </CardFooter>
          </Card>
          
          <p className="text-center text-xs text-gray-500 mt-6 dark:text-gray-400">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="hover:underline">Terms of Service</Link> and{' '}
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
