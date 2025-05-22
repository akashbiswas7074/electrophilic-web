'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

// Form validation schema
const addressSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  address1: z.string().min(1, { message: 'Address line 1 is required' }),
  address2: z.string().optional(),
  city: z.string().min(1, { message: 'City is required' }),
  state: z.string().min(1, { message: 'State is required' }),
  zipCode: z.string().min(1, { message: 'ZIP code is required' }),
  country: z.string().min(1, { message: 'Country is required' }),
  phoneNumber: z.string().min(1, { message: 'Phone number is required' }),
  isDefault: z.boolean(),
});

type AddressFormValues = {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phoneNumber: string;
  isDefault: boolean;
}

interface AddressFormProps {
  address?: any; // Optional: for editing existing address
  onSuccess: (address: any) => void;
  onCancel: () => void;
}

const AddressForm: React.FC<AddressFormProps> = ({ 
  address, 
  onSuccess,
  onCancel
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Initialize the form with default values or existing address
  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      firstName: address?.firstName || '',
      lastName: address?.lastName || '',
      address1: address?.address1 || '',
      address2: address?.address2 || '',
      city: address?.city || '',
      state: address?.state || '',
      zipCode: address?.zipCode || '',
      country: address?.country || '',
      phoneNumber: address?.phoneNumber || '',
      isDefault: address?.isDefault ?? false,
    },
  });

  async function onSubmit(data: AddressFormValues) {
    setIsLoading(true);
    try {
      // Determine if we're creating a new address or updating an existing one
      const method = address?._id ? 'PUT' : 'POST';
      const body = address?._id 
        ? { ...data, addressId: address._id, action: 'update' } 
        : data;

      const response = await fetch('/api/user/address', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Add credentials to include cookies
        body: JSON.stringify(body),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to save address');
      }

      toast.success(address?._id ? 'Address updated successfully' : 'Address added successfully');

      // Pass the new/updated address back to the parent component
      onSuccess(responseData.address);
    } catch (error: any) {
      console.error('Error saving address:', error);
      toast.error(error.message || 'Failed to save address');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="First Name" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Last Name */}
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Last Name" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Address Line 1 */}
        <FormField
          control={form.control}
          name="address1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address Line 1</FormLabel>
              <FormControl>
                <Input placeholder="Street address" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Address Line 2 */}
        <FormField
          control={form.control}
          name="address2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address Line 2 (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Apartment, suite, unit, etc." {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* City */}
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="City" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* State */}
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input placeholder="State/Province" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ZIP Code */}
          <FormField
            control={form.control}
            name="zipCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ZIP/Postal Code</FormLabel>
                <FormControl>
                  <Input placeholder="ZIP/Postal Code" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Country */}
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input placeholder="Country" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Phone Number */}
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="Phone Number" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Default Address Checkbox */}
        <FormField
          control={form.control}
          name="isDefault"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Set as default address</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : address?._id ? 'Update Address' : 'Add Address'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddressForm;