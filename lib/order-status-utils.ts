/**
 * Utilities for handling order status mapping between website and admin formats
 * This file ensures consistent status handling across the electrophilic-web project
 */

/**
 * Maps the website order status to admin status format
 * @param {string} websiteStatus - Status from the website order model
 * @returns {string} - Equivalent admin order status
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

/**
 * Maps the admin order status to website format
 * @param {string} adminStatus - Status from the admin order model
 * @returns {string} - Equivalent website order status
 */
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

export default {
  mapWebsiteStatusToAdmin,
  mapAdminStatusToWebsite
};
