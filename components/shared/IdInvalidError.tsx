"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import React from "react";

// Define props interface
interface IdInvalidErrorProps {
  message?: string; // Make message optional
}

const IdInvalidError: React.FC<IdInvalidErrorProps> = ({ message }) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 relative">
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
          </div>
          <div className="mt-4">
            <h1 className="text-2xl font-bold text-gray-900">{message ? "Error" : "Invalid ID"}</h1>
            <p className="mt-2 text-gray-600">
              {message || "The ID you provided is invalid or doesn't exist in our system."}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <Link href="/shop">
            <Button className="w-full bg-[#2B2B2B] hover:bg-gray-800 text-white transition-all active:scale-[0.98]">
              Continue Shopping
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full border-gray-300 text-[#2B2B2B] hover:bg-gray-50">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default IdInvalidError;
