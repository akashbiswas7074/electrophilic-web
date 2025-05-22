"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Menu, ShoppingCart, User, X, Heart, Search } from "lucide-react"; // Import icons
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext"; // Import useWishlist
import CartDrawer from "./CartDrawer";
import Image from "next/image";
import TopBarComponent from "../TopBar";
import NavbarInput from "./NavbarInput"; // Import NavbarInput
import MobileSpecificHeader from "./MobileSpecificHeader"; // Import the new component
import BottomNavigationBar from "./BottomNavigationBar"; // Import BottomNavigationBar
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
import SearchModal from "./SearchModal"; // Import the new SearchModal component
import { useNavbarLinks } from "@/hooks/use-navbar-links";

const Navbar = () => {
  const { data: session, status } = useSession();
  const { removeItem, updateItemQuantity, isCartDrawerOpen, setCartDrawerOpen } = useCart();
  const { wishlist, isLoading: isWishlistLoading } = useWishlist(); // Use the wishlist hook
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [show, setShow] = useState("translate-y-0"); // State for scroll effect
  const [lastScrollY, setLastScrollY] = useState(0); // State for scroll direction
  const cartItems = useCartStore((state: any) => state.cart?.cartItems || []);
  const [isMobile, setIsMobile] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [openSearchModal, setOpenSearchModal] = useState(false);
  const { links: navbarLinks, loading: navLinksLoading } = useNavbarLinks(); // Get navbar links from hook

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768); // md breakpoint
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle scroll effect for hide/show
  useEffect(() => {
    const controlNavbar = () => {
      if (window.scrollY > 200) { // Start effect after scrolling down 200px
        if (window.scrollY > lastScrollY && !isMobileMenuOpen) {
          setShow("-translate-y-full"); // Hide navbar
        } else {
          setShow("shadow-md"); // Show navbar with shadow
        }
      } else {
        setShow("translate-y-0"); // Keep navbar visible at the top
      }
      setLastScrollY(window.scrollY);
    };
    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);  }, [lastScrollY, isMobileMenuOpen]); // Remove isMobile dependency
  
  // Toggle search visibility on mobile
  const toggleSearch = () => {
    // Instead of toggling the inline search, directly open the search modal
    setOpenSearchModal(true);
  };

  // Use dynamic navbar links if available, otherwise use default fallback links
  const navItems = navbarLinks.length > 0 
    ? navbarLinks 
    : [
        { label: "BEST SELLERS", href: "/#bestsellers" },
        { label: "NEW ARRIVALS", href: "/#new-arrivals" },
        { label: "SHOP", href: "/shop" },
        { label: "CONTACT", href: "/contact" },
      ];

  return (
    <> {/* React Fragment to house both navbars as siblings */}
      <div className={`fixed top-0 left-0 right-0 z-[100] transition-transform duration-300 ${show}`}> 
        {/* Uncomment the Mobile Specific Header for personalized mobile experience */}
        {/* <MobileSpecificHeader /> */}

        <TopBarComponent /> 
        <nav className={`
          w-full
          transition-all duration-300 ease-in-out
          bg-white border-b border-gray-200
          shadow-sm
        `}>
          <div className="px-3 lg:px-6 mx-auto">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/" className="flex items-center relative z-10 group md:left-0 px-3">
                <div className="relative h-10 w-36 transition-all duration-300 group-hover:opacity-80">
                  <span className="text-gray-900 text-xl font-bold tracking-wider"> 
                    POUL <span className="font-light">&</span> CO
                  </span>
                </div>
              </Link>

              {/* Desktop Navigation Links */}
              <div className="hidden md:flex items-center gap-8">
                {navItems.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    className="text-sm font-medium text-gray-700 hover:text-black transition-colors 
                      relative after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] 
                      after:w-0 after:bg-black after:transition-all hover:after:w-full"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>              {/* Desktop Search Input */}
              <div className="hidden lg:flex flex-1 justify-center px-4">
                <NavbarInput responsive={false} />
              </div>

              {/* Mobile Search Modal */}
              {openSearchModal && <SearchModal setOpen={setOpenSearchModal} />}

              {/* Right section */}
              <div className="flex items-center gap-3">                {/* Search Toggle for Mobile */}
                <button 
                  onClick={toggleSearch}
                  className="md:hidden p-2.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-300 active:scale-95 hover:shadow-md text-gray-800 flex items-center justify-center"
                  aria-label="Toggle search"
                >
                  <Search size={22} className="text-gray-700" />
                </button>
                
                {/* Wishlist Icon */}
                <Link href="/wishlist" passHref>
                  <button
                    className="relative p-2.5 hover:bg-black/5 rounded-full transition-all duration-300
                      active:scale-95 hover:shadow-sm text-gray-800"
                  >
                    <Heart className="h-[22px] w-[22px]" />
                    {!isWishlistLoading && wishlist.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-600 text-white 
                        text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center
                        shadow-sm ring-2 ring-white animate-in zoom-in"
                      >
                        {wishlist.length}
                      </span>
                    )}
                  </button>
                </Link>

                {/* Cart */}
                <button 
                  onClick={() => setCartDrawerOpen(true)}
                  className="relative p-2.5 hover:bg-black/5 rounded-full transition-all duration-300 active:scale-95 hover:shadow-sm text-gray-800"
                >
                  <ShoppingCart className="h-[22px] w-[22px]" />
                  {/* Calculate total items by summing up all quantities */}
                  {Array.isArray(cartItems) && cartItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center shadow-sm ring-2 ring-white animate-in zoom-in">
                      {cartItems.reduce((total, item) => {
                        // Handle different ways quantity might be stored
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
                      {/* Adjust avatar styling for white background */}
                      <Avatar className="h-10 w-10 cursor-pointer ring-2 ring-gray-200 hover:ring-gray-400 
                        transition-all duration-300 hover:shadow-md">
                        <AvatarImage src={session?.user?.image || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700">
                          {session?.user?.name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-white">
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
                      size="default"
                      className="hover:bg-gray-100 text-gray-800 border-gray-300 hover:border-gray-400
                        transition-all duration-300 shadow-sm hover:shadow-md active:scale-95"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Sign In
                    </Button>
                  </Link>
                )}

                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden hover:bg-black/5 rounded-full transition-all duration-300
                    active:scale-95 text-gray-800"
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile menu */}
        <div className={`
          fixed inset-0 z-[110] 
          transition-opacity duration-300
          ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}>
          <div className={`
            absolute top-0 right-0 h-full w-full max-w-sm bg-white 
            flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.1)] 
            transition-transform duration-300 ease-in-out
            ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
          `}>            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-medium text-gray-900">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-black/5 rounded-full transition-all duration-300
                  active:scale-95"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-6 w-6 text-gray-700" />
              </Button>
            </div>
            
            {/* Mobile search inside menu */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="relative group" onClick={toggleSearch}>
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-hover:text-black transition-colors duration-200"
                  size={18}
                />
                <input
                  type="search"
                  placeholder="Search products..."
                  className="pl-10 pr-12 py-2.5 w-full bg-gray-50 border border-gray-200 rounded-full focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
                  readOnly
                />
                <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden sm:flex items-center justify-center text-[10px] font-sans font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                  <span className="mr-0.5">⌘</span>K
                </kbd>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 py-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-6 py-3 text-lg text-gray-700 hover:bg-gray-100 
                    transition-all duration-300 active:scale-[0.98]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {/* Additional mobile menu items */}
              <div className="border-t border-gray-200 mt-6 pt-6">
                <Link
                  href="/wishlist"
                  className="flex items-center px-6 py-3 text-lg text-gray-700 hover:bg-gray-100 
                    transition-all duration-300 active:scale-[0.98]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Heart className="h-5 w-5 mr-3" />
                  Wishlist
                  {!isWishlistLoading && wishlist.length > 0 && (
                    <span className="ml-2 bg-red-600 text-white text-xs font-medium rounded-full h-5 w-5 
                      flex items-center justify-center">
                      {wishlist.length}
                    </span>
                  )}
                </Link>
                <Link
                  href="/orders"
                  className="flex items-center px-6 py-3 text-lg text-gray-700 hover:bg-gray-100 
                    transition-all duration-300 active:scale-[0.98]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3">
                    <path d="M21 8a2 2 0 0 0-2-2h-1a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8z"></path>
                    <path d="M8 6h8"></path>
                    <path d="M8 10h8"></path>
                    <path d="M8 14h6"></path>
                  </svg>
                  My Orders
                </Link>
              </div>
            </div>
            
            {/* User section in mobile menu */}
            <div className="p-6 border-t border-gray-200">
              {status === "authenticated" ? (
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={session?.user?.image || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700">
                      {session?.user?.name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{session?.user?.name}</p>
                    <p className="text-xs text-gray-500">{session?.user?.email}</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => { 
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Link href="/auth/signin">
                  <Button
                    className="w-full flex items-center justify-center py-6"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5 mr-2" />
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Cart Drawer */}
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
      </div>

      {/* Bottom Navigation Bar (only on mobile) - Now a sibling to the above div */}
      <BottomNavigationBar />
    </>
  );
};

export default Navbar;