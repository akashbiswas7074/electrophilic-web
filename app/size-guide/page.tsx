"use client"; // Add this directive for client components

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button"; // Import Button if needed

// --- Sample Size Chart Data (Replace with your actual data source) ---
const sizeChartData = {
  // Example for footwear, adjust structure as needed
  headers: ["US - Men's", "US - Women's", "UK", "CM/JP", "EU", "Foot length (in.)", "Foot length (cm)"],
  sizes: [
    { "US - Men's": "3.5", "US - Women's": "5",   "UK": "3",   "CM/JP": "22.5", "EU": "35.5", "Foot length (in.)": "8 1/2",   "Foot length (cm)": "21.6" },
    { "US - Men's": "4",   "US - Women's": "5.5", "UK": "3.5", "CM/JP": "23",   "EU": "36",   "Foot length (in.)": "8 11/16", "Foot length (cm)": "22.0" },
    { "US - Men's": "4.5", "US - Women's": "6",   "UK": "4",   "CM/JP": "23.5", "EU": "36.5", "Foot length (in.)": "8 13/16", "Foot length (cm)": "22.4" },
    { "US - Men's": "5",   "US - Women's": "6.5", "UK": "4.5", "CM/JP": "23.5", "EU": "37.5", "Foot length (in.)": "9",       "Foot length (cm)": "22.9" },
    { "US - Men's": "5.5", "US - Women's": "7",   "UK": "5",   "CM/JP": "24",   "EU": "38",   "Foot length (in.)": "9 3/16",  "Foot length (cm)": "23.3" },
    { "US - Men's": "6",   "US - Women's": "7.5", "UK": "5.5", "CM/JP": "24",   "EU": "38.5", "Foot length (in.)": "9 5/16",  "Foot length (cm)": "23.7" },
    { "US - Men's": "6.5", "US - Women's": "8",   "UK": "6",   "CM/JP": "24.5", "EU": "39",   "Foot length (in.)": "9 1/2",   "Foot length (cm)": "24.1" },
    { "US - Men's": "7",   "US - Women's": "8.5", "UK": "6",   "CM/JP": "25",   "EU": "40",   "Foot length (in.)": "9 11/16", "Foot length (cm)": "24.5" },
    { "US - Men's": "7.5", "US - Women's": "9",   "UK": "6.5", "CM/JP": "25.5", "EU": "40.5", "Foot length (in.)": "9 13/16", "Foot length (cm)": "25.0" },
    { "US - Men's": "8",   "US - Women's": "9.5", "UK": "7",   "CM/JP": "26",   "EU": "41",   "Foot length (in.)": "10",      "Foot length (cm)": "25.4" },
    { "US - Men's": "8.5", "US - Women's": "10",  "UK": "7.5", "CM/JP": "26.5", "EU": "42",   "Foot length (in.)": "10 3/16", "Foot length (cm)": "25.8" },
    { "US - Men's": "9",   "US - Women's": "10.5","UK": "8",   "CM/JP": "27",   "EU": "42.5", "Foot length (in.)": "10 5/16", "Foot length (cm)": "26.2" },
    { "US - Men's": "9.5", "US - Women's": "11",  "UK": "8.5", "CM/JP": "27.5", "EU": "43",   "Foot length (in.)": "10 1/2",  "Foot length (cm)": "26.7" },
    { "US - Men's": "10",  "US - Women's": "11.5","UK": "9",   "CM/JP": "28",   "EU": "44",   "Foot length (in.)": "10 11/16","Foot length (cm)": "27.1" },
    // ... add more sizes as needed
  ]
};

// You might want to fetch this data or pass it based on product category later
const chartType = 'footwear';
const title = "Nike Men's Footwear Size Chart";
const description = "Find your size in the chart below. If you do not know your size, use the 'How to measure foot length' prompts at the bottom of the size guide to help you find the right size. Please note, the CM size displayed on shoe boxes and labels is different to foot length (cm).";

const SizeGuidePage = () => {
  const [unit, setUnit] = useState<'in' | 'cm'>('in');

  // Determine which columns to show based on the selected unit
  const visibleHeaders = sizeChartData.headers.filter(header =>
    unit === 'in' ? !header.includes('(cm)') : !header.includes('(in.)')
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-16">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold">{title}</h1>
        {description && (
          <p className="text-sm text-gray-600 mt-1">
            {description}
          </p>
        )}
      </div>

      <div className="flex justify-end mb-4">
        <ToggleGroup
          type="single"
          defaultValue="in"
          value={unit}
          onValueChange={(value) => { if (value) setUnit(value as 'in' | 'cm'); }}
          className="border rounded-md p-0.5 bg-gray-100"
          size="sm"
        >
          <ToggleGroupItem
            value="in"
            aria-label="Toggle inches"
            className="px-3 py-1 data-[state=on]:bg-white data-[state=on]:shadow data-[state=on]:text-black text-gray-600 rounded-sm"
          >
            in.
          </ToggleGroupItem>
          <ToggleGroupItem
            value="cm"
            aria-label="Toggle centimeters"
            className="px-3 py-1 data-[state=on]:bg-white data-[state=on]:shadow data-[state=on]:text-black text-gray-600 rounded-sm"
          >
            cm
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="overflow-x-auto">
        <Table className="min-w-full border-collapse border border-gray-200">
          <TableHeader className="bg-gray-50 sticky top-0">
            <TableRow>
              {visibleHeaders.map((header) => (
                <TableHead key={header} className="px-3 py-2 border border-gray-200 text-xs font-semibold text-gray-600 whitespace-nowrap">
                  {header.replace('(in.)', '').replace('(cm)', '').trim()}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sizeChartData.sizes.map((sizeRow, rowIndex) => (
              <TableRow key={rowIndex} className="hover:bg-gray-50">
                {visibleHeaders.map((header) => (
                  <TableCell key={`${rowIndex}-${header}`} className="px-3 py-2 border border-gray-200 text-sm text-gray-800 whitespace-nowrap">
                    {sizeRow[header as keyof typeof sizeRow] || '-'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Optional: Add "How to Measure" section here */}
      <div className="mt-8 pt-8 border-t">
         <h2 className="text-xl font-semibold mb-4">How to Measure Foot Length</h2>
         {/* Add instructions, images, etc. */}
         <p className="text-gray-700">Instructions on measuring foot length go here...</p>
      </div>
    </div>
  );
};

export default SizeGuidePage;
