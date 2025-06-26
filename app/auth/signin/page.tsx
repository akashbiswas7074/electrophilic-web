'use client';

import { useState, Suspense, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, LogIn, Mail, Lock, AlertCircle, CheckCircle, Phone, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PhoneLoginForm from '@/components/shared/auth/PhoneLoginForm';
import { useWebsiteLogo } from '@/hooks/use-website-logo';

function SignInFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/';
  const error = searchParams?.get('error');
  const trigger = searchParams?.get('trigger');
  const verified = searchParams?.get('verified');
  const initialEmail = searchParams?.get('email') || '';
  const initialTab = searchParams?.get('tab') || 'email';
  const { logo, isLoading: logoLoading } = useWebsiteLogo();

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(error ? getErrorMessage(error) : null);
  const [successMessage, setSuccessMessage] = useState<string | null>(verified ? 'Email verified successfully! Please sign in.' : null);

  // Check for Google trigger parameter and redirect if present
  useEffect(() => {
    if (trigger === 'google') {
      toast.info('This account uses Google authentication. Redirecting to Google sign-in...');
      setTimeout(() => {
        signIn('google', { callbackUrl });
      }, 1000);
    }
  }, [trigger, callbackUrl]);

  // Clear messages when user starts typing
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setFormError(null);
    setSuccessMessage(null);
  };

  // Handle form submission with credentials
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setFormError(null);
    setSuccessMessage(null);

    try {
      const result = await signIn('credentials', {
        redirect: false, // Handle redirect manually
        email,
        password,
        callbackUrl,
      });

      if (result?.error) {
        console.error("Sign-in error:", result.error);
        
        // If error is UseGoogleLogin or OAuthAccountNotLinked, automatically redirect to Google signin
        if (result.error === "UseGoogleLogin" || result.error === "OAuthAccountNotLinked") {
          toast.info('Redirecting to Google login...');
          // Small delay to show the toast before redirecting
          setTimeout(() => {
            signIn('google', { callbackUrl });
          }, 500);
          return;
        }
        
        setFormError(getErrorMessage(result.error));
        toast.error(getErrorMessage(result.error)); // Show toast notification
      } else if (result?.ok && result.url) {
        toast.success('Signed in successfully!');
        router.push(result.url); // Redirect on success
      } else {
        // Handle unexpected cases
        setFormError('An unexpected error occurred. Please try again.');
        toast.error('An unexpected error occurred.');
      }
    } catch (error) {
      console.error("Sign-in exception:", error);
      setFormError('An error occurred during sign in. Please try again.');
      toast.error('Sign-in failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google sign-in with better error handling
  const handleGoogleSignIn = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsLoading(true);
    
    try {
      toast.info('Redirecting to Google sign-in...');
      await signIn('google', { 
        callbackUrl,
        redirect: false 
      });
      // Note: The actual redirect will be handled by NextAuth
    } catch (error) {
      console.error("Google sign-in error:", error);
      setFormError('Failed to initiate Google sign-in. Please try again.');
      toast.error('Google sign-in failed.');
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

      {/* Left column - Enhanced Image/Brand section */}
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
              Welcome Back!
            </h1>
            <p className="text-xl opacity-90 mb-8 leading-relaxed">
              Sign in to access your account and continue your shopping experience with {logo?.name || "VibeCart"}.
            </p>
            
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold">50K+</div>
                <div className="text-sm opacity-80">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">4.9★</div>
                <div className="text-sm opacity-80">Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">99%</div>
                <div className="text-sm opacity-80">Satisfaction</div>
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
                "Shopping at {logo?.name || "VibeCart"} has been an amazing experience. Their user-friendly platform and exceptional customer service make online shopping a breeze."
              </p>
              <div className="flex items-center">
                <div className="rounded-full bg-gradient-to-br from-white to-gray-200 h-12 w-12 flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-gray-700 font-bold text-lg">JS</span>
                </div>
                <div>
                  <p className="font-semibold text-lg">John Smith</p>
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back!</h1>
          </div>
          
          <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl relative overflow-hidden animate-slide-up">
            {/* Card decoration */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-600 via-gray-500 to-gray-700"></div>
            
            <CardHeader className="space-y-2 text-center pb-6">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Sign In
              </CardTitle>
              <CardDescription className="text-base text-gray-600 dark:text-gray-400">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-8">
              <Tabs defaultValue={initialTab === 'phone' ? 'phone' : 'email'}>
                <TabsList className="grid grid-cols-2 mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                  <TabsTrigger value="email" className="flex items-center gap-2 rounded-lg transition-all duration-200">
                    <Mail className="h-4 w-4" />
                    <span className="font-medium">Email</span>
                  </TabsTrigger>
                  <TabsTrigger value="phone" className="flex items-center gap-2 rounded-lg transition-all duration-200">
                    <Phone className="h-4 w-4" />
                    <span className="font-medium">Phone</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="email" className="space-y-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {formError && (
                      <div className="flex items-center p-4 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800 animate-shake">
                        <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                        <span>{formError}</span>
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
                          onChange={handleInputChange(setEmail)}
                          required
                          className="pl-12 h-12 border-2 border-gray-200 focus:border-gray-500 rounded-xl transition-all duration-200 bg-white/50 dark:bg-gray-800/50"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Password
                        </Label>
                        <Link 
                          href="/auth/forgot-password" 
                          className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors hover:underline"
                        >
                          Forgot Password?
                        </Link>
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={handleInputChange(setPassword)}
                          required
                          className="pl-12 pr-12 h-12 border-2 border-gray-200 focus:border-gray-500 rounded-xl transition-all duration-200 bg-white/50 dark:bg-gray-800/50"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full h-12 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Signing In...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          Sign In
                          <LogIn className="h-5 w-5" />
                        </div>
                      )}
                    </Button>
                  </form>

                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-300 dark:border-gray-600"></span>
                    </div>
                    <div className="relative flex justify-center text-sm uppercase font-medium">
                      <span className="bg-white/80 dark:bg-gray-800/80 px-4 text-gray-500 dark:text-gray-400 backdrop-blur-sm">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-gray-300 font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-md"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <div className="flex items-center gap-3">
                      <Image
                        src="/google.svg" 
                        alt="Google"
                        width={24}
                        height={24}
                      />
                      {isLoading ? 'Signing in...' : 'Sign in with Google'}
                    </div>
                  </Button>
                </TabsContent>
                
                <TabsContent value="phone">
                  <PhoneLoginForm redirectUrl={callbackUrl} />
                </TabsContent>
              </Tabs>
            </CardContent>
            
            <CardFooter className="flex justify-center border-t border-gray-200 dark:border-gray-700 pt-8 pb-8">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <Link 
                  href="/auth/signup" 
                  className="font-semibold text-gray-700 hover:text-gray-900 transition-colors hover:underline"
                >
                  Create Account
                </Link>
              </p>
            </CardFooter>
          </Card>
          
          <p className="text-center text-xs text-gray-500 mt-8 dark:text-gray-400 leading-relaxed">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-gray-600 hover:underline">Terms of Service</Link> and{' '}
            <Link href="/privacy" className="text-gray-600 hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper function to provide user-friendly error messages
function getErrorMessage(error: string): string {
  switch (error) {
    case 'CredentialsSignin':
      return 'Invalid email or password. Please try again.';
    case 'UseGoogleLogin':
      return 'This email is registered with Google. Please use the "Sign In with Google" button instead.';
    case 'UsePhoneLogin':
      return 'This email is associated with a phone login. Please use the Phone tab to sign in.';
    case 'OAuthAccountNotLinked':
      return 'This email is already associated with another sign-in method.';
    case 'EmailCreateAccount':
      return 'Could not create account. Please try again.';
    case 'Callback':
      return 'There was an issue during the sign-in process. Please try again.';
    default:
      return 'Sign in failed. Please check your credentials or try another method.';
  }
}

// Enhanced loading component
export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 rounded-full animate-pulse"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <SignInFormContent />
    </Suspense>
  );
}
