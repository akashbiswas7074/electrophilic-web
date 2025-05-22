import { batchSyncOrderItemStatusesWithProducts } from '../lib/database/actions/order.actions';

console.log('Starting order status synchronization...');
console.log('This script synchronizes product statuses between the orderItems and products arrays in all orders.');

(async () => {
  try {
    console.log('Running batch sync operation...');
    const result = await batchSyncOrderItemStatusesWithProducts();
    
    console.log('\n========================== SYNC COMPLETE ==========================');
    console.log(`Total orders processed: ${result.total}`);
    console.log(`Orders updated: ${result.updated}`);
    console.log(`Orders already in sync or skipped: ${result.total - result.updated}`);
    console.log('===================================================================');
    
    console.log('\nNote: From now on, order statuses will be automatically kept in sync by the pre-save hook in the Order model.');
    process.exit(0);
  } catch (err) {
    console.error('\n==================== SYNC FAILED ====================');
    console.error('Batch sync failed with error:', err);
    console.error('=====================================================');
    process.exit(1);
  }
})();
