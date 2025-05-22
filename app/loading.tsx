"use client";

import { Loader } from "lucide-react";

export default function Loading() {
  return (
    <div className="bg-white bg-opacity-80 flex flex-col justify-center items-center h-screen">
      <div className="relative">
        <Loader className="animate-spin h-10 w-10 text-[#2B2B2B]" />
        <div className="absolute -inset-4 rounded-full border-2 border-t-transparent border-[#2B2B2B] animate-pulse-effect opacity-30"></div>
      </div>
      <p className="text-gray-700 mt-4 font-medium">Loading your content...</p>
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.05); opacity: 0.1; }
        }
        
        .animate-pulse-effect {
          animation: pulse 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
