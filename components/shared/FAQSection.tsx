"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { getFAQsByCategory } from "@/lib/database/actions/faq.actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

interface FAQSectionProps {
  category?: string;
  title?: string;
  maxItems?: number;
  className?: string;
  showTags?: boolean;
}

const FAQSection: React.FC<FAQSectionProps> = ({
  category = "General",
  title,
  maxItems = 5,
  className = "",
  showTags = false,
}) => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchFAQs();
  }, [category]);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const response = await getFAQsByCategory(category);
      if (response.success) {
        setFaqs(response.faqs.slice(0, maxItems));
      }
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {title && (
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          </div>
        )}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (faqs.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {title && (
        <div className="flex items-center gap-2 mb-6">
          <HelpCircle className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}

      <div className="space-y-3">
        {faqs.map((faq) => (
          <Card key={faq._id} className="border-l-4 border-l-blue-600">
            <CardContent className="p-0">
              <button
                onClick={() => toggleExpanded(faq._id)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900 pr-4">
                    {faq.question}
                  </h4>
                  {expandedItems.has(faq._id) ? (
                    <ChevronUp className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  )}
                </div>
              </button>

              {expandedItems.has(faq._id) && (
                <div className="px-4 pb-4">
                  <div className="pt-3 border-t border-gray-200">
                    <div
                      className="text-sm text-gray-700 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: faq.answer }}
                    />
                    
                    {showTags && faq.tags && faq.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
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
  );
};

export default FAQSection;