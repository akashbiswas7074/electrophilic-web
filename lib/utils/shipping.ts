// Shipping calculation utilities

export const SHIPPING_CONFIG = {
  FREE_SHIPPING_THRESHOLD: 500, // ₹500 minimum for free shipping
  STANDARD_SHIPPING_CHARGE: 48, // ₹48 shipping charge
} as const;

/**
 * Calculate shipping charge based on order value
 * @param itemsPrice - Total price of items in the cart
 * @returns shipping charge amount
 */
export function calculateShippingCharge(itemsPrice: number): number {
  if (itemsPrice >= SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD) {
    return 0; // Free shipping
  }
  return SHIPPING_CONFIG.STANDARD_SHIPPING_CHARGE;
}

/**
 * Check if order qualifies for free shipping
 * @param itemsPrice - Total price of items in the cart
 * @returns boolean indicating if shipping is free
 */
export function qualifiesForFreeShipping(itemsPrice: number): boolean {
  return itemsPrice >= SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD;
}

/**
 * Get shipping display text
 * @param itemsPrice - Total price of items in the cart
 * @returns formatted shipping display text
 */
export function getShippingDisplayText(itemsPrice: number): string {
  if (qualifiesForFreeShipping(itemsPrice)) {
    return "FREE DELIVERY";
  }
  return `₹${SHIPPING_CONFIG.STANDARD_SHIPPING_CHARGE} Shipping`;
}

/**
 * Calculate how much more is needed for free shipping
 * @param itemsPrice - Total price of items in the cart
 * @returns amount needed for free shipping (0 if already qualifies)
 */
export function getAmountNeededForFreeShipping(itemsPrice: number): number {
  if (qualifiesForFreeShipping(itemsPrice)) {
    return 0;
  }
  return SHIPPING_CONFIG.FREE_SHIPPING_THRESHOLD - itemsPrice;
}