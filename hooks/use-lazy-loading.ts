import { useState, useEffect, useRef, useCallback } from 'react';

interface UseLazyLoadingOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const useLazyLoading = (options: UseLazyLoadingOptions = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        
        if (isVisible && (!triggerOnce || !hasTriggered)) {
          setIsIntersecting(true);
          setHasTriggered(true);
          
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsIntersecting(isVisible);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  return {
    ref: elementRef,
    isVisible: isIntersecting,
    hasTriggered
  };
};

interface UsePreloadComponentOptions {
  delay?: number;
  condition?: boolean;
}

export const usePreloadComponent = (
  componentLoader: () => Promise<any>,
  options: UsePreloadComponentOptions = {}
) => {
  const { delay = 0, condition = true } = options;
  const [isPreloaded, setIsPreloaded] = useState(false);
  const preloadTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const preload = useCallback(() => {
    if (isPreloaded || !condition) return;

    if (delay > 0) {
      preloadTimeoutRef.current = setTimeout(() => {
        componentLoader().then(() => {
          setIsPreloaded(true);
        });
      }, delay);
    } else {
      componentLoader().then(() => {
        setIsPreloaded(true);
      });
    }
  }, [componentLoader, delay, condition, isPreloaded]);

  useEffect(() => {
    return () => {
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
    };
  }, []);

  return { preload, isPreloaded };
};

interface UseComponentLoadingOptions {
  loadingTimeout?: number;
  errorTimeout?: number;
}

export const useComponentLoading = (options: UseComponentLoadingOptions = {}) => {
  const { loadingTimeout = 10000, errorTimeout = 5000 } = options;
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [error, setError] = useState<Error | null>(null);
  
  const loadingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const errorTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const startLoading = useCallback(() => {
    setLoadingState('loading');
    setError(null);
    
    // Set a timeout for loading state
    loadingTimeoutRef.current = setTimeout(() => {
      setLoadingState('error');
      setError(new Error('Component loading timeout'));
    }, loadingTimeout);
  }, [loadingTimeout]);

  const finishLoading = useCallback(() => {
    setLoadingState('loaded');
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
  }, []);

  const setLoadingError = useCallback((err: Error) => {
    setLoadingState('error');
    setError(err);
    
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Auto-retry after error timeout
    errorTimeoutRef.current = setTimeout(() => {
      setLoadingState('idle');
      setError(null);
    }, errorTimeout);
  }, [errorTimeout]);

  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

  return {
    loadingState,
    error,
    startLoading,
    finishLoading,
    setLoadingError,
    isLoading: loadingState === 'loading',
    isLoaded: loadingState === 'loaded',
    hasError: loadingState === 'error'
  };
};

export const useImageLazyLoading = () => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  
  const markImageAsLoaded = useCallback((src: string) => {
    setLoadedImages(prev => new Set(prev).add(src));
  }, []);

  const isImageLoaded = useCallback((src: string) => {
    return loadedImages.has(src);
  }, [loadedImages]);

  return {
    markImageAsLoaded,
    isImageLoaded,
    loadedImages: Array.from(loadedImages)
  };
};

interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

export const useInfiniteScroll = (
  fetchNextPage: () => void,
  options: UseInfiniteScrollOptions = {}
) => {
  const {
    threshold = 0.1,
    rootMargin = '100px',
    hasNextPage = true,
    isFetchingNextPage = false
  } = options;

  const { ref, isVisible } = useLazyLoading({
    threshold,
    rootMargin,
    triggerOnce: false
  });

  useEffect(() => {
    if (isVisible && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isVisible, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return { ref };
};