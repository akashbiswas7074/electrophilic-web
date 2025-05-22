import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface HeroDisplayProps {
  // Props can be added later for dynamic content
}

const HeroDisplay: React.FC<HeroDisplayProps> = () => {
  return (
    // Make the section take up 50% of the viewport height on medium screens and up
    <section className="w-full flex flex-col md:flex-row bg-white text-black md:h-[50vh]">
      {/* Left Panel: Summer Ready */}
      {/* Ensure panel takes full height of the section */}
      <div className="w-full md:w-1/2 relative flex flex-col justify-center items-center p-8 sm:p-12 md:p-16 lg:p-20 bg-gradient-to-br from-sky-300 via-blue-400 to-indigo-500 text-white h-full">
        <div className="absolute top-4 right-4 text-xs uppercase">
          <span>S/S25</span>
          {/* Add Nike logo here if available as SVG or small image */}
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight text-center" style={{ fontFamily: "'Helvetica Neue', sans-serif", letterSpacing: '-0.02em' }}>
          Summer
          <br />
          ready
        </h1>
        {/* Optional: Add a subtle Nike swoosh or graphic element if desired */}
      </div>

      {/* Right Panel: Athlete Image */}
      {/* Ensure panel takes full height of the section */}
      <div className="w-full md:w-1/2 relative h-full">
        <Image
          src="/placeholder-hero-athlete.jpg" // Replace with actual image path
          alt="Athlete training"
          fill
          className="object-cover"
          priority
        />
        {/* Link overlay as suggested by the original image's bottom-left link */}
        <Link href="/in/w/training-gear-up-3pn6y" className="absolute bottom-0 left-0 p-4 text-transparent text-xs" aria-label="Training gear up">
          .
        </Link>
      </div>
    </section>
  );
};

export default HeroDisplay;
