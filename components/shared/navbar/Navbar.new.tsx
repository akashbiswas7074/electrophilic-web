"use client";

import React, { useState, useEffect, lazy, Suspense } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Menu, ShoppingCart, User, X, Heart, Search } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import Image from "next/image";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";
import { useCartStore } from "@/store/cart";
import { useWebsiteLogo } from "@/hooks/use-website-logo";
import { useSiteConfig } from "@/hooks/use-site-config";
import { useNavbarLinks } from "@/hooks/use-navbar-links";

// Lazy load heavy components that aren't critical for initial render
const CartDrawer = lazy(() => import("./CartDrawer"));
const TopBarComponent = lazy(() => import("../TopBar"));
const NavbarInput = lazy(() => import("./NavbarInput"));
const MobileSpecificHeader = lazy(() => import("./MobileSpecificHeader"));
const BottomNavigationBar = lazy(() => import("./BottomNavigationBar"));
const SearchModal = lazy(() => import("./SearchModal"));

// Loading skeletons for lazy components
const CartDrawerSkeleton = () => (
  <div className="fixed inset-0 z-50 bg-black/50 opacity-0 pointer-events-none" />
);

const TopBarSkeleton = () => (
  <div className="bg-gray-100 h-8 animate-pulse">
    <div className="container mx-auto px-4 h-full flex items-center justify-center">
      <div className="h-3 w-48 bg-gray-200 rounded"></div>
    </div>
  </div>
);

const NavbarInputSkeleton = () => (
  <div className="w-full max-w-xl h-10 bg-gray-200 rounded-full animate-pulse"></div>
);

// New skeleton components for logo and navigation links
const LogoSkeleton = () => (
  <div className="flex items-center relative z-10 flex-shrink-0">
    <div className="relative h-8 w-24 sm:h-10 sm:w-32 lg:w-36 bg-gray-200 rounded animate-pulse"></div>
  </div>
);

const NavLinksSkeleton = () => (
  <div className="hidden md:flex items-center gap-6 lg:gap-8 flex-1 justify-center">
    {[...Array(5)].map((_, index) => (
      <div 
        key={index}
        className="h-4 lg:h-5 bg-gray-200 rounded animate-pulse"
        style={{ width: `${Math.random() * 60 + 60}px` }}
      ></div>
    ))}
  </div>
);

const MobileNavLinksSkeleton = () => (
  <div className="overflow-y-auto flex-1 py-4 sm:py-6">
    {[...Array(5)].map((_, index) => (
      <div
        key={index}
        className="px-4 sm:px-6 py-3 border-b border-gray-50 last:border-b-0"
      >
        <div 
          className="h-5 sm:h-6 bg-gray-200 rounded animate-pulse"
          style={{ width: `${Math.random() * 100 + 100}px` }}
        ></div>
      </div>
    ))}
  </div>
);

