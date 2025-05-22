/**
 * Utility functions for mapping between admin and website order statuses
 */

/**
 * Maps admin panel status format to website format
 * @param status Admin panel status string
 * @returns Website status string
 */
export function mapAdminStatusToWebsite(status: string): string {
  switch (status) {
    case 'Not Processed':
      return 'pending';
    case 'Processing':
      return 'processing';
    case 'Confirmed':
      return 'confirmed';
    case 'Dispatched':
      return 'shipped';
    case 'Completed':
      return 'delivered';
    case 'Delivered':
      return 'delivered';
    case 'Cancelled':
      return 'cancelled';
    case 'Processing Refund':
      return 'refunded';
    case 'Refunded':
      return 'refunded';
    default:
      // Return the original status if no mapping exists
      return status.toLowerCase();
  }
}

/**
 * Maps website status format to admin panel format
 * @param status Website status string
 * @returns Admin panel status string
 */
export function mapWebsiteStatusToAdmin(status: string): string {
  switch (status) {
    case 'pending':
      return 'Not Processed';
    case 'processing':
      return 'Processing';
    case 'confirmed':
      return 'Confirmed';
    case 'shipped':
      return 'Dispatched';
    case 'delivered':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'refunded':
      return 'Processing Refund';
    default:
      // Return the original status with first letter capitalized if no mapping exists
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}
