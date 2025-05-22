// /home/akashbiswas7797/Desktop/vibecart/components/shared/home/StrengthTakesSweat.tsx
import { Button } from "@/components/ui/button";
import Link from "next/link";

const StrengthTakesSweat = () => {
  return (
    <section className="py-12 md:py-16 bg-white text-center">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-black mb-4">
          STRENGTH TAKES SWEAT
        </h2>
        <p className="text-base md:text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
          The training styles that aren&apos;t afraid to put in the work.
        </p>
        <div className="flex justify-center space-x-4">
          <Link href="/shop?category=men" passHref>
            <Button 
              variant="default" 
              size="lg" 
              className="bg-black text-white hover:bg-gray-800 rounded-md px-8 py-3 text-sm md:text-base"
            >
              Shop Men&apos;s
            </Button>
          </Link>
          <Link href="/shop?category=women" passHref>
            <Button 
              variant="default" 
              size="lg" 
              className="bg-black text-white hover:bg-gray-800 rounded-md px-8 py-3 text-sm md:text-base"
            >
              Shop Women&apos;s
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default StrengthTakesSweat;
