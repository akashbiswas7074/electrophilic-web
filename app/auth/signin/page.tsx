'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, LogIn, Mail, Lock, AlertCircle, CheckCircle, Phone } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PhoneLoginForm from '@/components/shared/auth/PhoneLoginForm';
import { useWebsiteLogo } from '@/hooks/use-website-logo';

function SignInFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');
  const verified = searchParams.get('verified');
  const initialEmail = searchParams.get('email') || '';
  const initialTab = searchParams.get('tab') || 'email';
  const { logo, isLoading: logoLoading } = useWebsiteLogo();

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(error ? getErrorMessage(error) : null);
  const [successMessage, setSuccessMessage] = useState<string | null>(verified ? 'Email verified successfully! Please sign in.' : null);

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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl });
      // Redirect is handled by NextAuth for OAuth
    } catch (error) {
      console.error("Google sign-in error:", error);
      setFormError('Failed to initiate Google Sign-In.');
      toast.error('Google Sign-In failed.');
      setIsLoading(false);
    }
    // No need for finally setIsLoading(false) here as the page will redirect
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Left column - Image/Brand section */}
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
            <h1 className="text-4xl font-bold mb-6">Welcome Back!</h1>
            <p className="text-lg opacity-80 mb-6">
              Sign in to access your account and continue your shopping experience with {logo?.name || "VibeCart"}.
            </p>
          </div>
          <div className="mt-auto">
            <div className="p-6 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm">
              <p className="italic text-sm mb-3">"Shopping at {logo?.name || "VibeCart"} has been an amazing experience. Their user-friendly platform and exceptional customer service make online shopping a breeze."</p>
              <div className="flex items-center">
                <div className="rounded-full bg-white h-10 w-10 flex items-center justify-center mr-3">
                  <span className="text-primary font-bold">JS</span>
                </div>
                <div>
                  <p className="font-medium">John Smith</p>
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
              <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
              <CardDescription>Enter your credentials to access your account</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={initialTab === 'phone' ? 'phone' : 'email'}>
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </TabsTrigger>
                  <TabsTrigger value="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>Phone</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="email">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {formError && (
                      <div className="flex items-center p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800">
                        <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                        <span>{formError}</span>
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
                          onChange={handleInputChange(setEmail)}
                          required
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                        <Link href="/auth/forgot-password" className="text-xs font-medium text-primary hover:underline">
                          Forgot Password?
                        </Link>
                      </div>
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
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Signing In...' : 'Sign In'}
                      {!isLoading && <LogIn className="ml-2 h-4 w-4" />}
                    </Button>
                  </form>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t dark:border-gray-700"></span>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500 dark:bg-gray-800 dark:text-gray-400">Or continue with</span>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-center gap-2" 
                    onClick={handleGoogleSignIn} 
                    disabled={isLoading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                      <path fill="#EA4335" d="M12 5.04c2.17 0 4.1.89 5.5 2.3l3.5-3.5C18.73 1.56 15.55 0 12 0 7.31 0 3.23 2.7 1.24 6.67l4.07 3.16C6.42 7.1 9 5.04 12 5.04z"></path>
                      <path fill="#4285F4" d="M23.54 12.27c0-.96-.08-1.9-.25-2.8H12v5.22h6.44c-.26 1.56-1.1 2.9-2.37 3.78v3.13h3.84C22.12 19.39 23.54 16.13 23.54 12.27z"></path>
                      <path fill="#FBBC05" d="M5.3 14.67l-4.07 3.16C2.24 21.8 6.8 24 12 24c3.2 0 5.9-1.06 7.86-2.87l-3.84-3.13c-1.08.72-2.46 1.16-4.02 1.16-3.1 0-5.73-2.1-6.67-4.92H5.3v.43z"></path>
                      <path fill="#34A853" d="M12 24c5.04 0 9.27-1.62 12-4.87l-5.04-4.02c-1.4.94-3.19 1.5-5.04 1.5-3.87 0-7.15-2.61-8.33-6.12H.06v4.13C3.05 21.29 7.2 24 12 24z"></path>
                    </svg>
                    {isLoading ? 'Redirecting...' : 'Sign In with Google'}
                  </Button>
                </TabsContent>
                
                <TabsContent value="phone">
                  <PhoneLoginForm redirectUrl={callbackUrl} />
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-6 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="font-medium text-primary hover:underline">
                  Create Account
                </Link>
              </p>
            </CardFooter>
          </Card>
          
          <p className="text-center text-xs text-gray-500 mt-6 dark:text-gray-400">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="hover:underline">Terms of Service</Link> and{' '}
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>.
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
    case 'OAuthAccountNotLinked':
      // This error might occur if a user tries to sign in with Google after signing up with email/password
      // Or vice-versa. You might want to guide them on how to link accounts if you implement that.
      return 'This email is already associated with another sign-in method.';
    case 'EmailCreateAccount': // Example custom error from authorize
      return 'Could not create account. Please try again.';
    case 'Callback':
      return 'There was an issue during the sign-in process. Please try again.';
    // Add more specific NextAuth errors as needed
    // https://next-auth.js.org/configuration/pages#error-page
    default:
      return 'Sign in failed. Please check your credentials or try another method.';
  }
}

// Wrap with Suspense for useSearchParams
export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <SignInFormContent />
    </Suspense>
  );
}
