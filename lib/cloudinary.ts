import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
  secure: true, // Use https
});

// Add error handling for Cloudinary configuration
try {
  // Test connection by requesting account info
  cloudinary.api.ping((error, result) => {
    if (error) {
      console.error("Cloudinary configuration error:", error);
    } else {
      console.log("Cloudinary connected successfully");
    }
  });
} catch (error) {
  console.error("Failed to initialize Cloudinary:", error);
}

export default cloudinary;
