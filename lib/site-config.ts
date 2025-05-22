export interface SiteConfig {
  name: string;
  description: string;
  logo: {
    useImage: boolean;
    imagePath: string;
    showText: boolean;
    text: string;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  social: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
}

export const siteConfig: SiteConfig = {
  name: "POUL & CO",
  description: "Premium fashion e-commerce store",
  logo: {
    useImage: true,
    imagePath: "/images/logo.png",
    showText: true,
    text: "POUL & CO"
  },
  contact: {
    email: "support@poulandco.com",
    phone: "+1 (123) 456-7890",
    address: "123 Fashion Street, New York, NY 10001"
  },
  social: {
    facebook: "https://facebook.com/poulandco",
    instagram: "https://instagram.com/poulandco",
    twitter: "https://twitter.com/poulandco"
  }
}