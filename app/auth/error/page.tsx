'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import Image from 'next/image';

function ErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    const getErrorMessage = (errorCode: string | null): string => {
        switch (errorCode) {
            case 'Configuration':
                return 'There is a problem with the server configuration.';
            case 'AccessDenied':
                return 'You do not have permission to sign in.';
            case 'Verification':
                // This could be triggered by an invalid token, expired token, or already used token
                return 'The sign-in link is no longer valid. It may have expired or already been used.';
            case 'UseGoogleLogin':
                return 'This email is registered with Google. Please use the Google sign-in option instead.';
            case 'UsePhoneLogin':
                return 'This account uses phone authentication. Please use the Phone sign-in option instead.';
            case 'OAuthSignin':
            case 'OAuthCallback':
            case 'OAuthCreateAccount':
            case 'EmailCreateAccount':
            case 'Callback':
                return 'There was an error during the sign-in process. Please try again.';
            case 'OAuthAccountNotLinked':
                return 'This email is already linked with another provider. Try signing in with that provider.';
            case 'EmailSignin':
                return 'Failed to send the sign-in email. Please try again.';
            case 'CredentialsSignin':
                return 'Sign in failed. Check the details you provided are correct.';
            case 'SessionRequired':
                return 'Please sign in to access this page.';
            case 'Invalid or expired verification link': // Custom error from verify-email route
                return 'The email verification link is invalid or has expired.';
            case 'Verification token missing': // Custom error from verify-email route
                return 'The email verification link is incomplete.';
            case 'Verification failed': // Custom error from verify-email route
                return 'An error occurred during email verification.';
            default:
                return 'An unexpected error occurred during authentication.';
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
                            src="/logo-white.png" 
                            alt="VibeCart Logo" 
                            width={180} 
                            height={50}
                            className="mb-8"
                        />
                        <h1 className="text-4xl font-bold mb-6">Authentication Error</h1>
                        <p className="text-lg opacity-80 mb-6">
                            We encountered an issue with your authentication request. Let's get you back on track.
                        </p>
                    </div>
                    <div className="mt-auto">
                        <div className="p-6 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm">
                            <p className="italic text-sm mb-3">"Even the best systems encounter occasional hiccups. What matters is how quickly issues are resolved, and VibeCart always delivers excellent customer service."</p>
                            <div className="flex items-center">
                                <div className="rounded-full bg-white h-10 w-10 flex items-center justify-center mr-3">
                                    <span className="text-primary font-bold">DM</span>
                                </div>
                                <div>
                                    <p className="font-medium">Daniel Miller</p>
                                    <p className="text-xs opacity-80">Tech Enthusiast</p>
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
                            src="/logo.png" 
                            alt="VibeCart Logo" 
                            width={150} 
                            height={40}
                            className="mx-auto mb-6"
                        />
                    </div>
                    
                    <Card className="border-none shadow-lg dark:bg-gray-800">
                        <CardHeader className="text-center">
                            <div className="mx-auto bg-red-100 rounded-full p-3 w-fit dark:bg-red-900/30">
                                <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
                            </div>
                            <CardTitle className="text-2xl font-bold mt-4">Authentication Error</CardTitle>
                            <CardDescription>{getErrorMessage(error)}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                This may be due to an expired session, invalid credentials, or a system issue.
                            </p>
                            <div className="flex flex-col space-y-2">
                                <Button asChild>
                                    <Link href="/auth/signin">Return to Sign In</Link>
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href="/">Go to Homepage</Link>
                                </Button>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-center border-t pt-6 dark:border-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Need help? <Link href="/contact" className="font-medium text-primary hover:underline">Contact Support</Link>
                            </p>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function AuthErrorPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        }>
            <ErrorContent />
        </Suspense>
    );
}
