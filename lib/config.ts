/**
 * Site-wide configuration settings
 * Centralized place for managing global site properties
 */

export const siteConfig = {
  name: "POUL & CO", // Default company name
  logo: {
    text: "POUL & CO", // Text to use as logo
    showText: true, // Whether to show text or only image
    imagePath: "/images/logo.png", // Path to logo image (if using)
    useImage: false, // Whether to use image logo
  },
  contact: {
    email: "contact@poulandco.com",
    phone: "+1 (123) 456-7890",
    address: "123 Fashion Street, New York, NY 10001", // Added missing address property
  },
  social: {
    instagram: "https://instagram.com/poulandco",
    facebook: "https://facebook.com/poulandco",
    twitter: "https://twitter.com/poulandco",
  },
  // Add other site-wide configurations as needed
};