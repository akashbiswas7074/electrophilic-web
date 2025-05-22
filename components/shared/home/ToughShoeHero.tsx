import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const ToughShoeHero = () => {
  return (
    <div className="bg-white py-16 md:py-24">
      <div className="container mx-auto px-4 text-center flex flex-col items-center">
        {/* <p className="text-sm font-medium text-gray-600 mb-2 tracking-wide">
          Luka .77 'Space Navigator'
        </p> */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-black uppercase leading-none mb-4 max-w-2xl">
          A Shoe As Tough <br className="hidden sm:inline" /> As Luka&apos;s Game
        </h1>
        <p className="text-base md:text-lg text-gray-700 mb-8 max-w-lg">
          Concrete. Double Rims. Built for the outdoor game.
        </p>
        <Link href="/shop" passHref>
          <Button 
            size="lg" 
            className="bg-black text-white hover:bg-gray-800 rounded-md px-10 py-3 h-auto text-base font-semibold"
            aria-label="Shop Luka .77 Space Navigator shoes"
          >
            Shop
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ToughShoeHero;