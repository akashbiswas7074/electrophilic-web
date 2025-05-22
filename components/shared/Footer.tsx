'use client';

import { Facebook, Instagram, Youtube, AtSign, Twitter, Linkedin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useWebsiteLogo } from "@/hooks/use-website-logo";
import { useSiteConfig } from "@/hooks/use-site-config";
import { useWebsiteFooter } from "@/hooks/use-website-footer";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const { logo } = useWebsiteLogo();
  const siteConfig = useSiteConfig();
  const { footer } = useWebsiteFooter();
  
  // Determine which logo to use - from database or fallback to site config
  const logoUrl = logo?.logoUrl || siteConfig.logo.imagePath;
  const altText = logo?.altText || siteConfig.name;
  const logoText = logo?.name || siteConfig.logo.text;
  const showLogoImage = logo?.logoUrl || siteConfig.logo.useImage;
  
  // Get footer name
  const footerName = footer?.name || "Main Footer";
  
  // Get contact info from footer configuration or fallback to site config
  const contactEmail = footer?.contactInfo?.email || siteConfig.contact.email;
  const contactPhone = footer?.contactInfo?.phone || siteConfig.contact.phone;
  const contactAddress = footer?.contactInfo?.address || siteConfig.contact.address;
  
  // Get social media links from footer or fallback to site config
  const socialLinks = footer?.socialMedia || siteConfig.social || {};

  // Get footer link sections or use defaults
  const companyLinks = footer?.companyLinks || [
    { title: "About Us", url: "/about" },
    { title: "Careers", url: "#" },
    { title: "Affiliates", url: "#" },
    { title: "Blog", url: "#" },
    { title: "Contact Us", url: "/contact" }
  ];

  const shopLinks = footer?.shopLinks || [
    { title: "New Arrivals", url: "#new-arrivals" },
    { title: "Accessories", url: "/shop?category=accessories" },
    { title: "Men", url: "/shop?category=men" },
    { title: "Women", url: "/shop?category=women" },
    { title: "All Products", url: "/shop" }
  ];

  const helpLinks = footer?.helpLinks || [
    { title: "Customer Service", url: "/contact" },
    { title: "My Account", url: "/profile" },
    { title: "Find a Store", url: "#" },
    { title: "Legal & Privacy", url: "#" },
    { title: "Gift Card", url: "#" }
  ];

  const copyrightText = footer?.copyrightText || `© ${new Date().getFullYear()} ${siteConfig.name}`;

  return (
    <footer className="bg-gray-50 text-gray-800 py-12 px-4 md:px-6 lg:px-8 border-t border-gray-200">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        <div className="space-y-4">
          {showLogoImage ? (
            <div className="relative h-8 w-40 mb-4">
              <Image 
                src={logoUrl} 
                alt={altText}
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <h2 className="text-2xl font-bold text-indigo-700">{logoText}</h2>
          )}
          <h3 className="text-lg font-medium text-indigo-600">{footerName}</h3>
          <p className="text-sm text-gray-600">
            {contactAddress}
          </p>
          <p className="text-sm text-gray-600">{contactEmail}</p>
          <p className="text-sm text-gray-600">{contactPhone}</p>
          <div className="flex space-x-4">
            {socialLinks.facebook && (
              <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-indigo-600 transition-colors">
                <Facebook size={20} />
              </a>
            )}
            {socialLinks.instagram && (
              <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-indigo-600 transition-colors">
                <Instagram size={20} />
              </a>
            )}
            {socialLinks.youtube && (
              <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-indigo-600 transition-colors">
                <Youtube size={20} />
              </a>
            )}
            {socialLinks.twitter && (
              <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-indigo-600 transition-colors">
                <Twitter size={20} />
              </a>
            )}
            {socialLinks.linkedin && (
              <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-indigo-600 transition-colors">
                <Linkedin size={20} />
              </a>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900">COMPANY</h3>
          <ul className="space-y-2 text-sm">
            {companyLinks.map((link, index) => (
              <li key={index} className="text-gray-600 hover:text-indigo-600 cursor-pointer transition-colors">
                <Link href={link.url}>{link.title}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900">SHOP</h3>
          <ul className="space-y-2 text-sm">
            {shopLinks.map((link, index) => (
              <li key={index} className="text-gray-600 hover:text-indigo-600 cursor-pointer transition-colors">
                <Link href={link.url}>{link.title}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900">HELP</h3>
          <ul className="space-y-2 text-sm">
            {helpLinks.map((link, index) => (
              <li key={index} className="text-gray-600 hover:text-indigo-600 cursor-pointer transition-colors">
                <Link href={link.url}>{link.title}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">SUBSCRIBE</h3>
          <p className="text-sm text-gray-600">
            Be the first to get the latest news about trends, promotions, new
            arrivals, discounts and more!
          </p>
          <div className="flex">
            <Input
              type="email"
              placeholder="Email Address"
              className="rounded-r-none border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            />
            <Button
              type="submit"
              className="rounded-l-none bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              JOIN
            </Button>
          </div>
          <p className="text-sm font-semibold text-gray-700">Secure Payments</p>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-gray-300 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
        <p>{copyrightText}</p>
        <div className="flex space-x-4 mt-4 md:mt-0">
          <span>Language</span>
          <span className="font-semibold text-gray-800">United States | English</span>
          <span>Currency</span>
          <span className="font-semibold text-gray-800">USD</span>
        </div>
      </div>
    </footer>
  );
}
