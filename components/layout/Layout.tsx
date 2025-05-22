import { ReactNode } from 'react';
import Navbar from '@/components/shared/navbar/Navbar.new';
import Footer from '@/components/shared/Footer'; // Import the Footer component

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col w-full">
      <Navbar />
      {/* Main content area with full width and no side padding */}
      <main className="flex-grow pt-24 w-full">
        {children}
      </main>
      <Footer /> {/* Add the Footer component here */}
    </div>
  );
}
