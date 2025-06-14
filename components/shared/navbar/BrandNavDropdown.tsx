'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useBrandLinks } from '@/hooks/use-brand-links';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from 'lucide-react';

const BrandNavDropdown = () => {
  const { brands, loading, error } = useBrandLinks();
  const [isOpen, setIsOpen] = useState(false);

  // Show max 8 brands in the dropdown, plus a "View All" option
  const displayBrands = brands.slice(0, 8);
  const hasMoreBrands = brands.length > 8;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button 
          className="text-sm font-medium text-gray-700 hover:text-black transition-colors 
            relative after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] 
            after:w-0 after:bg-black after:transition-all hover:after:w-full
            flex items-center gap-1"
        >
          BRANDS
          <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        {loading ? (
          <DropdownMenuLabel>Loading brands...</DropdownMenuLabel>
        ) : error ? (
          <DropdownMenuLabel className="text-red-500">Unable to load brands</DropdownMenuLabel>
        ) : (
          <>
            {displayBrands.map((brand) => (
              <DropdownMenuItem key={brand._id} asChild>
                <Link href={brand.href} className="w-full cursor-pointer">
                  {brand.name}
                </Link>
              </DropdownMenuItem>
            ))}
            
            {hasMoreBrands && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/brands" className="w-full cursor-pointer font-medium text-blue-600">
                    View All Brands
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default BrandNavDropdown;