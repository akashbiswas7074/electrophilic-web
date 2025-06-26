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
              Join {logo?.name || "VibeCart"} Today
            </h1>
            <p className="text-xl opacity-90 mb-8 leading-relaxed">
              Create an account to enjoy personalized shopping experiences, order tracking, and exclusive offers.
            </p>
            
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold">50K+</div>
                <div className="text-sm opacity-80">Happy Members</div>
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
                "Since creating my {logo?.name || "VibeCart"} account, I've discovered amazing products tailored to my preferences. The seamless checkout process and quick delivery keep me coming back!"
              </p>
              <div className="flex items-center">
                <div className="rounded-full bg-gradient-to-br from-white to-gray-200 h-12 w-12 flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-gray-700 font-bold text-lg">AM</span>
                </div>
                <div>
                  <p className="font-semibold text-lg">Alice Mitchell</p>
                  <p className="text-sm opacity-80">Verified {logo?.name || "VibeCart"} Member</p>
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Join Us Today!</h1>
          </div>
          
          <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl relative overflow-hidden animate-slide-up">
            {/* Card decoration */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-600 via-gray-500 to-gray-700"></div>
            
            <CardHeader className="space-y-2 text-center pb-6">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Create Account
              </CardTitle>
              <CardDescription className="text-base text-gray-600 dark:text-gray-400">
                Enter your details to get started
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700 dark:text-gray-300">First Name</Label>
                    <div className="relative group">
                      <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={handleInputChange(setFirstName)}
                        required
                        className="pl-12 h-12 border-2 border-gray-200 focus:border-gray-500 rounded-xl transition-all duration-200 bg-white/50 dark:bg-gray-800/50"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Last Name</Label>
                    <div className="relative group">
                      <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={handleInputChange(setLastName)}
                        required
                        className="pl-12 h-12 border-2 border-gray-200 focus:border-gray-500 rounded-xl transition-all duration-200 bg-white/50 dark:bg-gray-800/50"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="username" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Username</Label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="johndoe"
                      value={username}
                      onChange={handleInputChange(setUsername)}
                      required
                      className="pl-12 h-12 border-2 border-gray-200 focus:border-gray-500 rounded-xl transition-all duration-200 bg-white/50 dark:bg-gray-800/50"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email Address</Label>
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
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Password</Label>
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
                  <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Confirm Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={handleInputChange(setConfirmPassword)}
                      required
                      className="pl-12 pr-12 h-12 border-2 border-gray-200 focus:border-gray-500 rounded-xl transition-all duration-200 bg-white/50 dark:bg-gray-800/50"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                      Creating Account...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Create Account
                      <UserPlus className="h-5 w-5" />
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
            
            <CardFooter className="flex justify-center border-t border-gray-200 dark:border-gray-700 pt-8 pb-8">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link 
                  href="/auth/signin" 
                  className="font-semibold text-gray-700 hover:text-gray-900 transition-colors hover:underline"
                >
                  Sign In
                </Link>
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
