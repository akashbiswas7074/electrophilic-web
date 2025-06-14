'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, User, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  return (
    <header className={`bg-white shadow-sm border-b ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-primary">Electrophilic</span>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/shop" className="text-gray-600 hover:text-primary transition-colors">
              Shop
            </Link>
            <Link href="/categories" className="text-gray-600 hover:text-primary transition-colors">
              Categories
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-primary transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-gray-600 hover:text-primary transition-colors">
              Contact
            </Link>
          </nav>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-10 pr-4"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Button - Mobile */}
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Search size={20} />
            </Button>

            {/* User Account */}
            <Button variant="ghost" size="icon">
              <User size={20} />
            </Button>

            {/* Shopping Cart */}
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart size={20} />
              <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                0
              </span>
            </Button>

            {/* Mobile Menu */}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu size={20} />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;