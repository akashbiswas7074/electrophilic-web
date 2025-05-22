
import mongoose from 'mongoose';
import { connectToDatabase } from '../lib/database/connect';
import Order, { IOrder } from '../lib/database/models/order.model';
import User, { IUser, IEmbeddedAddress } from '../lib/database/models/user.model';

async function migrateOrderAddresses() {
  console.log('Connecting to database...');
  await connectToDatabase();
  console.log('Connected to database.');

  const ordersToUpdate = await Order.find({
    $or: [
      { 'deliveryAddress.phoneNumber': { $exists: false } },
      { 'deliveryAddress.phoneNumber': null },
      { 'deliveryAddress.phoneNumber': '' },
      { 'deliveryAddress.firstName': { $exists: false } },
      { 'deliveryAddress.firstName': null },
      { 'deliveryAddress.firstName': '' },
      { 'deliveryAddress.lastName': { $exists: false } },
      { 'deliveryAddress.lastName': null },
      { 'deliveryAddress.lastName': '' },
    ],
  }).populate<{ user: IUser }>('user'); // Populate the user field

  console.log(`Found ${ordersToUpdate.length} orders to potentially update.`);

  let updatedCount = 0;
  let userNotFoundOrNoIdCount = 0;
  let noUserAddressCount = 0;
  let userAddressIncompleteCount = 0;
  let noUpdateNeededCount = 0;

  for (const order of ordersToUpdate) {
    const user = order.user;

    if (!user || !user._id) {
      console.log(`Order ${order._id}: User not found or user data is incomplete. Skipping.`);
      userNotFoundOrNoIdCount++;
      continue;
    }

    if (!user.address || user.address.length === 0) {
      console.log(`Order ${order._id}: User ${user._id} has no addresses. Skipping.`);
      noUserAddressCount++;
      continue;
    }

    let addressToUse: IEmbeddedAddress | undefined = user.address.find(addr => addr.isDefault);
    if (!addressToUse) {
      addressToUse = user.address[0]; // Fallback to the first address
    }

    if (!addressToUse || !addressToUse.firstName || !addressToUse.lastName || !addressToUse.phoneNumber || !addressToUse.address1 || !addressToUse.city || !addressToUse.state || !addressToUse.zipCode || !addressToUse.country) {
      console.log(`Order ${order._id}: User ${user._id}'s selected address is missing one or more required fields (firstName, lastName, phoneNumber, address1, city, state, zipCode, country). Skipping.`);
      userAddressIncompleteCount++;
      continue;
    }

    let updateMade = false;
    
    // Ensure deliveryAddress object exists
    if (!order.deliveryAddress) {
      // This case should ideally not happen if the schema enforces deliveryAddress,
      // but as a safeguard if some old documents are malformed.
      // @ts-ignore
      order.deliveryAddress = {}; 
    }

    // Update missing fields
    if (!order.deliveryAddress.firstName && addressToUse.firstName) {
      order.deliveryAddress.firstName = addressToUse.firstName;
      updateMade = true;
    }
    if (!order.deliveryAddress.lastName && addressToUse.lastName) {
      order.deliveryAddress.lastName = addressToUse.lastName;
      updateMade = true;
    }
    if (!order.deliveryAddress.phoneNumber && addressToUse.phoneNumber) {
      order.deliveryAddress.phoneNumber = addressToUse.phoneNumber;
      updateMade = true;
    }
    if (!order.deliveryAddress.address1 && addressToUse.address1) {
      order.deliveryAddress.address1 = addressToUse.address1;
      updateMade = true;
    }
    if (addressToUse.address2 && !order.deliveryAddress.address2) { // address2 is optional
        order.deliveryAddress.address2 = addressToUse.address2;
        updateMade = true;
    }
    if (!order.deliveryAddress.city && addressToUse.city) {
      order.deliveryAddress.city = addressToUse.city;
      updateMade = true;
    }
    if (!order.deliveryAddress.state && addressToUse.state) {
      order.deliveryAddress.state = addressToUse.state;
      updateMade = true;
    }
    if (!order.deliveryAddress.zipCode && addressToUse.zipCode) {
      order.deliveryAddress.zipCode = addressToUse.zipCode;
      updateMade = true;
    }
    if (!order.deliveryAddress.country && addressToUse.country) {
      order.deliveryAddress.country = addressToUse.country;
      updateMade = true;
    }

    if (updateMade) {
      try {
        await order.save();
        console.log(`Order ${order._id}: Successfully updated deliveryAddress from user ${user._id}.`);
        updatedCount++;
      } catch (e) {
        console.error(`Order ${order._id}: Failed to save - ${e instanceof Error ? e.message : String(e)}`);
      }
    } else {
      console.log(`Order ${order._id}: No updates were necessary for deliveryAddress fields based on user ${user._id}'s address.`);
      noUpdateNeededCount++;
    }
  }

  console.log("\\n--- Migration Summary ---");
  console.log(`Total orders queried: ${ordersToUpdate.length}`);
  console.log(`Orders successfully updated: ${updatedCount}`);
  console.log(`Orders where user was not found or incomplete: ${userNotFoundOrNoIdCount}`);
  console.log(`Orders where user had no addresses: ${noUserAddressCount}`);
  console.log(`Orders where user's address was incomplete: ${userAddressIncompleteCount}`);
  console.log(`Orders where no update was deemed necessary: ${noUpdateNeededCount}`);
  console.log("-------------------------\\n");

  await mongoose.disconnect();
  console.log("Disconnected from database.");
}

migrateOrderAddresses().catch(err => {
  console.error("Migration script failed:", err);
  mongoose.disconnect().finally(() => process.exit(1));
});
