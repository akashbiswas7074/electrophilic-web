"use client";

import React, { useState, useEffect } from 'react';
import { getActiveSizeGuide } from "@/lib/database/actions/size-guide.actions";
import { Table, Ruler, Lightbulb, ExternalLink } from "lucide-react";

interface SizeGuideTabContentProps {
  className?: string;
}

interface SizeGuideConfig {
  title: string;
  subtitle?: string;
  heroIcon?: string;
  sections: Array<{
    title: string;
    content: string;
    icon?: string;
    isActive: boolean;
    order: number;
  }>;
  sizeChart?: {
    enabled: boolean;
    measurementLabels: string[];
    entries: Array<{
      size: string;
      measurements: { [key: string]: string };
      order: number;
    }>;
  };
  howToMeasure?: {
    enabled: boolean;
    content: string;
    images?: string[];
  };
  fitTips?: {
    enabled: boolean;
    content: string;
  };
  customCSS?: string;
}

export default function SizeGuideTabContent({ className = "" }: SizeGuideTabContentProps) {
  const [config, setConfig] = useState<SizeGuideConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSizeGuide = async () => {
      try {
        setLoading(true);
        const result = await getActiveSizeGuide();
        
        if (result.success && result.config) {
          setConfig(result.config);
        } else {
          setError("Size guide information is currently unavailable");
        }
      } catch (err) {
        console.error("Error fetching size guide:", err);
        setError("Failed to load size guide");
      } finally {
        setLoading(false);
      }
    };

    fetchSizeGuide();
  }, []);

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Loading Skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-lg mb-4 w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
          <div className="mt-8">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📐</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Size Guide</h3>
          <p className="text-gray-600 mb-4">{error || "Size guide information is currently unavailable"}</p>
          <a 
            href="/size-guide" 
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            View Full Size Guide <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Custom CSS injection */}
      {config.customCSS && (
        <style dangerouslySetInnerHTML={{ __html: config.customCSS }} />
      )}

      {/* Header */}
      <div className="text-center pb-6 border-b border-gray-200">
        <div className="text-3xl mb-2">{config.heroIcon || "📐"}</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{config.title}</h2>
        {config.subtitle && (
          <p className="text-gray-600">{config.subtitle}</p>
        )}
      </div>

      {/* Content Sections */}
      {config.sections
        .filter(section => section.isActive)
        .sort((a, b) => a.order - b.order)
        .map((section, index) => (
          <div key={index} className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">{section.icon}</span>
              <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
            </div>
            <div 
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          </div>
        ))}

      {/* Size Chart */}
      {config.sizeChart?.enabled && config.sizeChart.entries.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Table className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Size Chart</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-900">
                    Size
                  </th>
                  {config.sizeChart?.measurementLabels?.map((label, labelIndex) => (
                    <th key={labelIndex} className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-900">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {config.sizeChart.entries
                  .sort((a, b) => a.order - b.order)
                  .map((entry, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                      <td className="border border-gray-200 px-3 py-2 font-medium text-gray-900">
                        {entry.size}
                      </td>
                      {config.sizeChart?.measurementLabels?.map((label, labelIndex) => (
                        <td key={labelIndex} className="border border-gray-200 px-3 py-2 text-gray-700">
                          {entry.measurements[label] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* How to Measure */}
      {config.howToMeasure?.enabled && config.howToMeasure.content && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Ruler className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">How to Measure</h3>
          </div>
          <div 
            className="prose prose-sm max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: config.howToMeasure.content }}
          />
          {config.howToMeasure.images && config.howToMeasure.images.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {config.howToMeasure.images.map((image, index) => (
                image && (
                  <img 
                    key={index}
                    src={image} 
                    alt={`Measurement guide ${index + 1}`}
                    className="rounded-lg border border-gray-200 w-full h-auto"
                  />
                )
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fit Tips */}
      {config.fitTips?.enabled && config.fitTips.content && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            <h3 className="text-lg font-semibold text-gray-900">Fit Tips</h3>
          </div>
          <div 
            className="prose prose-sm max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: config.fitTips.content }}
          />
        </div>
      )}

      {/* Link to Full Size Guide */}
      <div className="pt-6 border-t border-gray-200 text-center">
        <a 
          href="/size-guide" 
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          View Complete Size Guide <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}