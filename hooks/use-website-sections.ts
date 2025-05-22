import { useState, useEffect } from "react";
import { IWebsiteSection } from "@/lib/database/models/website.section.model";

// Define the shape of the categoryId when it's an object
interface CategoryReference {
  _id: string;
  name?: string;
  // Add any other properties that might exist on the category object
}

export const useWebsiteSections = () => {
  const [sections, setSections] = useState<IWebsiteSection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all visible sections ordered by position
  useEffect(() => {
    const fetchSections = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/sections");
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Failed to fetch sections");
        }

        setSections(data.sections);
        setError(null);
      } catch (err) {
        console.error("Error fetching website sections:", err);
        setError("Failed to load website sections. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, []);

  // Filter sections by categoryId
  const getSectionsByCategory = (categoryId: string) => {
    return sections.filter(section => 
      section.categoryId && 
      (typeof section.categoryId === 'string' 
        ? section.categoryId === categoryId 
        : (section.categoryId as CategoryReference)._id === categoryId)
    );
  };

  // Get general sections (those without a category)
  const getGeneralSections = () => {
    return sections.filter(section => !section.categoryId);
  };

  // Check if a section with a specific ID is visible
  const isSectionVisible = (sectionId: string) => {
    const section = sections.find(s => s.sectionId === sectionId);
    return !!section;
  };

  return {
    sections,
    loading,
    error,
    getSectionsByCategory,
    getGeneralSections,
    isSectionVisible,
  };
};