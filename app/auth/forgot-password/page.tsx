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
            </div>
            
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
              Reset Your Password
            </h1>
            <p className="text-xl opacity-90 mb-8 leading-relaxed">
              Enter your email address and we'll send you a secure link to reset your password and get you back to shopping.
            </p>
            
            <div className="grid grid-cols-1 gap-6 mb-8">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mr-4">
                  <span className="text-2xl">🔐</span>
                </div>
                <div>
                  <div className="font-semibold">Secure Process</div>
                  <div className="text-sm opacity-80">Safe and encrypted reset</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mr-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <div className="font-semibold">Quick Recovery</div>
                  <div className="text-sm opacity-80">Get back to shopping fast</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mr-4">
                  <span className="text-2xl">📧</span>
                </div>
                <div>
                  <div className="font-semibold">Email Link</div>
                  <div className="text-sm opacity-80">Reset link sent instantly</div>
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
                "I forgot my password once, and {logo?.name || "VibeCart"}'s reset process was quick and hassle-free. I was back to shopping in no time!"
              </p>
              <div className="flex items-center">
                <div className="rounded-full bg-gradient-to-br from-white to-gray-200 h-12 w-12 flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-gray-700 font-bold text-lg">RJ</span>
                </div>
                <div>
                  <p className="font-semibold text-lg">Robert Johnson</p>
                  <p className="text-sm opacity-80">Verified {logo?.name || "VibeCart"} Customer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right column - Enhanced Form section */}
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reset Password</h1>
          </div>

          <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl relative overflow-hidden animate-slide-up">
            {/* Card decoration */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-600 via-gray-500 to-gray-700"></div>
            
            <CardHeader className="space-y-2 text-center pb-6">
              <div className="mx-auto bg-gray-100 dark:bg-gray-700 rounded-full p-4 w-fit mb-4 shadow-lg">
                <KeyRound className="w-12 h-12 text-gray-600 dark:text-gray-300" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Forgot Password
              </CardTitle>
              <CardDescription className="text-base text-gray-600 dark:text-gray-400">
                Enter your email to receive a password reset link
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="flex items-center p-4 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800 animate-shake">
                    <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                {successMessage && (
                  <div className="flex items-center p-4 text-sm text-green-700 bg-green-50 rounded-xl border border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800 animate-bounce">
                    <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}
                
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Email Address
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={handleInputChange}
                      required
                      className="pl-12 h-12 border-2 border-gray-200 focus:border-gray-500 rounded-xl transition-all duration-200 bg-white/50 dark:bg-gray-800/50"
                      disabled={isLoading || !!successMessage}
                    />
                  </div>
                </div>
                
                {!successMessage ? (
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Sending Link...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        Send Reset Link
                        <Send className="h-5 w-5" />
                      </div>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Button 
                      asChild 
                      className="w-full h-12 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      <Link href="/auth/signin">Return to Sign In</Link>
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
            
            <CardFooter className="flex justify-center border-t border-gray-200 dark:border-gray-700 pt-8 pb-8">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Remember your password?{' '}
                <Link href="/auth/signin" className="font-semibold text-gray-700 hover:text-gray-900 transition-colors hover:underline">
                  Sign In
                </Link>
              </p>
            </CardFooter>
          </Card>

          <p className="text-center text-xs text-gray-500 mt-8 dark:text-gray-400 leading-relaxed">
            Need help? <Link href="/contact" className="text-gray-600 hover:underline">Contact Support</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
