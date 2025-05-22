import React, { useRef, useEffect, useState } from 'react';

interface ThumbnailScrollerProps {
  children: React.ReactNode;
  className?: string;
}

export default function ThumbnailScroller({ children, className = '' }: ThumbnailScrollerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showLeftIndicator, setShowLeftIndicator] = useState(false);
  const [showRightIndicator, setShowRightIndicator] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Handle scroll indicators and thumbnail selection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Function to update scroll indicators
    const updateScrollIndicators = () => {
      if (!isMobile) {
        setShowLeftIndicator(false);
        setShowRightIndicator(false);
        return;
      }
      
      // On mobile, check if scrollable and direction
      const isScrollable = container.scrollWidth > container.clientWidth;
      const isScrolledToStart = container.scrollLeft <= 5;
      const isScrolledToEnd = 
        container.scrollLeft + container.clientWidth >= container.scrollWidth - 5;
      
      setShowRightIndicator(isScrollable && !isScrolledToEnd);
      setShowLeftIndicator(isScrollable && !isScrolledToStart);
    };

    // Initial check after all images load
    const checkAllImagesLoaded = () => {
      const images = container.querySelectorAll('img');
      let loadedCount = 0;
      const totalImages = images.length;
      
      if (totalImages === 0) {
        updateScrollIndicators();
        return;
      }

      images.forEach(img => {
        if (img.complete) {
          loadedCount++;
          if (loadedCount === totalImages) {
            updateScrollIndicators();
          }
        } else {
          img.addEventListener('load', () => {
            loadedCount++;
            if (loadedCount === totalImages) {
              updateScrollIndicators();
            }
          }, { once: true });
          
          img.addEventListener('error', () => {
            loadedCount++;
            if (loadedCount === totalImages) {
              updateScrollIndicators();
            }
          }, { once: true });
        }
      });
    };

    // Set initial scroll indicators
    setTimeout(checkAllImagesLoaded, 50);
    setTimeout(updateScrollIndicators, 500); // Backup check

    // Add event listeners
    container.addEventListener('scroll', updateScrollIndicators);
    window.addEventListener('resize', updateScrollIndicators);

    // Find selected button and scroll to it
    const scrollSelectedIntoView = () => {
      const selectedButton = container.querySelector('button[aria-pressed="true"]');
      if (selectedButton) {
        selectedButton.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: isMobile ? 'center' : 'nearest'
        });
      }
    };

    // Initial scroll to selected
    setTimeout(scrollSelectedIntoView, 100);
    
    // Watch for button clicks - simpler than mutation observer
    const handleButtonClick = (e: Event) => {
      if (e.target instanceof Element && e.target.closest('button')) {
        // Give time for the aria-pressed to update
        setTimeout(scrollSelectedIntoView, 10);
      }
    };
    
    container.addEventListener('click', handleButtonClick);

    return () => {
      container.removeEventListener('scroll', updateScrollIndicators);
      window.removeEventListener('resize', updateScrollIndicators);
      container.removeEventListener('click', handleButtonClick);
    };
  }, [isMobile]);

  return (
    <div 
      ref={containerRef}
      className={`thumbnail-scroll-container relative ${className} 
        ${showLeftIndicator ? 'show-left-indicator' : ''}
        ${showRightIndicator ? 'show-right-indicator' : ''}`}
      role="listbox"
      aria-orientation={isMobile ? 'horizontal' : 'vertical'}
    >
      {children}
    </div>
  );
}
