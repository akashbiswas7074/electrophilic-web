"use client";

import { useState, useEffect } from "react";
import { useForm } from "@mantine/form";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader, Check, X, Plus, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useCartStore } from "@/store/cart";
import { applyCoupon } from "@/lib/database/actions/user.actions";
import { getUserById } from "@/lib/database/actions/user.actions";
import { getSavedCartForUser } from "@/lib/database/actions/cart.actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert components

// Define interfaces for better type safety
interface Address {
  _id: string;
  address1: string; // Changed from street
  address2?: string; // Added
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string; // Added phoneNumber
}

interface CartProduct {
  _id?: string; // May not be present initially if added client-side
  _uid?: string; // Unique identifier for cart item instance
  product: string; // Product ObjectId as string
  name: string;
  image: string;
  price: number;
  originalPrice?: number; // For calculating savings
  quantity: number;
  qty?: number; // Handle potential inconsistency
  size?: string;
  // Add other relevant product details displayed in summary
}

interface CartData {
  products: CartProduct[];
  cartTotal?: number; // Optional total from backend
}

interface UserData {
  _id: string;
  firstName?: string; // Changed from name
  lastName?: string; // Added
  email?: string;
  phone?: string; // Keep phone if it's a separate field in UserData
  username?: string; // Added username as it's returned by getUserById
  image?: string; // Added image
  // Add other relevant user fields like provider, emailVerified if needed
}

// Define CheckoutData interface matching the backend
interface CheckoutData {
  userId: string;
  cartItems: CartProduct[]; // Use the defined interface
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string; // Added
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string; // Added phone
  };
  paymentMethod: 'cod' | 'razorpay'; // Updated: Only COD or Razorpay
  itemsPrice: number;
  shippingPrice: number;
  taxPrice?: number;
  totalPrice: number;
  couponCode?: string | null;
  discountAmount?: number;
}

