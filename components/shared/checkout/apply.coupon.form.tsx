import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";
import { useFormStatus } from "react-dom";

const ApplyCouponForm = ({
  setCoupon,
  couponError,
}: {
  setCoupon: any;
  couponError: string;
}) => {
  const { pending } = useFormStatus();

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Apply Coupon</h2>
      <p className="text-sm text-gray-500 mb-4">
        Enter a coupon code if you have one, or skip this step to continue to payment.
      </p>
      <div className="mb-4">
        <Label htmlFor="coupon">Coupon Code (Optional)</Label>
        <Input
          onChange={(e: any) => setCoupon(e.target.value)}
          id="coupon"
          placeholder="Enter coupon code if available"
        />
      </div>
      <Button type="submit" disabled={pending} className="mb-2 w-full">
        {pending ? "Applying..." : "Apply Coupon & Continue"}
      </Button>
      <div className="text-center text-sm text-gray-500">
        You can skip this step if you don't have a coupon
      </div>
      {couponError && <span className="text-red-500 block mt-2">{couponError}</span>}
    </div>
  );
};

export default ApplyCouponForm;
