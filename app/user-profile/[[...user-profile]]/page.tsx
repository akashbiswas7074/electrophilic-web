"use client";

import { UserProfile } from "@clerk/nextjs";
import { Loader } from "lucide-react";
import React, { Suspense } from "react";

// Metadata needs to be moved to a separate file since we're using "use client"
// and metadata can only be exported from Server Components

const UserProfilePage = () => {
  return (
    <div className="min-h-screen w-full bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Profile</h1>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          <Suspense 
            fallback={
              <div className="flex items-center justify-center h-96">
                <div className="relative">
                  <Loader className="animate-spin h-8 w-8 text-[#2B2B2B]" />
                  <div className="absolute -inset-3 rounded-full border-2 border-t-transparent border-[#2B2B2B] animate-pulse-ring opacity-30"></div>
                </div>
                <span className="ml-3 text-gray-600">Loading your profile...</span>
              </div>
            }
          >
            <UserProfile 
              appearance={{
                elements: {
                  rootBox: "w-full min-h-screen",
                  card: "w-full max-w-[600px] mx-auto my-4",
                  navbar: "hidden",
                  formButtonPrimary: "bg-[#2B2B2B] hover:bg-gray-800 text-white",
                  formButtonReset: "text-[#2B2B2B] hover:bg-gray-50 border-gray-300",
                  formFieldLabel: "text-gray-700",
                  formFieldInput: "bg-white border-gray-300 focus:border-[#2B2B2B] focus:ring-1 focus:ring-[#2B2B2B]",
                  userButtonPopoverActionButton: "text-gray-700 hover:bg-gray-100 hover:text-[#2B2B2B]",
                  avatarBox: "ring-2 ring-offset-2 ring-[#2B2B2B]",
                  headerTitle: "text-xl font-bold text-gray-900",
                  headerSubtitle: "text-gray-600",
                }
              }}
            />
          </Suspense>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.7; }
          50% { transform: scale(1.05); opacity: 0.3; }
          100% { transform: scale(0.95); opacity: 0.7; }
        }
        
        .animate-pulse-ring {
          animation: pulse-ring 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default UserProfilePage;
