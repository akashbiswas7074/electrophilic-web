"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getActiveReturnPolicy } from '@/lib/database/actions/return-policy.actions';

interface PolicySection {
  title: string;
  content: string;
  icon: string;
  order: number;
  isActive: boolean;
}

interface PolicyData {
  title: string;
  subtitle: string;
  heroIcon: string;
  sections: PolicySection[];
  metaTitle?: string;
  metaDescription?: string;
  customCSS?: string;
}

export default function ReturnPolicyPage() {
  const [policy, setPolicy] = useState<PolicyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPolicy = async () => {
      try {
        const result = await getActiveReturnPolicy();
        if (result.success && result.policy) {
          setPolicy(result.policy);
          
          // Update document title and meta description if available
          if (result.policy.metaTitle) {
            document.title = result.policy.metaTitle;
          }
          
          if (result.policy.metaDescription) {
            // Update meta description
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
              metaDesc = document.createElement('meta');
              metaDesc.setAttribute('name', 'description');
              document.head.appendChild(metaDesc);
            }
            metaDesc.setAttribute('content', result.policy.metaDescription);
          }
        }
      } catch (error) {
        console.error("Error loading return policy:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPolicy();
  }, []);

  if (loading) {
    return (
      <div className="w-full py-8 md:py-12 lg:py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-12 bg-gray-200 rounded mb-6"></div>
            <div className="h-4 bg-gray-200 rounded mb-8"></div>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-6">
                  <div className="h-6 bg-gray-200 rounded mb-3"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="w-full py-8 md:py-12 lg:py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-2xl font-bold text-center">Return Policy Not Available</h1>
          <p className="text-center text-gray-600 mt-4">
            We're sorry, but the return policy is currently unavailable. Please contact our support team for assistance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Custom CSS if provided */}
      {policy.customCSS && (
        <style dangerouslySetInnerHTML={{ __html: policy.customCSS }} />
      )}
      
      <div className="w-full py-8 md:py-12 lg:py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Breadcrumbs */}
          <div className="mb-6 text-sm breadcrumbs">
            <ol className="flex items-center space-x-1">
              <li><Link href="/" className="text-gray-500 hover:text-gray-700">Home</Link></li>
              <li className="text-gray-400">/</li>
              <li><span className="text-gray-900 font-medium">Return Policy</span></li>
            </ol>
          </div>

          <div className="prose prose-slate max-w-none">
            {/* Hero Section */}
            <h1 className="text-3xl font-bold mb-6 flex items-center">
              <span className="mr-2">{policy.heroIcon}</span>
              {policy.title}
            </h1>

            {policy.subtitle && (
              <p className="text-lg mb-6">{policy.subtitle}</p>
            )}

            {/* Dynamic Sections */}
            {policy.sections
              .filter(section => section.isActive)
              .sort((a, b) => a.order - b.order)
              .map((section, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6 mb-8">
                  <h2 className="text-xl font-semibold mb-3 flex items-center">
                    <span className="mr-2">{section.icon}</span>
                    {section.title}
                  </h2>
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: section.content }} 
                  />
                </div>
              ))}

            {/* Fallback content if no sections */}
            {policy.sections.filter(section => section.isActive).length === 0 && (
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold mb-3 flex items-center">
                  <span className="mr-2">📞</span>
                  Contact Us
                </h2>
                <p>
                  For information about returns and exchanges, please contact our customer support team. 
                  We're here to help you with any questions about our return policy.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}