// /home/akashbiswas7797/Desktop/vibecart/lib/database/models/index.ts

// This file's purpose is to ensure all Mongoose models are registered
// in a predictable order by importing them. This is particularly important
// in environments like Next.js with hot-reloading and serverless functions.

// Import base models first (those with fewer or no dependencies on other models in this list)
import './user.model';
import './category.model';
import './subCategory.model'; // Critical for the current error
import './color.model';
import './size.model';
import './vendor.model';

// Import models that might depend on the base models above
import './product.model'; // Depends on User, Category, SubCategory

// Import remaining models. Their order might need adjustment if they have strict interdependencies.
import './banner.model';
import './cart.model';
import './coupon.model';
import './featured.video.model';
import './home.screen.offers.ts'; // As listed in file search
import './order.model';
import './pending-cod-order.model';
import './topbar.model';
import './wishlist.model';

// Optional: Re-export models if you prefer importing them via this index file.
// e.g., export { default as User } from './user.model';
// For now, the primary goal is registration via side-effect imports.
