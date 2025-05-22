/**
 * Utilities for handling order data between website and admin panel formats
 */

export function mapWebsiteStatusToAdmin(websiteStatus: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'Not Processed',
    'processing': 'Processing',
    'shipped': 'Dispatched',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
    'refunded': 'Processing Refund',
    'completed': 'Completed'
  };
  return statusMap[websiteStatus] || 'Not Processed';
}

export function mapAdminStatusToWebsite(adminStatus: string): string {
  const statusMap: Record<string, string> = {
    'Not Processed': 'pending',
    'Processing': 'processing',
    'Dispatched': 'shipped',
    'Delivered': 'delivered',
    'Cancelled': 'cancelled',
    'Processing Refund': 'refunded',
    'Completed': 'completed'
  };
  return statusMap[adminStatus] || 'pending';
}

export function normalizeOrderForAdmin(order: any): any {
  if (!order) return null;
  const normalizedOrder = JSON.parse(JSON.stringify(order));
  if (!normalizedOrder.products) normalizedOrder.products = [];
  if (!normalizedOrder.orderItems) normalizedOrder.orderItems = [];
  if (normalizedOrder.orderItems?.length > 0 && normalizedOrder.products.length === 0) {
    normalizedOrder.products = normalizedOrder.orderItems.map((item: any) => ({
      ...item,
      status: item.status ? mapWebsiteStatusToAdmin(item.status) : 'Not Processed',
      qty: item.qty || item.quantity || 1,
      quantity: item.quantity || item.qty || 1
    }));
  }
  if (normalizedOrder.status && typeof normalizedOrder.status === 'string' &&
      ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].includes(normalizedOrder.status)) {
    normalizedOrder.status = mapWebsiteStatusToAdmin(normalizedOrder.status);
  }
  if (normalizedOrder.deliveryAddress && !normalizedOrder.shippingAddress) {
    normalizedOrder.shippingAddress = { ...normalizedOrder.deliveryAddress };
  } else if (normalizedOrder.shippingAddress && !normalizedOrder.deliveryAddress) {
    normalizedOrder.deliveryAddress = { ...normalizedOrder.shippingAddress };
  }
  if (normalizedOrder.totalAmount && !normalizedOrder.total) {
    normalizedOrder.total = normalizedOrder.totalAmount;
  } else if (normalizedOrder.total && !normalizedOrder.totalAmount) {
    normalizedOrder.totalAmount = normalizedOrder.total;
  }
  return normalizedOrder;
}

export function prepareOrderUpdatePayload(orderId: string, status: string): any {
  return {
    orderId,
    status
  };
}

// Create a named constant for the default export to fix the ESLint warning
const orderUtils = {
  mapWebsiteStatusToAdmin,
  mapAdminStatusToWebsite,
  normalizeOrderForAdmin,
  prepareOrderUpdatePayload
};

export default orderUtils;
