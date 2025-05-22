"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import Link from "next/link";

export default function CancelRoute() {
  return (
    <section className="w-full min-h-[80vh] flex items-center justify-center bg-gray-50">
      <Card className="w-[350px] rounded-2xl border border-gray-200 shadow-lg overflow-hidden cancel-card">
        <div className="p-8">
          <div className="w-full flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
          </div>

          <div className="mt-3 text-center sm:mt-5 w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Cancelled</h3>
            <p className="mt-2 text-gray-600">
              Something went wrong with your payment. You haven't been charged.
              Please try again or contact support if the issue persists.
            </p>

            <div className="flex flex-col gap-3 mt-6">
              <Button className="w-full bg-[#2B2B2B] hover:bg-gray-800 text-white">
                <Link href="/">Back to Homepage</Link>
              </Button>
              
              <Button variant="outline" className="w-full border-gray-300 text-[#2B2B2B] hover:bg-gray-50">
                <Link href="/contact">Contact Support</Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .cancel-card {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </section>
  );
}
