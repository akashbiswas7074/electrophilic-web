import React from "react";
import { getActiveSizeGuide } from "@/lib/database/actions/size-guide.actions";
import { Table, Ruler, Lightbulb } from "lucide-react";
import { Metadata } from "next";
import { generatePageMetadata } from "@/lib/metadata";

// Type definitions for the size guide configuration
interface SizeGuideSection {
  title: string;
  content: string;
  icon: string;
  order: number;
  isActive: boolean;
}

interface SizeChartEntry {
  size: string;
  measurements: Record<string, string>;
  order: number;
}

interface SizeChart {
  enabled: boolean;
  measurementLabels: string[];
  entries: SizeChartEntry[];
}

interface HowToMeasure {
  enabled: boolean;
  content: string;
  images?: string[];
}

interface FitTips {
  enabled: boolean;
  content: string;
}

interface SizeGuideConfig {
  title: string;
  subtitle?: string;
  heroIcon: string;
  sections: SizeGuideSection[];
  sizeChart?: SizeChart;
  howToMeasure?: HowToMeasure;
  fitTips?: FitTips;
  customCSS?: string;
}

// Generate metadata dynamically using website settings
export async function generateMetadata(): Promise<Metadata> {
  return await generatePageMetadata(
    "Size Guide",
    "Find your perfect fit with our comprehensive size guide"
  );
}

export default async function SizeGuidePage() {
  const result = await getActiveSizeGuide();
  
  if (!result.success || !result.config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Size Guide</h1>
          <p className="text-gray-600">Size guide information is currently unavailable.</p>
        </div>
      </div>
    );
  }

  const config: SizeGuideConfig = result.config;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Custom CSS injection */}
      {config.customCSS && (
        <style dangerouslySetInnerHTML={{ __html: config.customCSS }} />
      )}

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">{config.heroIcon}</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{config.title}</h1>
          {config.subtitle && (
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">{config.subtitle}</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8 space-y-12">
            {/* Content Sections */}
            {config.sections
              .filter(section => section.isActive)
              .sort((a, b) => a.order - b.order)
              .map((section, index) => (
                <section key={index} className="space-y-6">
                  <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                    <span className="text-3xl">{section.icon}</span>
                    <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                  </div>
                  <div 
                    className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                </section>
              ))}

            {/* Size Chart */}
            {config.sizeChart?.enabled && config.sizeChart && (
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Table className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Size Chart</h2>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-6 py-3 text-left text-sm font-medium text-gray-900">
                          Size
                        </th>
                        {config.sizeChart.measurementLabels.map((label, index) => (
                          <th key={index} className="border border-gray-200 px-6 py-3 text-left text-sm font-medium text-gray-900">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {config.sizeChart.entries
                        .sort((a, b) => a.order - b.order)
                        .map((entry, index) => (
                          <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="border border-gray-200 px-6 py-4 font-medium text-gray-900">
                              {entry.size}
                            </td>
                            {config.sizeChart!.measurementLabels.map((label, labelIndex) => (
                              <td key={labelIndex} className="border border-gray-200 px-6 py-4 text-gray-700">
                                {entry.measurements[label] || "-"}
                              </td>
                            ))}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* How to Measure */}
            {config.howToMeasure?.enabled && config.howToMeasure && (
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Ruler className="h-6 w-6 text-green-600" />
                  <h2 className="text-xl font-semibold text-gray-900">How to Measure</h2>
                </div>
                
                <div 
                  className="prose prose-gray max-w-none"
                  dangerouslySetInnerHTML={{ __html: config.howToMeasure.content }}
                />
                
                {config.howToMeasure.images && config.howToMeasure.images.length > 0 && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {config.howToMeasure.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`How to measure - Step ${index + 1}`}
                        className="rounded-lg border border-gray-200"
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Fit Tips */}
            {config.fitTips?.enabled && config.fitTips && (
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Lightbulb className="h-6 w-6 text-amber-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Fit Tips</h2>
                </div>
                
                <div 
                  className="prose prose-gray max-w-none"
                  dangerouslySetInnerHTML={{ __html: config.fitTips.content }}
                />
              </section>
            )}
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-12 text-center">
          <div className="bg-blue-50 rounded-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Still Need Help?</h3>
            <p className="text-gray-600 mb-4">
              If you're unsure about sizing, our customer service team is here to help!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/contact" 
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contact Support
              </a>
              <a 
                href="/size-guide" 
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 font-medium rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
              >
                View Full Guide
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
