"use client";

import React from "react";
import { Home, User, ShoppingBag, Package } from "lucide-react"; 
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ href, icon: Icon, label, isActive, onClick }) => {
  return (
    <Link href={href} legacyBehavior>
      <a
        onClick={onClick}
        className={`
          flex flex-col items-center justify-center flex-1 py-2 // Added py-2 for vertical padding
          transition-colors transition-transform duration-300 ease-in-out // Transitions for color and transform (scale)
          transform hover:scale-105 group // Apply a slight scale on hover to the whole item
          ${isActive 
            ? "text-red-500" // Active: red text
            : "text-gray-500 hover:text-red-500" // Inactive: gray, hover to red
          }
        `}
      >
        <Icon 
          size={24} 
          strokeWidth={isActive ? 2.5 : 2} 
          className={`
            transition-transform duration-300 ease-out // Specific transition for icon's vertical movement
            ${isActive ? "-translate-y-1.5" : "translate-y-0"} // Active icon moves up by 6px (-0.375rem), inactive is at baseline
          `}
        />
        <span 
          className={`
            text-xs font-medium transition-opacity duration-300 ease-in-out pt-0.5 // Added small top padding for spacing
            ${isActive ? "opacity-100 font-semibold" : "opacity-90 group-hover:opacity-100"}
          `}
        >
          {label}
        </span>
      </a>
    </Link>
  );
};

const BottomNavigationBar = () => {
  const pathname = usePathname();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/shop", icon: ShoppingBag, label: "Shop" },
    { href: "/orders", icon: Package, label: "Orders" },
    { href: "/contact", icon: () => (
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="w-6 h-6"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ), label: "Contact" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-t-lg z-50 lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={pathname === item.href}
          />
        ))}
      </div>
    </div>
  );
};

export default BottomNavigationBar;
