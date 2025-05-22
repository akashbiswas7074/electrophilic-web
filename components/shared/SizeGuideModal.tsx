"use client"; // Add this directive for client components

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription, // Added DialogDescription
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button"; // Import Button if needed for the trigger

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

interface SizeGuideModalProps {
  trigger: React.ReactNode; // Allow passing the trigger element (e.g., the button)
  chartType?: 'footwear' | 'apparel'; // Example prop to load different charts
  title?: string;
  description?: string;
}

const SizeGuideModal: React.FC<SizeGuideModalProps> = ({
  trigger,
  chartType = 'footwear', // Default to footwear
  title = "Size Chart", // Default title
  description = "Find your size in the chart below. Scroll horizontally to see more sizes." // Default description
}) => {
  const [unit, setUnit] = useState<'in' | 'cm'>('in');

  // Determine which columns to show based on the selected unit
  const visibleHeaders = sizeChartData.headers.filter(header =>
    unit === 'in' ? !header.includes('(cm)') : !header.includes('(in.)')
  );

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[80%] md:max-w-[70%] lg:max-w-[60%] xl:max-w-[900px] max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl md:text-2xl font-semibold">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-gray-600 pt-1">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex justify-end mb-4 flex-shrink-0">
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

        <div className="overflow-x-auto flex-grow pb-4"> {/* Make table scrollable */}
          <Table className="min-w-full border-collapse border border-gray-200">
            <TableHeader className="bg-gray-50 sticky top-0"> {/* Sticky header */}
              <TableRow>
                {visibleHeaders.map((header) => (
                  <TableHead key={header} className="px-3 py-2 border border-gray-200 text-xs font-semibold text-gray-600 whitespace-nowrap">
                    {header.replace('(in.)', '').replace('(cm)', '').trim()} {/* Clean header text */}
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
      </DialogContent>
    </Dialog>
  );
};

export default SizeGuideModal;
