'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, Check, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PhoneVerificationFormProps {
  onSuccess?: () => void;
  currentPhone?: string;
}

const PhoneVerificationForm: React.FC<PhoneVerificationFormProps> = ({ 
  onSuccess,
  currentPhone = ''
}) => {
  // States for form inputs
  const [phoneNumber, setPhoneNumber] = useState(currentPhone || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [channel, setChannel] = useState<'sms' | 'whatsapp'>('sms');
  
  // UI states
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { data: session, status, update } = useSession();

  useEffect(() => {
    if (currentPhone) {
      setPhoneNumber(currentPhone);
    }
  }, [currentPhone]);

  // Handle sending OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/send-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: phoneNumber, 
          channel,
          userId: session?.user?.id // Include user ID if available
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send verification code');
      }
      
      setStep('verify');
      setSuccess(`Verification code sent via ${channel === 'sms' ? 'SMS' : 'WhatsApp'}`);
      toast.success(`Verification code sent to ${phoneNumber}`);
      
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
      toast.error(err.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/verify-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: phoneNumber, 
          code: verificationCode,
          userId: session?.user?.id // Include user ID if available
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify code');
      }
      
      setSuccess('Phone number verified successfully!');
      toast.success('Phone number verified successfully!');
      
      // Update session to include phone number if user is logged in with Google
      if (session?.user) {
        await update({ phone: phoneNumber });
      }
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset form after success
      setStep('phone');
      setVerificationCode('');
      
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      toast.error(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    setError(null);
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/send-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: phoneNumber, 
          channel,
          userId: session?.user?.id // Include user ID if available
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend verification code');
      }
      
      setSuccess(`Verification code resent via ${channel === 'sms' ? 'SMS' : 'WhatsApp'}`);
      toast.success(`Verification code resent to ${phoneNumber}`);
      
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code');
      toast.error(err.message || 'Failed to resend verification code');
    } finally {
      setIsLoading(false);
    }
  };

  // Go back to phone input step
  const handleBackToPhone = () => {
    setStep('phone');
    setVerificationCode('');
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="space-y-4">
      {/* Phone Number Input Step */}
      {step === 'phone' && (
        <form onSubmit={handleSendOTP} className="space-y-4">
          {error && (
            <div className="flex items-center p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="flex items-center p-3 text-sm text-green-700 bg-green-50 rounded-md border border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800">
              <Check className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="verification-channel" className="text-sm font-medium">Verification Method</Label>
            <Select
              value={channel}
              onValueChange={(value) => setChannel(value as 'sms' | 'whatsapp')}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select verification method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone-number" className="text-sm font-medium">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                id="phone-number"
                type="tel"
                placeholder="+91 9876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-gray-500">
              Enter your phone number with country code
            </p>
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !phoneNumber.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Verification Code'
            )}
          </Button>
          
          {(session?.user as any)?.provider === 'google' && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              This will link your phone number to your Google account
            </p>
          )}
        </form>
      )}

      {/* Verification Code Input Step */}
      {step === 'verify' && (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          {error && (
            <div className="flex items-center p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="flex items-center p-3 text-sm text-green-700 bg-green-50 rounded-md border border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800">
              <Check className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="verification-code" className="text-sm font-medium">Verification Code</Label>
              <button 
                type="button"
                onClick={handleBackToPhone}
                className="text-xs text-primary hover:underline"
                disabled={isLoading}
              >
                Change phone number
              </button>
            </div>
            <Input
              id="verification-code"
              type="text"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="text-center text-lg tracking-widest"
              maxLength={6}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Enter the 6-digit code sent to {phoneNumber}
            </p>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || verificationCode.length !== 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Code'
              )}
            </Button>
            
            <Button 
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResendOTP}
              disabled={isLoading}
            >
              Resend Code
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PhoneVerificationForm;