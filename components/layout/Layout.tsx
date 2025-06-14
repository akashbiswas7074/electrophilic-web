import { ReactNode, Suspense, lazy } from 'react';

// Lazy load the Navbar and Footer components - using only Navbar.new
const Navbar = lazy(() => import('@/components/shared/navbar/Navbar.new'));
const Footer = lazy(() => import('@/components/shared/Footer'));

// Enhanced loading fallback components with better skeletons
const NavbarSkeleton = () => (
  <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
    {/* Top bar skeleton */}
    <div className="bg-gray-100 h-8 animate-pulse">
      <div className="container mx-auto px-4 h-full flex items-center justify-center">
        <div className="h-3 w-48 bg-gray-200 rounded"></div>
      </div>
    </div>
    
    {/* Main navbar skeleton */}
    <div className="container mx-auto px-4 h-16 flex items-center justify-between animate-pulse">
      <div className="h-8 w-32 bg-gray-200 rounded"></div>
      
      {/* Desktop navigation links */}
      <div className="hidden md:flex space-x-6">
        <div className="h-4 w-16 bg-gray-200 rounded"></div>
        <div className="h-4 w-20 bg-gray-200 rounded"></div>
        <div className="h-4 w-12 bg-gray-200 rounded"></div>
        <div className="h-4 w-16 bg-gray-200 rounded"></div>
      </div>
      
      {/* Search bar skeleton */}
      <div className="hidden lg:flex flex-1 justify-center px-4">
        <div className="w-full max-w-xl h-10 bg-gray-200 rounded-full"></div>
      </div>
      
      {/* Right section icons */}
      <div className="flex items-center space-x-4">
        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
      </div>
    </div>
  </div>
);

const FooterSkeleton = () => (
  <div className="bg-gray-50 border-t border-gray-200 animate-pulse">
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {/* Logo and company info */}
        <div className="space-y-4">
          <div className="h-8 w-40 bg-gray-200 rounded"></div>
          <div className="h-4 w-full bg-gray-200 rounded"></div>
          <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
          <div className="flex space-x-3">
            <div className="h-5 w-5 bg-gray-200 rounded"></div>
            <div className="h-5 w-5 bg-gray-200 rounded"></div>
            <div className="h-5 w-5 bg-gray-200 rounded"></div>
          </div>
        </div>
        
        {/* Footer sections */}
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="h-6 w-24 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="h-4 w-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Bottom section */}
      <div className="mt-12 pt-8 border-t border-gray-300">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="h-4 w-48 bg-gray-200 rounded"></div>
          <div className="h-4 w-64 bg-gray-200 rounded mt-4 md:mt-0"></div>
        </div>
      </div>
    </div>
  </div>
);

// Error boundary component for lazy loaded components
const LazyLoadErrorBoundary = ({ children, fallback }: { children: ReactNode; fallback: ReactNode }) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* Lazy loaded Navbar with enhanced skeleton */}
      <LazyLoadErrorBoundary fallback={<NavbarSkeleton />}>
        <Navbar />
      </LazyLoadErrorBoundary>
      
      {/* Main content area with proper spacing */}
      <main className="flex-grow pt-24 w-full">
        {children}
      </main>
      
      {/* Lazy loaded Footer with enhanced skeleton */}
      <LazyLoadErrorBoundary fallback={<FooterSkeleton />}>
        <Footer />
      </LazyLoadErrorBoundary>
    </div>
  );
}
