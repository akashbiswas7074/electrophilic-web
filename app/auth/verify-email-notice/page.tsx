'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MailCheck, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useWebsiteLogo } from '@/hooks/use-website-logo';

export default function VerifyEmailNoticePage() {
  const { logo, isLoading: logoLoading } = useWebsiteLogo();
  
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-950 dark:to-gray-800">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-gray-400/20 to-gray-500/20 blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-gray-500/20 to-gray-600/20 blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 rounded-full bg-gradient-to-br from-gray-400/20 to-gray-300/20 blur-3xl"></div>
      </div>

      {/* Left column - Enhanced Brand/Image section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=&quot;60&quot; height=&quot;60&quot; viewBox=&quot;0 0 60 60&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cg fill=&quot;none&quot; fill-rule=&quot;evenodd&quot;%3E%3Cg fill=&quot;%23ffffff&quot; fill-opacity=&quot;0.1&quot;%3E%3Ccircle cx=&quot;30&quot; cy=&quot;30&quot; r=&quot;2&quot;/&gt;%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-white h-full">
          <div className="animate-fade-in">
            <div className="flex items-center mb-8">
              <Image 
                src={logo?.mobileLogoUrl || logo?.logoUrl || "/logo-white.png"} 
                alt={logo?.altText || "Company Logo"} 
                width={200} 
                height={60}
                className="drop-shadow-lg"
              />
              <Sparkles className="ml-3 h-8 w-8 text-gray-300 animate-pulse" />
            </div>
            
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
              Verify Your Email
            </h1>
            <p className="text-xl opacity-90 mb-8 leading-relaxed">
              Thank you for registering with {logo?.name || "VibeCart"}. Please check your email to verify your account and start your shopping journey.
            </p>
            
            <div className="grid grid-cols-1 gap-6 mb-8">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mr-4">
                  <span className="text-2xl">📧</span>
                </div>
                <div>
                  <div className="font-semibold">Check Your Inbox</div>
                  <div className="text-sm opacity-80">Verification email sent</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mr-4">
                  <span className="text-2xl">🔐</span>
                </div>
                <div>
                  <div className="font-semibold">Secure Account</div>
                  <div className="text-sm opacity-80">Enhanced security protection</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mr-4">
                  <span className="text-2xl">🛍️</span>
                </div>
                <div>
                  <div className="font-semibold">Start Shopping</div>
                  <div className="text-sm opacity-80">Access exclusive offers</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-auto animate-slide-up">
            <div className="p-8 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shadow-2xl">
              <div className="flex items-start mb-4">
                <div className="flex -space-x-1 mr-4">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className="w-3 h-3 rounded-full bg-gray-300"></div>
                  ))}
                </div>
                <div className="text-sm opacity-90">5.0/5.0</div>
              </div>
              <p className="italic text-lg mb-4 leading-relaxed">
                "{logo?.name || "VibeCart"} offers a secure and seamless shopping experience. I love how they prioritize account security with email verification!"
              </p>
              <div className="flex items-center">
                <div className="rounded-full bg-gradient-to-br from-white to-gray-200 h-12 w-12 flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-gray-700 font-bold text-lg">EB</span>
                </div>
                <div>
                  <p className="font-semibold text-lg">Emma Brown</p>
                  <p className="text-sm opacity-80">Verified {logo?.name || "VibeCart"} Customer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right column - Enhanced Content section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile logo section */}
          <div className="text-center mb-8 lg:hidden animate-fade-in">
            <Image 
              src={logo?.logoUrl || "/logo.png"} 
              alt={logo?.altText || "Company Logo"} 
              width={160} 
              height={50}
              className="mx-auto mb-4 drop-shadow-md"
            />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Check Your Email</h1>
          </div>
          
          <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl relative overflow-hidden animate-slide-up">
            {/* Card decoration */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-600 via-gray-500 to-gray-700"></div>
            
            <CardHeader className="text-center pb-6">
              <div className="mx-auto bg-gray-100 dark:bg-gray-700 rounded-full p-4 w-fit mb-4 shadow-lg">
                <MailCheck className="w-12 h-12 text-gray-600 dark:text-gray-300" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Check Your Email
              </CardTitle>
              <CardDescription className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                We've sent a verification link to your email address. Please click the link to activate your account and start shopping.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="text-center space-y-6 px-8">
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What's Next?</h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>1. Check your email inbox</p>
                  <p>2. Click the verification link</p>
                  <p>3. Sign in to your account</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Didn't receive the email? Check your spam folder or contact support for assistance.
              </p>
              
              <div className="space-y-3">
                <Button 
                  asChild 
                  className="w-full h-12 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
                >
                  <Link href="/auth/signin">Return to Sign In</Link>
                </Button>
                
                <Button 
                  asChild 
                  variant="outline"
                  className="w-full h-12 border-2 border-gray-200 hover:border-gray-300 font-semibold rounded-xl transition-all duration-200"
                >
                  <Link href="/contact">Contact Support</Link>
                </Button>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-center border-t border-gray-200 dark:border-gray-700 pt-8 pb-8">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Need help? <Link href="/contact" className="font-semibold text-gray-700 hover:text-gray-900 transition-colors hover:underline">Contact Support</Link>
              </p>
            </CardFooter>
          </Card>
          
          <p className="text-center text-xs text-gray-500 mt-8 dark:text-gray-400 leading-relaxed">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-gray-600 hover:underline">Terms of Service</Link> and{' '}
            <Link href="/privacy" className="text-gray-600 hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
