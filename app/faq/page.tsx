"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Search, Filter, HelpCircle } from "lucide-react";
import { getAllFAQs, getFAQCategories, searchFAQs } from "@/lib/database/actions/faq.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

interface GroupedFAQs {
  [category: string]: FAQ[];
}

const FAQPage = () => {
  const [faqs, setFaqs] = useState<GroupedFAQs>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<FAQ[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchFAQsAndCategories();
  }, []);

  const fetchFAQsAndCategories = async () => {
    try {
      setLoading(true);
      const [faqsResponse, categoriesResponse] = await Promise.all([
        getAllFAQs(),
        getFAQCategories(),
      ]);

      if (faqsResponse.success) {
        setFaqs(faqsResponse.faqs);
      }

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.categories);
      }
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    
    if (term.trim()) {
      setIsSearching(true);
      try {
        const response = await searchFAQs(term);
        if (response.success) {
          setSearchResults(response.faqs);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const getFilteredFAQs = () => {
    if (searchTerm.trim() && searchResults.length > 0) {
      return { "Search Results": searchResults };
    }

    if (selectedCategory === "all") {
      return faqs;
    }

    return { [selectedCategory]: faqs[selectedCategory] || [] };
  };

  const filteredFAQs = getFilteredFAQs();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mb-8"></div>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <HelpCircle className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about our products and services
          </p>
        </div>

        {/* Search and Filter Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <div className="md:w-48">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Search Status */}
            {isSearching && (
              <div className="mt-4 text-sm text-gray-500">Searching...</div>
            )}
            {searchTerm && searchResults.length === 0 && !isSearching && (
              <div className="mt-4 text-sm text-gray-500">
                No results found for "{searchTerm}"
              </div>
            )}
          </CardContent>
        </Card>

        {/* FAQ Content */}
        <div className="space-y-8">
          {Object.entries(filteredFAQs).map(([category, categoryFAQs]) => (
            <div key={category}>
              {/* Category Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  {category}
                </h2>
                <div className="h-1 w-12 bg-blue-600 rounded"></div>
              </div>

              {/* FAQ Items */}
              <div className="space-y-4">
                {categoryFAQs.map((faq) => (
                  <Card key={faq._id} className="border-l-4 border-l-blue-600">
                    <CardContent className="p-0">
                      <button
                        onClick={() => toggleExpanded(faq._id)}
                        className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium text-gray-900 pr-4">
                            {faq.question}
                          </h3>
                          {expandedItems.has(faq._id) ? (
                            <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                          )}
                        </div>
                      </button>

                      {expandedItems.has(faq._id) && (
                        <div className="px-6 pb-6">
                          <div className="pt-4 border-t border-gray-200">
                            <div
                              className="text-gray-700 prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: faq.answer }}
                            />
                            
                            {/* Tags */}
                            {faq.tags && faq.tags.length > 0 && (
                              <div className="mt-4 flex flex-wrap gap-2">
                                {faq.tags.map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {Object.keys(filteredFAQs).length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No FAQs Found
              </h3>
              <p className="text-gray-600">
                {searchTerm
                  ? `No FAQs match your search for "${searchTerm}"`
                  : "No FAQs available in this category"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Contact Section */}
        <Card className="mt-12 bg-blue-50 border-blue-200">
          <CardContent className="text-center py-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Still have questions?
            </h3>
            <p className="text-gray-600 mb-6">
              Can't find what you're looking for? Get in touch with our support team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="default">
                Contact Support
              </Button>
              <Button variant="outline">
                Live Chat
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FAQPage;