'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, User as UserIcon, Mail, Lock, AlertCircle, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { useWebsiteLogo } from '@/hooks/use-website-logo';

export default function SignUpPage() {
  const router = useRouter();
  const { logo, isLoading: logoLoading } = useWebsiteLogo();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setError(null); // Clear error on input change
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

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

    if (!firstName.trim() || !lastName.trim()) {
        setError('First name and last name are required.');
        toast.error('First name and last name are required.');
        return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Registration failed. Please try again.');
        toast.error(data.message || 'Registration failed.');
      } else {
        toast.success('Registration successful! Please check your email to verify your account.');
        // Redirect to a page informing the user to check their email
        router.push('/auth/verify-email-notice');
      }
    } catch (err) {
      console.error('Registration exception:', err);
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
            <h1 className="text-4xl font-bold mb-6">Join {logo?.name || "VibeCart"} Today</h1>
            <p className="text-lg opacity-80 mb-6">
              Create an account to enjoy personalized shopping experiences, order tracking, and exclusive offers.
            </p>
          </div>
          <div className="mt-auto">
            <div className="p-6 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm">
              <p className="italic text-sm mb-3">"Since creating my {logo?.name || "VibeCart"} account, I've discovered amazing products tailored to my preferences. The seamless checkout process and quick delivery keep me coming back!"</p>
              <div className="flex items-center">
                <div className="rounded-full bg-white h-10 w-10 flex items-center justify-center mr-3">
                  <span className="text-primary font-bold">AM</span>
                </div>
                <div>
                  <p className="font-medium">Alice Mitchell</p>
                  <p className="text-xs opacity-80">{logo?.name || "VibeCart"} Member</p>
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
              <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
              <CardDescription>Enter your details to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={handleInputChange(setFirstName)}
                        required
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={handleInputChange(setLastName)}
                        required
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                   <div className="relative">
                     <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                     <Input
                        id="username"
                        type="text"
                        placeholder="johndoe"
                        value={username}
                        onChange={handleInputChange(setUsername)}
                        required
                        className="pl-10"
                        disabled={isLoading}
                     />
                  </div>
                </div>
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
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
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
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
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
                <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                  {!isLoading && <UserPlus className="ml-2 h-4 w-4" />}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-6 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link href="/auth/signin" className="font-medium text-primary hover:underline">
                  Sign In
                </Link>
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
