"use client";

import React from 'react';
import Link from 'next/link';

export default function ReturnPolicyPage() {
  return (
    <div className="w-full py-8 md:py-12 lg:py-16 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="mb-6 text-sm breadcrumbs">
          <ol className="flex items-center space-x-1">
            <li><Link href="/" className="text-gray-500 hover:text-gray-700">Home</Link></li>
            <li className="text-gray-400">/</li>
            <li><span className="text-gray-900 font-medium">Return Policy</span></li>
          </ol>
        </div>

        <div className="prose prose-slate max-w-none">
          <h1 className="text-3xl font-bold mb-6 flex items-center">
            <span className="mr-2">🏃‍♂️</span>PEEDS Return & Exchange Policy
          </h1>

          <p className="text-lg mb-6">
            At PEEDS, we've got your back—on and off the track. If something's not quite right with your new kicks, no sweat! We'll help you sort it out.
          </p>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-3 flex items-center">
              <span className="mr-2">⏱️</span>You've Got 15 Days
            </h2>
            <p>
              Changed your mind? Need a different size? No problem.
              You can request a return or exchange within 15 days of your purchase.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-3 flex items-center">
              <span className="mr-2">✅</span>To Qualify for a Return or Exchange
            </h2>
            <p className="mb-3">Make sure your gear is:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Fresh outta the box</strong> – That means unworn, unwashed, and looking just like when it left our shelves.</li>
              <li><strong>Fully loaded</strong> – Keep all the original packaging, tags, and accessories intact and in good shape.</li>
            </ul>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-3 flex items-center">
              <span className="mr-2">📦</span>How to Make a Return
            </h2>
            <p className="mb-3">It's simple:</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Log in to your PEEDS account.</li>
              <li>Head to Order History.</li>
              <li>Pick the item you want to return and follow the steps.</li>
              <li>Once we receive and inspect your return, we'll process your refund or exchange right away.</li>
            </ol>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-3 flex items-center">
              <span className="mr-2">🔁</span>How Exchange Works
            </h2>
            <p className="mb-3">Want a different size, color, or style? Here's how we do it:</p>
            <p className="mb-3">To keep things fast and smooth, we handle exchanges by:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Returning the item you have.</li>
              <li>Placing a new order for the item you want.</li>
            </ul>
            <p className="mt-3"><strong>Why?</strong> This way, your new pair is on its way while we process your return—no waiting around!</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-3 flex items-center">
              <span className="mr-2">⚠️</span>A Few Things to Keep in Mind
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Items that don't meet the return conditions won't be accepted.</li>
              <li>If the return isn't due to a defect or a mix-up, return shipping might be on you.</li>
            </ul>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-3 flex items-center">
              <span className="mr-2">💬</span>Need Help?
            </h2>
            <p>
              Got questions or need a hand with the return or exchange process? We're here for you! 
              Reach out to our support team at <a href="mailto:support@peeds.com" className="text-blue-600 hover:underline">support@peeds.com</a> or call us at <a href="tel:+1800123456" className="text-blue-600 hover:underline">1-800-123-456</a>—we'll make sure you're laced up and ready to roll in no time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}