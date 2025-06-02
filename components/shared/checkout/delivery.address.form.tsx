import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React from "react";
import { useFormStatus } from "react-dom";

const DeliveryAddressForm = ({ form }: { form: any }) => {
  const { pending } = useFormStatus();
  const phoneValue = form.values.phone || "";

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Delivery Address</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName">First Name <span className="text-red-500">*</span></label>
          <Input
            id="firstName"
            placeholder="First Name"
            {...form.getInputProps("firstName")}
            required
          />
          {form.errors.firstName && (
            <p className="text-red-500 text-sm mt-1">{form.errors.firstName}</p>
          )}
        </div>
        <div>
          <label htmlFor="lastName">Last Name <span className="text-red-500">*</span></label>
          <Input
            id="lastName"
            placeholder="Last Name"
            {...form.getInputProps("lastName")}
            required
          />
          {form.errors.lastName && (
            <p className="text-red-500 text-sm mt-1">{form.errors.lastName}</p>
          )}
        </div>
      </div>
      <div>
        <label htmlFor="phone">Phone Number <span className="text-red-500">*</span></label>
        <Input
          id="phone"
          placeholder={phoneValue ? phoneValue : "Phone Number"}
          {...form.getInputProps("phone")}
          required
        />
        {form.errors.phone && (
          <p className="text-red-500 text-sm mt-1">{form.errors.phone}</p>
        )}
        {phoneValue && (
          <p className="text-xs text-gray-500 mt-1">Using your registered phone number</p>
        )}
      </div>
      <div>
        <label htmlFor="state">State <span className="text-red-500">*</span></label>
        <Input
          id="state"
          placeholder="State"
          {...form.getInputProps("state")}
          required
        />
        {form.errors.state && (
          <p className="text-red-500 text-sm mt-1">{form.errors.state}</p>
        )}
      </div>
      <div>
        <label htmlFor="city">City <span className="text-red-500">*</span></label>
        <Input
          id="city"
          placeholder="City"
          {...form.getInputProps("city")}
          required
        />
        {form.errors.city && (
          <p className="text-red-500 text-sm mt-1">{form.errors.city}</p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="zipCode">Zip Code / Postal Code <span className="text-red-500">*</span></label>
          <Input
            id="zipCode"
            placeholder="Zip Code / Postal Code"
            {...form.getInputProps("zipCode")}
            required
          />
          {form.errors.zipCode && (
            <p className="text-red-500 text-sm mt-1">{form.errors.zipCode}</p>
          )}
        </div>
      </div>
      <div>
        <label htmlFor="address1">Street Address <span className="text-red-500">*</span></label>
        <Input
          id="address1"
          placeholder="Street Address"
          {...form.getInputProps("address1")}
          required
        />
        {form.errors.address1 && (
          <p className="text-red-500 text-sm mt-1">{form.errors.address1}</p>
        )}
      </div>
      <div>
        <label htmlFor="address2">Address 2 (Optional)</label>
        <Input
          id="address2"
          placeholder="Apartment, suite, etc. (optional)"
          {...form.getInputProps("address2")}
        />
      </div>
      <div>
        <label htmlFor="country">Country <span className="text-red-500">*</span></label>
        <Input
          id="country"
          placeholder="Country"
          {...form.getInputProps("country")}
          required
        />
        {form.errors.country && (
          <p className="text-red-500 text-sm mt-1">{form.errors.country}</p>
        )}
      </div>
      <Button type="submit" className="w-full mt-4" disabled={pending}>
        {pending ? "Submitting..." : "Submit"}
      </Button>
    </div>
  );
};

export default DeliveryAddressForm;