export default function CheckoutComponent() {
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<UserData | null>(null); // Use UserData interface
  const [address, setAddress] = useState<Address | null>(null); // Use Address interface
  const [userAddresses, setUserAddresses] = useState<Address[]>([]); // Use Address interface
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [coupon, setCoupon] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<CheckoutData['paymentMethod']>("razorpay"); // Default to Razorpay or COD
  const [couponError, setCouponError] = useState("");
  const [totalAfterDiscount, setTotalAfterDiscount] = useState<number | null>(null); // Store as number
  const [discount, setDiscount] = useState(0);
  const [data, setData] = useState<CartData>({ products: [] }); // Use CartData interface
  const [isLoading, setIsLoading] = useState(true);
  const [subTotal, setSubtotal] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState<number>(0); // Example: Free shipping
  const [taxCost, setTaxCost] = useState<number>(0); // Example: No tax
  const [placeOrderLoading, setPlaceOrderLoading] = useState<boolean>(false);
  const [addAddressLoading, setAddAddressLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Updated form to match profile page address format
  const form = useForm({
    initialValues: {
      address1: "", // Changed from street
      address2: "", // Added
      city: "",
      state: "",
      zipCode: "",
      country: "India",
      isDefault: false,
      firstName: "",
      lastName: "",
      phone: "", // Added phone
    },
    validate: {
      address1: (value) => // Changed from street
        value.trim().length < 5 ? "Street address must be at least 5 characters" : null,
      city: (value) =>
        value.trim().length < 2 ? "City must be at least 2 letters" : null,
      state: (value) =>
        value.trim().length < 2 ? "State must be at least 2 letters" : null,
      zipCode: (value) =>
        /^\d{6}$/.test(value.trim()) ? null : "Zip Code must be 6 digits", // India specific example
      firstName: (value) =>
        value.trim().length < 2 ? "First name must be at least 2 letters" : null,
      lastName: (value) =>
        value.trim().length < 2 ? "Last name must be at least 2 letters" : null,
      phone: (value) => 
        /^\+?[1-9]\d{1,14}$/.test(value.trim()) ? null : "Invalid phone number", // Basic phone validation
    },
  });

  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const router = useRouter();
  const { emptyCart } = useCartStore();

  // --- Data Fetching Effect ---
  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        console.log("[CheckoutComponent] fetchData: No userId, exiting.");
        setIsLoading(false);
        setCheckoutError("Authentication required. Please sign in again.");
        return; 
      }

      console.log(`[CheckoutComponent] Fetching data for userId: ${userId}`); // Log userId
      setIsLoading(true);
      setCheckoutError(null); // Clear errors on reload

      try {
        // Fetch cart, user, and addresses in parallel for efficiency
        const [cartResult, userResult] = await Promise.allSettled([
          getSavedCartForUser(userId),
          getUserById(userId),
        ]);

        // Process Cart Data
        if (cartResult.status === 'fulfilled' && cartResult.value?.success && cartResult.value.cart) {
          const cartData = cartResult.value.cart;
          setData(cartData);
          const calculatedSubtotal = (cartData.products || []).reduce((acc: number, item: CartProduct) => {
            const price = Number(item.price) || 0;
            const quantity = Number(item.quantity || item.qty) || 0;
            return acc + (price * quantity);
          }, 0);
          setSubtotal(calculatedSubtotal);
          console.log("[CheckoutComponent] Cart data processed. Subtotal:", calculatedSubtotal);
        } else {
          console.warn("[CheckoutComponent] Failed to fetch cart data or cart is empty:", cartResult.status === 'rejected' ? cartResult.reason : cartResult.value?.message);
          setData({ products: [] });
          setSubtotal(0);
          if (cartResult.status === 'rejected') toast.error("Failed to load cart details.");
        }

        // Process User Data
        if (userResult.status === 'fulfilled' && userResult.value) {
          const userDataFromAction = userResult.value; // This is the object from getUserById
          console.log("[CheckoutComponent] Raw user data:", userDataFromAction);
          
          // Create a properly structured user object with fallbacks for all required fields
          const processedUserData: UserData = {
            _id: userDataFromAction._id,
            firstName: userDataFromAction.firstName || 
                     (userDataFromAction.name ? userDataFromAction.name.split(' ')[0] : '') ||
                     (session?.user?.name ? session.user.name.split(' ')[0] : ''),
            lastName: userDataFromAction.lastName || 
                    (userDataFromAction.name ? userDataFromAction.name.split(' ').slice(1).join(' ') : '') ||
                    (session?.user?.name ? session.user.name.split(' ').slice(1).join(' ') : ''),
            email: userDataFromAction.email || session?.user?.email || '',
            phone: userDataFromAction.phone || '',
            username: userDataFromAction.username || '',
            image: userDataFromAction.image || session?.user?.image || '',
          };
          
          setUser(processedUserData); // Set the processed user state
          console.log("[CheckoutComponent] Processed user data:", processedUserData);
        } else {
          console.error("[CheckoutComponent] Error fetching user data:", userResult.status === 'rejected' ? userResult.reason : 'No user data returned');
          
          // Create fallback user object from session if getUserById failed
          if (session?.user) {
            const fallbackUserData: UserData = {
              _id: session.user.id || '',
              firstName: session?.user?.name ? session.user.name.split(' ')[0] : '',
              lastName: session?.user?.name ? session.user.name.split(' ').slice(1).join(' ') : '',
              email: session?.user?.email || '',
              image: session?.user?.image || '',
            };
            setUser(fallbackUserData);
            console.log("[CheckoutComponent] Created fallback user data from session:", fallbackUserData);
          } else {
            toast.error("Failed to load user details. Please refresh.");
            setCheckoutError("User data could not be loaded. Please try logging in again.");
            setIsLoading(false);
            return; // Stop further processing if user data fails
          }
        }

        // Process Address Data - Enhanced error handling
        try {
          const addressResponse = await fetch('/api/user/address', {
            credentials: 'include' // Ensure cookies are sent with this request
          });
          
          if (addressResponse.ok) {
            const addressData = await addressResponse.json();
            if (addressData.addresses && addressData.addresses.length > 0) {
              setUserAddresses(addressData.addresses);
              // Find default or first address
              const defaultAddress = addressData.addresses.find((addr: Address) => addr.isDefault) || addressData.addresses[0];
              setAddress(defaultAddress);
              setSelectedAddressId(defaultAddress._id);
              console.log("[CheckoutComponent] Addresses processed. Default/Selected:", defaultAddress._id);
              // Auto-proceed only if a default address exists and is selected
              if (defaultAddress) {
                setStep(2); // Move to coupon step if address is set
              } else {
                setShowAddressForm(true); // Should not happen if addresses exist, but fallback
              }
            } else {
              console.log("[CheckoutComponent] No addresses found via API, showing form.");
              setShowAddressForm(true);
            }
          } else {
            const errorStatus = addressResponse.status;
            const errorText = await addressResponse.text();
            console.error(`[CheckoutComponent] Address API request failed with status ${errorStatus}:`, errorText);
            toast.error(`Failed to load addresses.`);
            setShowAddressForm(true); // Show form as fallback
          }
        } catch (error) {
          console.error("[CheckoutComponent] Error fetching addresses:", error);
          toast.error("Failed to load addresses");
          setShowAddressForm(true); // Show form as fallback
        }

      } catch (error) {
        console.error("[CheckoutComponent] Unexpected error during fetchData:", error);
        toast.error("An unexpected error occurred while loading checkout. Please refresh.");
        setCheckoutError("Failed to load checkout data. Please refresh the page.");
      } finally {
        console.log("[CheckoutComponent] Finished fetching data.");
        setIsLoading(false);
      }
    };

    if (status === 'authenticated' && userId) {
      fetchData();
    } else if (status === 'authenticated' && !userId) {
      console.error("[CheckoutComponent] Session authenticated but userId is missing!");
      toast.error("User session error. Please try logging out and back in.");
      setCheckoutError("User session error. Please ensure you are properly logged in.");
      setIsLoading(false);
      // Redirect to login after a delay
      setTimeout(() => router.push('/signin?callbackUrl=/checkout'), 3000);
    } else if (status === 'unauthenticated') {
      console.log("[CheckoutComponent] User is unauthenticated. Redirecting to login...");
      setIsLoading(false);
      router.push('/signin?callbackUrl=/checkout');
    }
    // Add cleanup function for abort controllers if needed

    return () => {
      // Cancel any pending requests here if using AbortController
    };
  }, [userId, status, router]);

  // --- Form Population Effect ---
  useEffect(() => {
    if (address) {
      form.setValues({
        address1: address.address1 || "",
        address2: address.address2 || "",
        city: address.city || "",
        state: address.state || "",
        zipCode: address.zipCode || "",
        country: address.country || "India",
        isDefault: address.isDefault || false,
        firstName: address.firstName || user?.firstName || "", 
        lastName: address.lastName || user?.lastName || "",   
        phone: address.phoneNumber || user?.phone || "", 
      });
    } else if (showAddressForm && user) {
        // Pre-fill names if known from user profile
        // Using form.setValues instead of individual setFieldValue calls to batch updates
        form.setValues({
          ...form.values, // Keep other values unchanged
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          phone: user.phone || ""
        });
    } else if (showAddressForm) {
        // Using form.setValues instead of individual setFieldValue calls to batch updates
        form.setValues({
          ...form.values, // Keep other values unchanged
          firstName: "",
          lastName: "",
          phone: ""
        });
    }
  // Stringify the dependencies that are objects to prevent unnecessary rerenders
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, user?.firstName, user?.lastName, user?.phone, showAddressForm]);
  
  // --- Step Navigation ---
  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);
  const isStepCompleted = (currentStep: number) => step > currentStep;
  const isActiveStep = (currentStep: number) => step === currentStep;

  // --- Coupon Handling ---
  const applyCouponHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCouponError(""); // Clear previous error

    if (coupon.trim() === "") {
      setDiscount(0); // Ensure discount is reset if no coupon applied
      setTotalAfterDiscount(null);
      nextStep(); // Proceed without applying
      return;
    }

    if (!user || !user._id) {
      toast.error("User information not available. Please refresh.");
      return;
    }

    toast.loading("Applying coupon..."); // Added loading toast
    try {
      const res = await applyCoupon(coupon, user._id); // Assuming applyCoupon returns { success: boolean, totalAfterDiscount?: number, discount?: number, message?: string }
      toast.dismiss(); // Dismiss loading toast

      if (res && res.success && res.totalAfterDiscount !== undefined && res.discount !== undefined) {
        setTotalAfterDiscount(res.totalAfterDiscount);
        setDiscount(res.discount);
        toast.success(`Applied ${res.discount}% coupon successfully.`);
        nextStep();
      } else {
        const errorMsg = res?.message || "Invalid or expired coupon code.";
        toast.error(errorMsg);
        setCouponError(errorMsg);
        setDiscount(0); // Reset discount on error
        setTotalAfterDiscount(null);
      }
    } catch (err: any) {
      toast.dismiss(); // Dismiss loading toast on error too
      console.error("Coupon application error:", err);
      const errorMsg = "Failed to apply coupon. Please try again.";
      setCouponError(errorMsg);
      toast.error(errorMsg);
      setDiscount(0); // Reset discount on error
      setTotalAfterDiscount(null);
    }
  };

  // --- Cart Items & Totals Calculation ---
  const cartItems: CartProduct[] = data?.products || [];

  const totalSaved: number = cartItems.reduce((acc: number, curr: CartProduct) => {
    const originalPrice = Number(curr.originalPrice) || Number(curr.price) || 0;
    const currentPrice = Number(curr.price) || 0;
    const quantity = Number(curr.quantity || curr.qty) || 0;
    const savedPerItem = Math.max(0, originalPrice - currentPrice);
    return acc + (savedPerItem * quantity);
  }, 0);

  const displaySubtotal = subTotal;
  const displayCartDiscount = totalSaved;
  const displayShipping = shippingCost === 0 ? "Free" : `₹${shippingCost.toFixed(2)}`;
  const totalBeforeCoupon = subTotal - totalSaved + shippingCost + taxCost;
  const finalTotal = totalAfterDiscount !== null ? totalAfterDiscount : totalBeforeCoupon;

  // --- Button State Logic ---
  const isAddressStepValid = step === 1 && !!selectedAddressId;
  const isCouponStepValid = step === 2; // Always allow proceeding from coupon (even without applying)
  const isPaymentStepValid = step === 3 && !!paymentMethod;

  const canProceed = () => {
      if (step === 1) return isAddressStepValid;
      if (step === 2) return isCouponStepValid;
      // Add more steps if needed
      return false; // Default case
  };

  const placeOrderButtonDisabled =
    !user ||
    !user._id ||
    !paymentMethod ||
    placeOrderLoading ||
    !address || // Ensure an address object is selected/set
    cartItems.length === 0 || // Prevent order with empty cart
    !!checkoutError; // Disable if there's a persistent error

  const placeOrderButtonText = () => {
    if (placeOrderLoading) return "Processing...";
    if (checkoutError) return "Fix Errors to Proceed";
    if (!user || !user._id) return "Loading user...";
    if (!address) return "Select Delivery Address";
    if (cartItems.length === 0) return "Cart is Empty";
    if (!paymentMethod) return "Select Payment Method";
    if (paymentMethod === "cod") return "Place Order (COD)";
    if (paymentMethod === "razorpay") return `Pay ₹${finalTotal.toFixed(2)} with Razorpay`;
    return `Place Order (₹${finalTotal.toFixed(2)})`; // Fallback
  };


  // --- Place Order Handler ---
  const placeOrderHandler = async () => {
    console.log("[placeOrderHandler] Initiated.");
    setCheckoutError(null); // Clear previous errors
    setPlaceOrderLoading(true);
    toast.dismiss(); // Clear previous toasts
    toast.loading("Processing your order..."); // Use loading toast

    // --- Re-validate essential data ---
    if (!user || !user._id || !address || cartItems.length === 0 || !paymentMethod) {
      console.error("[placeOrderHandler] Pre-flight validation failed.");
      toast.dismiss();
      toast.error("Missing required information. Please review your details.");
      setCheckoutError("Missing required information (User, Address, Cart, or Payment Method).");
      setPlaceOrderLoading(false);
      return;
    }
    
    console.log("[placeOrderHandler] Pre-flight validation passed.");

    // --- Prepare Shipping Address ---
    const orderShippingAddress = {
      firstName: address.firstName || user?.firstName || "N/A", // Use user.firstName
      lastName: address.lastName || user?.lastName || "N/A",   // Use user.lastName
      address1: address.address1 || "", 
      address2: address.address2 || "", 
      city: address.city || "",
      state: address.state || "",
      zipCode: address.zipCode || "",
      country: address.country || "India",
      phone: address.phoneNumber || "", // Added phone to shippingAddress
    };

    // --- Validate Address Fields ---
    const requiredAddressFields: (keyof Omit<typeof orderShippingAddress, 'address2'>)[] = ['firstName', 'lastName', 'address1', 'city', 'state', 'zipCode', 'country', 'phone']; // Added phone
    const missingFields = requiredAddressFields.filter(field => !orderShippingAddress[field]);
    if (missingFields.length > 0) {
        console.error("[placeOrderHandler] Validation failed: Incomplete shipping address.", missingFields);
        toast.dismiss();
        toast.error(`Incomplete shipping address. Missing: ${missingFields.join(', ')}`);
        setCheckoutError(`Incomplete shipping address. Please update your selected address.`);
        setPlaceOrderLoading(false);
        return;
    }
    console.log("[placeOrderHandler] Shipping address prepared and validated:", orderShippingAddress);

    // --- Construct Checkout Payload ---
    const checkoutDataPayload = { // Renamed to avoid conflict with CheckoutData interface
      userId: user._id,
      // Explicitly map only necessary fields, ensuring product is the ID string
      cartItems: cartItems.map((item: any) => ({
          product: typeof item.product === 'object' ? item.product._id : item.product, // Extract _id if product is an object
          name: item.name,
          qty: Number(item.quantity || item.qty || 0), // Ensure quantity is a number
          price: item.price, // Selling price
          originalPrice: item.originalPrice || item.price, // Original price, fallback to selling price
          size: item.size,
          image: item.image,
          // Do NOT spread the whole item object (...item)
      })),
      shippingAddress: orderShippingAddress,
      paymentMethod: paymentMethod,
      itemsPrice: subTotal,
      shippingPrice: shippingCost,
      taxPrice: taxCost,
      totalPrice: finalTotal,
      couponCode: coupon || null,
      discountAmount: discount > 0 ? (totalBeforeCoupon * (discount / 100)) : 0,
    };

    console.log("[placeOrderHandler] Calling /api/order with payload:", checkoutDataPayload);

    try {
      // --- Call Backend API ---
      const apiRes = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutDataPayload),
        credentials: 'include', // Add credentials to include cookies
      });
      console.log('[placeOrderHandler] API raw response status:', apiRes.status, apiRes.statusText);

      // Try to parse JSON regardless of apiRes.ok to get potential error messages from body
      let response;
      try {
        response = await apiRes.json();
        console.log("[placeOrderHandler] API response received:", response);
      } catch (jsonError: any) {
        console.error("[placeOrderHandler] Failed to parse API response JSON:", jsonError);
        toast.dismiss();
        // If JSON parsing fails, and status is not ok, construct a generic error.
        if (!apiRes.ok) {
          const errorText = await apiRes.text(); // Get raw text if JSON fails
          setCheckoutError(`Server error: ${apiRes.status} ${apiRes.statusText}. Response: ${errorText.substring(0, 100)}`);
          toast.error("Checkout Failed", { description: `Server error: ${apiRes.status}. Please try again.` });
        } else {
          // apiRes.ok but JSON parsing failed - unusual case
          setCheckoutError("Invalid response from server. Please try again.");
          toast.error("Checkout Failed", { description: "Received an invalid response from the server." });
        }
        setPlaceOrderLoading(false);
        return;
      }
      
      toast.dismiss(); // Dismiss loading toast

      if (apiRes.ok && response && response.success) {
        console.log("[placeOrderHandler] API call successful.");
        const orderId = response.orderId; 

        // --- Handle Different Payment Methods ---
        if (paymentMethod === 'cod') {
          if (response.requiresCodVerification) {
            console.log("[placeOrderHandler] COD order requires verification. Order ID:", orderId);
            toast.info("Order submitted! Please check your email for a verification code.", { duration: 6000 });
            // router.push(`/order/${orderId}?status=cod_pending_verification`); // Option 1: Go to order details page
            router.push(`/verify-cod?orderId=${orderId}`); // Option 2: Go to a dedicated verification page
                                                                      // Ensure this page /verify-cod is created
            // DO NOT empty cart here. It will be emptied after successful verification.
          } else {
            // This case should ideally not happen if backend always sets requiresCodVerification for COD
            console.warn("[placeOrderHandler] COD successful but requiresCodVerification flag not set. Order ID:", orderId);
            toast.success("Order placed successfully (COD)!");
            emptyCart(); // Fallback, though cart should be emptied post-verification
            router.push(`/order/${orderId}?status=cod_success`);
          }
        } else if (paymentMethod === 'razorpay') {
          // Ensure all expected Razorpay details are present from the backend
          if (response.razorpayOrderId && response.amount && response.razorpayKey && response.currency) {
              console.log("[placeOrderHandler] Razorpay details received. Initiating payment...");
              
              // Dynamically load Razorpay script if not already loaded
              const loadRazorpayScript = () => {
                return new Promise((resolve) => {
                  if ((window as any).Razorpay) {
                    resolve(true);
                    return;
                  }
                  const script = document.createElement('script');
                  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                  script.onload = () => {
                    resolve(true);
                  };
                  script.onerror = () => {
                    resolve(false);
                  };
                  document.body.appendChild(script);
                });
              };

              const scriptLoaded = await loadRazorpayScript();
              if (!scriptLoaded) {
                console.error("Failed to load Razorpay SDK.");
                toast.error("Payment gateway script failed to load. Please try again.");
                setPlaceOrderLoading(false);
                return;
              }
              
              toast.info("Redirecting to Razorpay...");

              const options = {
                  key: response.razorpayKey,
                  amount: response.amount, // Amount is in currency subunits. Default currency is INR.
                  currency: response.currency, // Should be INR
                  name: "Vibecart", // Your business name
                  description: `Order Payment for #${orderId}`,
                  image: "/logo.png", // Your logo URL
                  order_id: response.razorpayOrderId, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
                  handler: async function (rpResponse: any){
                      console.log("Razorpay Success Response:", rpResponse);
                      setPlaceOrderLoading(true); // Keep loading during verification
                      toast.loading("Verifying payment...");

                      try {
                        // Call backend to verify payment and update order
                        const verificationRes = await fetch('/api/order/verify-payment', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            orderId: orderId,
                            razorpayPaymentId: rpResponse.razorpay_payment_id,
                            razorpayOrderId: rpResponse.razorpay_order_id,
                            razorpaySignature: rpResponse.razorpay_signature,
                            paymentMethod: 'razorpay'
                          }),
                          credentials: 'include', // Add credentials to include cookies
                        });

                        const verificationData = await verificationRes.json();
                        toast.dismiss();

                        if (verificationRes.ok && verificationData.success) {
                          toast.success("Payment Successful & Verified!");
                          emptyCart();
                          router.push(`/order/${orderId}?status=razorpay_success&payment_id=${rpResponse.razorpay_payment_id}`);
                        } else {
                          console.error("Razorpay payment verification failed:", verificationData.message);
                          toast.error(`Payment Verification Failed: ${verificationData.message || 'Please contact support.'}`);
                          setCheckoutError(`Payment Verification Failed: ${verificationData.message || 'Contact support with Order ID: ' + orderId}`);
                          setPlaceOrderLoading(false);
                        }
                      } catch (verifyError: any) {
                        toast.dismiss();
                        console.error("Error during payment verification:", verifyError);
                        toast.error("Payment verification request failed. Please contact support.");
                        setCheckoutError("Payment verification request failed. Contact support with Order ID: " + orderId);
                        setPlaceOrderLoading(false);
                      }
                  },
                  prefill: { //We recommend using the prefill parameter to auto-fill customer's contact information, especially their phone number
                      name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(), // Use user.firstName and user.lastName
                      email: user?.email || "",
                  },
                  notes: {
                      address: `${orderShippingAddress.address1}, ${orderShippingAddress.city}`,
                      internal_order_id: orderId
                  },
                  theme: {
                      color: "#3399cc" // Customize your theme color
                  },
                  modal: {
                      ondismiss: function() {
                          console.log('Razorpay modal closed.');
                          if (!placeOrderLoading) { // Only show if not already processing verification
                            toast.info("Payment cancelled or modal closed.");
                          }
                          setPlaceOrderLoading(false); // Re-enable button if modal is closed without payment
                      }
                  }
              };
              
              try {
                const rzp = new (window as any).Razorpay(options);
                rzp.on('payment.failed', function (rpFailedResponse: any){
                    console.error("Razorpay Payment Failed Response:", rpFailedResponse);
                    toast.dismiss();
                    const errorCode = rpFailedResponse.error.code;
                    const errorDescription = rpFailedResponse.error.description;
                    const errorSource = rpFailedResponse.error.source;
                    const errorStep = rpFailedResponse.error.step;
                    const errorReason = rpFailedResponse.error.reason;
                    const errorMetadata = rpFailedResponse.error.metadata;
                
                    console.error(`Razorpay Payment Failed: Code: ${errorCode}, Description: ${errorDescription}, Source: ${errorSource}, Step: ${errorStep}, Reason: ${errorReason}`);
                    if (errorMetadata) {
                        console.error("Error Metadata:", errorMetadata);
                    }
                
                    toast.error(`Payment Failed: ${errorDescription || 'Please try again or contact support.'}`, { duration: 7000 });
                    setCheckoutError(`Payment Failed: ${errorDescription} (Order ID: ${errorMetadata?.order_id}, Payment ID: ${errorMetadata?.payment_id})`);
                    setPlaceOrderLoading(false);
                });
                rzp.open();
              } catch (sdkError: any) {
                console.error("Error initializing Razorpay SDK:", sdkError);
                toast.error("Could not initialize payment gateway. Please refresh and try again.");
                setPlaceOrderLoading(false);
              }

          } else {
              console.error("[placeOrderHandler] Razorpay selected, but missing required details in API response. Response:", response);
              toast.error("Payment processing error. Missing Razorpay details from server.");
              setCheckoutError("Could not initiate Razorpay payment due to missing server details.");
              setPlaceOrderLoading(false);
          }
        } else {
          console.warn("[placeOrderHandler] Unknown payment method success:", paymentMethod);
          toast.success("Order processed (unknown method).");
          emptyCart();
          router.push(`/order/${orderId}?status=unknown_success`);
        }

      } else {
        // --- Handle API Failure Response ---
        console.error("[placeOrderHandler] API call failed or success=false. Response:", response);
        // Use message from parsed JSON response if available
        const errorMessage = response?.message || (apiRes.ok ? "Checkout failed due to an unknown reason." : `Server error: ${apiRes.status} ${apiRes.statusText}`);

        if (errorMessage.includes("could not be found or are unavailable")) {
          setCheckoutError(errorMessage + " Please review your cart and remove unavailable items.");
          toast.error("Checkout Error: Product Unavailable", {
            description: "Please review the error message below the order summary.",
          });
        } else if (errorMessage.includes("Insufficient stock")) {
           setCheckoutError(errorMessage + " Please reduce the quantity or remove the item from your cart.");
           toast.error("Checkout Error: Insufficient Stock", {
             description: "Please review the error message below the order summary.",
           });
        } else {
          setCheckoutError(errorMessage); // Set persistent error for other failures
          toast.error("Checkout Failed", { description: errorMessage });
        }
        setPlaceOrderLoading(false); // Reset loading state on failure
      }
    } catch (error: any) {
      console.error("[placeOrderHandler] Error caught:", error);
      toast.dismiss(); // Dismiss loading toast
      const errorMsg = error?.message || "An unexpected error occurred. Please try again.";
      setCheckoutError(errorMsg); // Show error persistently
      toast.error("Checkout Error", { description: errorMsg });
      setPlaceOrderLoading(false); // Reset loading state on exception
    }
    // Note: Loading state is managed within each success/error path now.
    console.log("[placeOrderHandler] Execution finished (or redirected/modal opened).");
  };


  // --- Address Management Handlers ---

  const handleAddressSelect = (addressId: string) => {
    const selected = userAddresses.find(addr => addr._id === addressId);
    if (selected) {
      setAddress(selected);
      setSelectedAddressId(addressId);
      setCheckoutError(null); // Clear address-related errors when selecting
      // Form values are updated by the useEffect dependency on `address`
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    // Optimistic UI update (optional but good UX)
    const originalAddresses = [...userAddresses];
    setUserAddresses(prev => prev.map(addr => ({
        ...addr,
        isDefault: addr._id === addressId
    })));
    const newDefault = userAddresses.find(addr => addr._id === addressId);
    if (newDefault) setAddress(newDefault); // Update main address state too

    toast.loading("Updating default address..."); 
    try {
      const response = await fetch('/api/user/address', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressId, action: 'set-default' }),
        credentials: 'include', // Ensure cookies are sent with the request
      });
      const data = await response.json();
      toast.dismiss(); // Dismiss loading toast

      if (!response.ok) throw new Error(data.message || 'Failed to update default address');

      // Update state with confirmed data from backend
      setUserAddresses(data.addresses || []);
      const confirmedDefault = data.addresses.find((addr: Address) => addr.isDefault);
      if (confirmedDefault) {
          setAddress(confirmedDefault); // Ensure main address state reflects confirmed default
          setSelectedAddressId(confirmedDefault._id);
      }
      toast.success('Default address updated!');

    } catch (error: any) {
      toast.dismiss(); // Dismiss loading toast on error too
      toast.error(error.message || 'Failed to update default address');
      // Rollback optimistic update on error
      setUserAddresses(originalAddresses);
      const originalDefault = originalAddresses.find(addr => addr.isDefault) || originalAddresses[0];
      if (originalDefault) {
          setAddress(originalDefault);
          setSelectedAddressId(originalDefault._id);
      }
    }
  };

  const handleShowNewAddressForm = () => {
    setShowAddressForm(true);
    setSelectedAddressId(""); // Deselect any existing address
    setAddress(null); // Clear the current address object
    form.reset(); // Clear form for new address
    // Pre-fill known details like phone/name in the useEffect hook
  };

  const handleCancelNewAddress = () => {
    if (userAddresses.length > 0) {
      setShowAddressForm(false);
      // Reselect the first or default address
      const defaultAddress = userAddresses.find(addr => addr.isDefault) || userAddresses[0];
      if (defaultAddress) {
        handleAddressSelect(defaultAddress._id);
      }
      form.clearErrors(); // Clear any validation errors
    }
    // If no addresses exist, cancel does nothing, user must add one.
  };

  const handleAddAddress = async (values: typeof form.values) => {
    setAddAddressLoading(true);
    setCheckoutError(null);
    
    if (!user || !user._id) {
      toast.error("User information not available.");
      setAddAddressLoading(false);
      return;
    }

    const addressDataToSend = { 
      address1: values.address1,
      address2: values.address2,
      city: values.city,
      state: values.state,
      zipCode: values.zipCode,
      country: values.country,
      isDefault: values.isDefault,
      firstName: values.firstName,
      lastName: values.lastName,
      phoneNumber: values.phone,
    };

    toast.loading("Saving address...");
    try {
      const response = await fetch('/api/user/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addressDataToSend }),
        credentials: 'include', // Ensure cookies are sent with the request
      });
      const data = await response.json();
      toast.dismiss();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to add address');
      }

      const newlySavedAddress = data.address as Address;

      if (!newlySavedAddress || !newlySavedAddress._id) {
        console.error("handleAddAddress: API reported success but new address object is missing or invalid.", data);
        throw new Error("Failed to process new address from server.");
      }

      setUserAddresses(prevAddresses => {
        let updatedAddresses = prevAddresses.filter(addr => addr._id !== newlySavedAddress._id); // Remove if existing (e.g. unlikely for add but safe)

        if (newlySavedAddress.isDefault) {
          updatedAddresses = updatedAddresses.map(addr => ({ ...addr, isDefault: false }));
        }
        updatedAddresses.push(newlySavedAddress);
        return updatedAddresses;
      });
      
      toast.success(data.message || 'Address saved successfully');
      form.reset();
      setShowAddressForm(false);

      // Automatically select the new address and potentially move to the next step
      handleAddressSelect(newlySavedAddress._id); // This sets address and selectedAddressId

      if (step === 1 && (newlySavedAddress.isDefault || userAddresses.length === 0)) {
        setStep(2);
      }

    } catch (error: any) {
      toast.dismiss(); 
      console.error("Error saving address:", error);
      toast.error(error.message || "Failed to save address");
      setCheckoutError(error.message || "Failed to save address");
    } finally {
      setAddAddressLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    // Optimistic UI update (optional but good UX)
    const originalAddresses = [...userAddresses];
    setUserAddresses(prev => prev.filter(addr => addr._id !== addressId));
    if (address && address._id === addressId) {
      setAddress(null);
      setSelectedAddressId("");
    }

    toast.loading("Deleting address...");
    try {
      const response = await fetch('/api/user/address', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressId }),
        credentials: 'include', // Ensure cookies are sent with the request
      });
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Failed to delete address (${response.status})`);
      }
      
      const data = await response.json();
      toast.dismiss();
      toast.success('Address deleted successfully');

      // Automatically select a new address if available
      if (userAddresses.length > 1) {
        const newDefault = userAddresses.find(addr => addr._id !== addressId);
        if (newDefault) {
          handleAddressSelect(newDefault._id);
        }
      } else {
        // If no addresses left, show the form
        setShowAddressForm(true);
      }

    } catch (error: any) {
      toast.dismiss();
      console.error("Error deleting address:", error);
      toast.error(error.message || "Failed to delete address");
      // Rollback optimistic update on error
      setUserAddresses(originalAddresses);
      const originalDefault = originalAddresses.find(addr => addr.isDefault) || originalAddresses[0];
      if (originalDefault) {
          setAddress(originalDefault);
          setSelectedAddressId(originalDefault._id);
      }
    }
  };

  const handleEditAddress = async (addressId: string, updatedData: Partial<Address>) => {
    // Optimistic UI update: Merge updates locally
    setUserAddresses(prev => prev.map(addr => addr._id === addressId ? { ...addr, ...updatedData } : addr));

    toast.loading("Updating address...");
    try {
      const response = await fetch('/api/user/address', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressId, updatedData, action: 'update' }),
        credentials: 'include', // Add credentials to include cookies
      });
      const data = await response.json();
      toast.dismiss();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update address');
      }

      // Find and set the updated address
      const updatedAddress = data.address as Address;
      setAddress(updatedAddress);
      setSelectedAddressId(updatedAddress._id);

      toast.success('Address updated successfully');

    } catch (error: any) {
      toast.dismiss();
      console.error("Error updating address:", error);
      toast.error(error.message || "Failed to update address");
      // Rollback optimistic update on error
      setUserAddresses(prev => prev.map(addr => addr._id === addressId ? { ...addr, ...updatedData } : addr));
    }
  };

  // --- Render Logic ---

  // Loading State
  if (status === "loading" || isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 h-10 w-10 text-primary" />
          <p className="text-lg text-muted-foreground">Loading Checkout...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated State (Should be handled by useEffect redirect, but as fallback)
  if (status !== "authenticated" || !session?.user) {
     return (
        <div className="container mx-auto p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
                <AlertCircle className="mx-auto mb-4 h-10 w-10 text-destructive" />
                <p className="text-lg">Authentication Required</p>
                <p className="text-muted-foreground mb-4">Please sign in to proceed to checkout.</p>
                <Button onClick={() => router.push('/signin?callbackUrl=/checkout')}>Sign In</Button>
            </div>
        </div>
    );
  }

  // Empty Cart State
  const isCartEmpty = !cartItems || cartItems.length === 0;
  if (isCartEmpty && !isLoading) { // Check isLoading to prevent flash of empty cart message
    return (
      <div className="container mx-auto p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <img src="/placeholder/empty-cart.svg" alt="Empty Cart" className="w-40 h-40 mx-auto mb-4 opacity-70" />
          <p className="text-xl font-semibold mb-2">Your Cart is Empty</p>
          <p className="text-muted-foreground mb-6">Looks like you haven't added anything to your cart yet.</p>
          <Button onClick={() => router.push('/')} size="lg">Continue Shopping</Button>
        </div>
      </div>
    );
  }

  // --- Main Checkout JSX ---
  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Checkout Header */}
      <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
          <p className="text-muted-foreground mt-1">Complete your purchase by providing the details below.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 xl:gap-12">

        {/* Left Side: Steps */}
        <div className="w-full lg:w-2/3">
          {/* Step Indicator (Optional but helpful) */}
          {/* ... Add a visual step indicator if desired ... */}

          {/* Step 1: Delivery Address */}
          <div className={`p-6 border rounded-lg mb-6 transition-all duration-300 ${isActiveStep(1) ? 'bg-white shadow-md' : 'bg-gray-50 opacity-80'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-semibold flex items-center gap-2 ${isStepCompleted(1) ? 'text-green-600' : 'text-gray-800'}`}>
                {isStepCompleted(1) ? <Check className="h-6 w-6" /> : <span className="font-bold text-primary">1.</span>}
                Delivery Address
              </h2>
              {isStepCompleted(1) && !isActiveStep(1) && (
                <Button variant="outline" size="sm" onClick={() => setStep(1)}>Change</Button>
              )}
            </div>

            {isActiveStep(1) && (
              <div className="mt-4 space-y-4">
                {/* Address Selection */}
                {userAddresses.length > 0 && !showAddressForm && (
                  <RadioGroup
                    value={selectedAddressId}
                    onValueChange={handleAddressSelect}
                    className="space-y-3"
                  >
                    {userAddresses.map((addr) => (
                      <Label
                        key={addr._id}
                        htmlFor={`addr-${addr._id}`}
                        className={`flex items-start p-4 border rounded-md cursor-pointer transition-colors hover:border-primary ${selectedAddressId === addr._id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200'}`}
                      >
                        <RadioGroupItem value={addr._id} id={`addr-${addr._id}`} className="mt-1" />
                        <div className="ml-3 flex-1">
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-sm">
                              {addr.firstName} {addr.lastName} 
                              {addr.isDefault && <span className="ml-2 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">Default</span>}
                            </span>
                            <div className="flex space-x-2">
                              {!addr.isDefault && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs h-auto p-1 text-primary hover:bg-primary/10"
                                  onClick={(e) => { e.preventDefault(); handleSetDefaultAddress(addr._id); }}
                                >
                                  Set Default
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-auto p-1 text-red-500 hover:bg-red-50 hover:text-red-600"
                                onClick={(e) => { e.preventDefault(); handleDeleteAddress(addr._id); }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {addr.address1}, {addr.address2 ? `${addr.address2}, ` : ""}{addr.city}, {addr.state} - {addr.zipCode}
                          </p>
                          {addr.phoneNumber && (
                            <p className="text-sm text-muted-foreground mt-1">Phone: {addr.phoneNumber}</p>
                          )}
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>
                )}

                {/* Address Form */}
                {(userAddresses.length === 0 || showAddressForm) && (
                  <form onSubmit={form.onSubmit(handleAddAddress)} className="space-y-4 border border-dashed p-4 rounded-md bg-gray-50">
                    <h3 className="font-medium text-center text-gray-700">{userAddresses.length === 0 ? "Add your delivery address" : "Add a new address"}</h3>
                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Input
                          placeholder="First Name"
                          value={form.values.firstName}
                          onChange={(event) => form.setFieldValue('firstName', event.currentTarget.value)}
                          onBlur={() => form.validateField('firstName')}
                          required
                        />
                        {form.errors.firstName && <p className="text-red-500 text-xs mt-1">{form.errors.firstName}</p>}
                      </div>
                      <div>
                        <Input
                          placeholder="Last Name"
                          value={form.values.lastName}
                          onChange={(event) => form.setFieldValue('lastName', event.currentTarget.value)}
                          onBlur={() => form.validateField('lastName')}
                          required
                        />
                        {form.errors.lastName && <p className="text-red-500 text-xs mt-1">{form.errors.lastName}</p>}
                      </div>
                    </div>
                    <div>
                      <Input
                        placeholder="Address Line 1 (House No, Building, Street, Area)"
                        value={form.values.address1}
                        onChange={(event) => form.setFieldValue('address1', event.currentTarget.value)}
                        onBlur={() => form.validateField('address1')}
                        required
                      />
                      {form.errors.address1 && <p className="text-red-500 text-xs mt-1">{form.errors.address1}</p>}
                    </div>
                    <div>
                      <Input
                        placeholder="Address Line 2 (Optional)"
                        value={form.values.address2}
                        onChange={(event) => form.setFieldValue('address2', event.currentTarget.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Changed grid for phone */}
                      <div>
                        <Input
                          placeholder="Phone Number"
                          type="tel"
                          value={form.values.phone}
                          onChange={(event) => form.setFieldValue('phone', event.currentTarget.value)}
                          onBlur={() => form.validateField('phone')}
                          required
                        />
                        {form.errors.phone && <p className="text-red-500 text-xs mt-1">{form.errors.phone}</p>}
                      </div>
                      <div>
                        <Input
                          placeholder="6-digit Zip Code"
                          value={form.values.zipCode}
                          onChange={(event) => form.setFieldValue('zipCode', event.currentTarget.value)}
                          onBlur={() => form.validateField('zipCode')}
                          required
                        />
                        {form.errors.zipCode && <p className="text-red-500 text-xs mt-1">{form.errors.zipCode}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Changed grid for city/state */}
                      <div>
                        <Input
                          placeholder="City"
                          value={form.values.city}
                          onChange={(event) => form.setFieldValue('city', event.currentTarget.value)}
                          onBlur={() => form.validateField('city')}
                          required
                        />
                        {form.errors.city && <p className="text-red-500 text-xs mt-1">{form.errors.city}</p>}
                      </div>
                      <div>
                        <Input
                          placeholder="State"
                          value={form.values.state}
                          onChange={(event) => form.setFieldValue('state', event.currentTarget.value)}
                          onBlur={() => form.validateField('state')}
                          required
                        />
                        {form.errors.state && <p className="text-red-500 text-xs mt-1">{form.errors.state}</p>}
                      </div>
                    </div>
                     <div>
                       <Input
                         placeholder="Country"
                         value={form.values.country}
                         onChange={(event) => form.setFieldValue('country', event.currentTarget.value)}
                         // onBlur={() => form.validateField('country')} // No validation needed for disabled
                         disabled
                       />
                       {/* No error display needed for disabled field */}
                     </div>
                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        id="isDefault"
                        checked={form.values.isDefault}
                        onCheckedChange={(checked) => {
                          // Handle CheckedState type: treat indeterminate as false
                          const newValue = checked === true;
                          form.setFieldValue('isDefault', newValue);
                        }}
                      />
                      <Label htmlFor="isDefault" className="text-sm font-normal">Set as default delivery address</Label>
                    </div>
                    {/* Form Actions */}
                    <div className="flex justify-end gap-3 pt-3">
                      {userAddresses.length > 0 && showAddressForm && ( // Show cancel only when adding new and others exist
                        <Button type="button" variant="outline" onClick={handleCancelNewAddress} disabled={addAddressLoading}>Cancel</Button>
                      )}
                      <Button type="submit" disabled={addAddressLoading || !form.isValid()}>
                        {addAddressLoading ? <Loader className="animate-spin mr-2 h-4 w-4" /> : null}
                        Save Address
                      </Button>
                    </div>
                  </form>
                )}

                {/* Add New Address Button */}
                {userAddresses.length > 0 && !showAddressForm && (
                  <div className="mt-4">
                      <Button variant="outline" onClick={handleShowNewAddressForm}>
                        <Plus className="mr-2 h-4 w-4" /> Add New Address
                      </Button>
                  </div>
                )}

                {/* Proceed Button */}
                {address && !showAddressForm && ( // Only show proceed if an address is selected and form is not open
                  <div className="mt-6 text-right">
                      <Button onClick={nextStep} size="lg" disabled={!selectedAddressId}>
                        Use This Address & Proceed
                      </Button>
                  </div>
                )}
              </div>
            )}
          </div> {/* End Step 1 */}

          {/* Step 2: Apply Coupon */}
          <div className={`p-6 border rounded-lg mb-6 transition-all duration-300 ${isActiveStep(2) ? 'bg-white shadow-md' : 'bg-gray-50 opacity-80'}`}>
             <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-semibold flex items-center gap-2 ${isStepCompleted(2) ? 'text-green-600' : 'text-gray-800'}`}>
                {isStepCompleted(2) ? <Check className="h-6 w-6" /> : <span className="font-bold text-primary">2.</span>}
                Apply Coupon
              </h2>
              {isStepCompleted(2) && !isActiveStep(2) && (
                <Button variant="outline" size="sm" onClick={() => setStep(2)}>Change</Button>
              )}
            </div>
            {isActiveStep(2) && (
              <form onSubmit={applyCouponHandler} className="mt-4 space-y-4">
                <div className="flex gap-2 items-start">
                  <div className="flex-grow">
                    <Input
                      placeholder="Enter coupon code (optional)"
                      value={coupon}
                      onChange={(e) => { setCoupon(e.target.value); setCouponError(""); }}
                      className={couponError ? "border-red-500" : ""}
                    />
                    {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
                  </div>
                  <Button type="submit" variant="secondary" className="shrink-0">Apply</Button>
                </div>
                {discount > 0 && (
                    <p className="text-green-600 text-sm font-medium">✓ Coupon "{coupon}" applied ({discount}% discount)!</p>
                )}
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={prevStep}>Back to Address</Button>
                  <Button onClick={nextStep} size="lg">Proceed to Payment</Button>
                </div>
              </form>
            )}
          </div> {/* End Step 2 */}

          {/* Step 3: Payment Method */}
          <div className={`p-6 border rounded-lg transition-all duration-300 ${isActiveStep(3) ? 'bg-white shadow-md' : 'bg-gray-50 opacity-80'}`}>
             <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-semibold flex items-center gap-2 ${isStepCompleted(3) ? 'text-green-600' : 'text-gray-800'}`}>
                {isStepCompleted(3) ? <Check className="h-6 w-6" /> : <span className="font-bold text-primary">3.</span>}
                Payment Method
              </h2>
              {/* No change button needed here as final button is in summary */}
            </div>
            {isActiveStep(3) && (
              <div className="mt-4 space-y-4">
                <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as CheckoutData['paymentMethod'])} className="space-y-3">
                  {/* COD Option */}
                  <Label htmlFor="cod" className={`flex items-center p-4 border rounded-md cursor-pointer transition-colors hover:border-primary ${paymentMethod === 'cod' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200'}`}>
                    <RadioGroupItem value="cod" id="cod" />
                    <div className="ml-3">
                        <span className="font-medium">Cash on Delivery (COD)</span>
                        <p className="text-xs text-muted-foreground">Pay with cash upon delivery.</p>
                        {paymentMethod === 'cod' && (
                          <p className="text-xs text-primary mt-1">
                            You will receive a verification code via email to confirm your order.
                          </p>
                        )}
                    </div>
                  </Label>
                  {/* Razorpay Option */}
                  <Label htmlFor="razorpay" className={`flex items-center p-4 border rounded-md cursor-pointer transition-colors hover:border-primary ${paymentMethod === 'razorpay' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200'}`}>
                    <RadioGroupItem value="razorpay" id="razorpay" />
                     <div className="ml-3">
                        <span className="font-medium">Razorpay</span>
                        <p className="text-xs text-muted-foreground">Pay using Razorpay gateway.</p>
                    </div>
                  </Label>
                </RadioGroup>
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={prevStep}>Back to Coupon</Button>
                  {/* Final Place Order button is in the summary section */}
                </div>
              </div>
            )}
          </div> {/* End Step 3 */}

        </div> {/* End Left Side */}

        {/* Right Side: Order Summary */}
        <div className="w-full lg:w-1/3 lg:sticky top-24 self-start rounded-lg border bg-gray-50 shadow-sm">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-5 border-b pb-3">Order Summary</h2>

            {/* Order Summary Items */}
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item._uid || item._id} className="flex justify-between items-start text-sm"> {/* Use _id for key fallback if _uid is missing */}
                  <div className="flex items-start gap-3">
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />\n
                    <div>
                      <p className="font-medium text-gray-800 line-clamp-1">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity || item.qty}</p>
                      {/* Correctly display Product ID using _id */}
                      <p className="text-xs text-muted-foreground">ID: {item._id}</p> 
                      {(item.size) && (
                        <p className="text-xs text-muted-foreground">
                          {item.size}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-800">₹{(Number(item.price) * Number(item.quantity || item.qty || 1)).toFixed(2)}</p>
                    {item.originalPrice && Number(item.originalPrice) > Number(item.price) && (
                      <p className="text-xs text-muted-foreground line-through">₹{(Number(item.originalPrice) * Number(item.quantity || item.qty || 1)).toFixed(2)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>₹ {displaySubtotal.toFixed(2)}</span>
              </div>
              {displayCartDiscount > 0 && (
                 <div className="flex justify-between text-sm text-green-600">
                   <span className="text-muted-foreground">Item Discount:</span>
                   <span>- ₹ {displayCartDiscount.toFixed(2)}</span>
                 </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping:</span>
                <span className={shippingCost === 0 ? "text-green-600 font-medium" : ""}>{displayShipping}</span>
              </div>
              {taxCost > 0 && (
                 <div className="flex justify-between text-sm">
                   <span className="text-muted-foreground">Tax:</span>
                   <span>₹ {taxCost.toFixed(2)}</span>
                 </div>
              )}

              {/* Coupon Discount Display */}
              {discount > 0 && totalAfterDiscount !== null && (
                <div className="flex justify-between text-sm text-green-600 bg-green-50 p-1.5 rounded">
                  <span className="font-medium">Coupon ({coupon}):</span>
                  <span className="font-medium">- ₹ {(totalBeforeCoupon - finalTotal).toFixed(2)} ({discount}%)</span>
                </div>
              )}

              {/* Total */}
              <div className="pt-3 border-t">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>₹ {finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Checkout Error Display Area */}
            {checkoutError && (
                <Alert variant="destructive" className="mt-5">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Checkout Error</AlertTitle>
                  <AlertDescription className="text-xs">
                    {checkoutError}
                  </AlertDescription>
                </Alert>
            )}

            {/* Place Order Button - Visible only on Payment Step */}
            {isActiveStep(3) && (
              <Button
                onClick={placeOrderHandler}
                className="w-full mt-6"
                disabled={placeOrderButtonDisabled}
                size="lg"
              >
                {placeOrderLoading ? (
                  <Loader className="animate-spin mr-2 h-5 w-5" />
                ) : null}
                {placeOrderButtonText()}
              </Button>
            )}
             {/* Info text if button is disabled due to error */}
             {isActiveStep(3) && checkoutError && !placeOrderLoading && (
                <p className="text-xs text-center text-destructive mt-2">Please resolve the error above before proceeding.</p>
             )}

          </div> {/* End Summary Inner Padding */}
        </div> {/* End Right Side */}

      </div> {/* End Flex Container */}
    </div> // End Container
  );
}