const BottomNavSkeleton = () => (
  <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 lg:hidden animate-pulse">
    <div className="flex items-center justify-around h-full px-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex flex-col items-center justify-center flex-1 py-2">
          <div className="h-6 w-6 bg-gray-200 rounded mb-1"></div>
          <div className="h-3 w-8 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

const Navbar = () => {
  const { data: session, status } = useSession();
  const { removeItem, updateItemQuantity, isCartDrawerOpen, setCartDrawerOpen } = useCart();
  const { wishlist, isLoading: isWishlistLoading } = useWishlist();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [show, setShow] = useState("translate-y-0");
  const [lastScrollY, setLastScrollY] = useState(0);
  const cartItems = useCartStore((state: any) => state.cart?.cartItems || []);
  const [isMobile, setIsMobile] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [openSearchModal, setOpenSearchModal] = useState(false);
  const { logo, isLoading: isLogoLoading } = useWebsiteLogo();
  const siteConfig = useSiteConfig();
  const { links: navbarLinks, loading: navLinksLoading } = useNavbarLinks();
  const pathname = usePathname();

  // Check if we're on an auth page
  const isAuthPage = pathname?.startsWith('/auth/');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const controlNavbar = () => {
      if (window.scrollY > 200) {
        if (window.scrollY > lastScrollY && !isMobileMenuOpen) {
          setShow("-translate-y-full");
        } else {
          setShow("shadow-md");
        }
      } else {
        setShow("translate-y-0");
      }
      setLastScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY, isMobileMenuOpen]);

  const toggleSearch = () => {
    setOpenSearchModal(true);
  };

  const navItems = navbarLinks.length > 0 
    ? navbarLinks 
    : [
        { label: "BEST SELLERS", href: "#bestsellers" },
        { label: "NEW ARRIVALS", href: "#new-arrivals" },
        { label: "SHOP", href: "/shop" },
        { label: "CONTACT", href: "/contact" },
        { label: "ORDERS", href: "/orders" },
      ];

  const logoUrl = logo?.logoUrl || siteConfig.logo.imagePath;
  const altText = logo?.altText || siteConfig.name;
  const logoText = logo?.name || siteConfig.logo.text;
  const showLogoImage = logo?.logoUrl || siteConfig.logo.useImage;
  const mobileLogoUrl = logo?.mobileLogoUrl || logoUrl;

  return (
    <>
      <div className={`fixed top-0 left-0 right-0 z-[100] transition-transform duration-300 ${show}`}> 
        <Suspense fallback={<TopBarSkeleton />}>
          <TopBarComponent /> 
        </Suspense>
        
        <nav className="w-full transition-all duration-300 ease-in-out bg-white border-b border-gray-200 shadow-sm">
          <div className="px-2 sm:px-4 lg:px-6 mx-auto max-w-7xl">
            <div className="flex items-center justify-between h-14 sm:h-16">
              {/* Logo */}
              {isLogoLoading ? (
                <LogoSkeleton />
              ) : (
                <Link href="/" className="flex items-center relative z-10 group flex-shrink-0">
                  {showLogoImage ? (
                    <div className="relative h-8 w-24 sm:h-10 sm:w-32 lg:w-36 transition-all duration-300 group-hover:opacity-80">
                      <Image 
                        src={isMobile ? mobileLogoUrl : logoUrl} 
                        alt={altText}
                        fill
                        className="object-contain"
                        priority
                      />
                    </div>
                  ) : (
                    <div className="relative h-8 w-24 sm:h-10 sm:w-32 lg:w-36 transition-all duration-300 group-hover:opacity-80">
                      <span className="text-gray-900 text-lg sm:text-xl font-bold tracking-wider truncate">{logoText}</span>
                    </div>
                  )}
                </Link>
              )}

              {/* Desktop Navigation Links - Centered */}
              {navLinksLoading ? (
                <NavLinksSkeleton />
              ) : (
                <div className="hidden md:flex items-center gap-6 lg:gap-8 flex-1 justify-center">
                  {navItems.map((item) => (
                    <Link 
                      key={item.href} 
                      href={item.href} 
                      className="text-sm lg:text-base font-medium text-gray-700 hover:text-black transition-all duration-300
                        relative after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] 
                        after:w-0 after:bg-black after:transition-all hover:after:w-full whitespace-nowrap
                        py-2 px-1"
                  >
                    {item.label}
                  </Link>
                  ))}
                </div>
              )}

              {/* Mobile Search (toggle) */}
              <div className={`${isSearchVisible ? 'flex absolute top-14 sm:top-16 left-0 right-0 z-20 px-2 sm:px-4 py-3 bg-white shadow-lg border-b' : 'hidden'} md:hidden`}>
                <Suspense fallback={<NavbarInputSkeleton />}>
                  <NavbarInput responsive={true} />
                </Suspense>
              </div>

              {/* Right section - Action buttons */}
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {/* Search Button */}
                <button 
                  onClick={toggleSearch}
                  className="p-2 hover:bg-gray-100 rounded-full transition-all duration-300 
                    active:scale-95 hover:shadow-sm text-gray-700 hover:text-black group"
                  title="Search"
                >
                  <Search className="h-5 w-5 sm:h-[22px] sm:w-[22px] transition-colors duration-300" />
                </button>
                
                {/* Wishlist Icon */}
                <Link href="/wishlist" passHref>
                  <button
                    className="relative p-2 hover:bg-gray-100 rounded-full transition-all duration-300
                      active:scale-95 hover:shadow-sm text-gray-700 hover:text-black"
                    title="Wishlist"
                  >
                    <Heart className="h-5 w-5 sm:h-[22px] sm:w-[22px] transition-colors duration-300" />
                    {!isWishlistLoading && wishlist.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white 
                        text-xs font-semibold rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center
                        shadow-sm ring-2 ring-white animate-in zoom-in text-[10px] sm:text-xs min-w-[16px] sm:min-w-[20px]"
                      >
                        {wishlist.length > 99 ? '99+' : wishlist.length}
                      </span>
                    )}
                  </button>
                </Link>

                {/* Cart */}
                <button 
                  onClick={() => setCartDrawerOpen(true)}
                  className="relative p-2 hover:bg-gray-100 rounded-full transition-all duration-300 
                    active:scale-95 hover:shadow-sm text-gray-700 hover:text-black"
                  title="Shopping Cart"
                >
                  <ShoppingCart className="h-5 w-5 sm:h-[22px] sm:w-[22px] transition-colors duration-300" />
                  {Array.isArray(cartItems) && cartItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full 
                      h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center shadow-sm ring-2 ring-white 
                      animate-in zoom-in text-[10px] sm:text-xs min-w-[16px] sm:min-w-[20px]">
                      {cartItems.reduce((total, item) => {
                        const itemQty = Number(item?.quantity || item?.qty || 0);
                        return total + itemQty;
                      }, 0) > 99 ? '99+' : cartItems.reduce((total, item) => {
                        const itemQty = Number(item?.quantity || item?.qty || 0);
                        return total + itemQty;
                      }, 0)}
                    </span>
                  )}
                </button>

                {/* Auth Section */}
                {status === "authenticated" ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Avatar className="h-8 w-8 sm:h-9 sm:w-9 cursor-pointer ring-2 ring-gray-200 hover:ring-gray-300 
                        transition-all duration-300 hover:shadow-md flex-shrink-0 ml-1">
                        <AvatarImage src={session?.user?.image || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 text-sm font-medium">
                          {session?.user?.name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-white shadow-lg border border-gray-200">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                          <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="cursor-pointer">
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => signOut()}
                        className="text-red-600 focus:text-red-600 cursor-pointer"
                      >
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link href="/auth/signin">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400
                        transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 text-xs px-3 py-2 ml-1
                        font-medium"
                    >
                      <User className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Sign In</span>
                      <span className="sm:hidden">Login</span>
                    </Button>
                  </Link>
                )}

                {/* Mobile menu button - hide on auth pages and when logged in */}
                {!isAuthPage && status !== "authenticated" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden hover:bg-gray-100 rounded-full transition-all duration-300
                      active:scale-95 text-gray-700 h-8 w-8 sm:h-9 sm:w-9 p-2 ml-1"
                    onClick={() => setIsMobileMenuOpen(true)}
                  >
                    <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile menu - improved responsive design */}
        <div className={`
          fixed inset-0 z-[110] 
          transition-opacity duration-300
          ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}>
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          <div className={`
            absolute top-0 right-0 h-full w-full max-w-xs sm:max-w-sm bg-white 
            flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.1)] 
            transition-transform duration-300 ease-in-out
            ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
          `}>
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-medium text-gray-900">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-black/5 rounded-full transition-all duration-300
                  active:scale-95 h-8 w-8 p-1.5"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-5 w-5 text-gray-700" />
              </Button>
            </div>

            {/* Mobile search inside menu */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <Suspense fallback={<NavbarInputSkeleton />}>
                <NavbarInput responsive={true} />
              </Suspense>
            </div>

            <div className="overflow-y-auto flex-1 py-4 sm:py-6">
              {/* Mobile Navigation Links */}
              {navLinksLoading ? (
                <MobileNavLinksSkeleton />
              ) : (
                <div className="overflow-y-auto flex-1 py-4 sm:py-6">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-4 sm:px-6 py-3 text-base sm:text-lg text-gray-700 hover:bg-gray-100 
                        transition-all duration-300 active:scale-[0.98] border-b border-gray-50 last:border-b-0"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                  
                  {/* Additional mobile menu items */}
                  <div className="border-t border-gray-200 mt-4 sm:mt-6 pt-4 sm:pt-6">
                    <Link
                      href="/wishlist"
                      className="flex items-center px-4 sm:px-6 py-3 text-base sm:text-lg text-gray-700 hover:bg-gray-100 
                        transition-all duration-300 active:scale-[0.98]"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Heart className="h-5 w-5 mr-3 flex-shrink-0" />
                      <span>Wishlist</span>
                      {!isWishlistLoading && wishlist.length > 0 && (
                        <span className="ml-2 bg-red-600 text-white text-xs font-medium rounded-full h-5 w-5 
                          flex items-center justify-center flex-shrink-0">
                          {wishlist.length > 99 ? '99+' : wishlist.length}
                        </span>
                      )}
                    </Link>
                    <Link
                      href="/orders"
                      className="flex items-center px-4 sm:px-6 py-3 text-base sm:text-lg text-gray-700 hover:bg-gray-100 
                        transition-all duration-300 active:scale-[0.98]"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 flex-shrink-0">
                        <path d="M21 8a2 2 0 0 0-2-2h-1a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8z"></path>
                        <path d="M8 6h8"></path>
                        <path d="M8 10h8"></path>
                        <path d="M8 14h6"></path>
                      </svg>
                      My Orders
                    </Link>
                  </div>
                </div>
              )}
            </div>
            
            {/* User section in mobile menu */}
            <div className="p-4 sm:p-6 border-t border-gray-200">
              {status === "authenticated" ? (
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                    <AvatarImage src={session?.user?.image || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700">
                      {session?.user?.name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">{session?.user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => { 
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-xs px-2 py-1 flex-shrink-0"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Link href="/auth/signin">
                  <Button
                    className="w-full flex items-center justify-center py-3 sm:py-6"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Cart Drawer */}
        <Suspense fallback={<CartDrawerSkeleton />}>
          <CartDrawer
            isOpen={isCartDrawerOpen}
            onClose={() => {
              setCartDrawerOpen(false); 
              try {
                const storeState = useCartStore.getState();
                if (storeState && typeof storeState.setCartDrawerOpen === 'function') {
                  storeState.setCartDrawerOpen(false);
                }
              } catch (error) {
                // handle error
              }
            }}
          />
        </Suspense>

        {/* Search Modal */}
        {openSearchModal && (
          <Suspense fallback={null}>
            <SearchModal setOpen={setOpenSearchModal} />
          </Suspense>
        )}
      </div>

      {/* Bottom Navigation Bar (only on mobile) */}
      <Suspense fallback={<BottomNavSkeleton />}>
        <BottomNavigationBar />
      </Suspense>
    </>
  );
};

export default Navbar;
