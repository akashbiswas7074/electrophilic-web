import React from 'react';

interface PerformanceMetrics {
  componentLoadTime: number;
  renderTime: number;
  timestamp: number;
  componentName: string;
  loadMethod: 'lazy' | 'eager' | 'preload';
}

interface LazyLoadingStats {
  totalComponents: number;
  lazyLoadedComponents: number;
  averageLoadTime: number;
  failedLoads: number;
  cacheHits: number;
}

class LazyLoadingPerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private componentCache = new Map<string, any>();
  private loadingPromises = new Map<string, Promise<any>>();
  private failedComponents = new Set<string>();

  // Track component loading performance
  startTracking(componentName: string, loadMethod: 'lazy' | 'eager' | 'preload' = 'lazy'): number {
    const startTime = performance.now();
    return startTime;
  }

  endTracking(
    componentName: string, 
    startTime: number, 
    loadMethod: 'lazy' | 'eager' | 'preload' = 'lazy',
    success: boolean = true
  ): void {
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    if (success) {
      this.metrics.push({
        componentLoadTime: loadTime,
        renderTime: performance.now(),
        timestamp: Date.now(),
        componentName,
        loadMethod
      });
    } else {
      this.failedComponents.add(componentName);
    }
  }

  // Component caching for better performance
  cacheComponent(key: string, component: any): void {
    this.componentCache.set(key, component);
  }

  getCachedComponent(key: string): any | null {
    return this.componentCache.get(key) || null;
  }

  // Deduplicate loading promises to prevent multiple loads of same component
  getOrCreateLoadingPromise<T>(key: string, loader: () => Promise<T>): Promise<T> {
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key) as Promise<T>;
    }

    const promise = loader()
      .then(result => {
        this.cacheComponent(key, result);
        this.loadingPromises.delete(key);
        return result;
      })
      .catch(error => {
        this.loadingPromises.delete(key);
        this.failedComponents.add(key);
        throw error;
      });

    this.loadingPromises.set(key, promise);
    return promise;
  }

  // Get performance statistics
  getStats(): LazyLoadingStats {
    const lazyComponents = this.metrics.filter(m => m.loadMethod === 'lazy');
    const totalLoadTime = lazyComponents.reduce((sum, m) => sum + m.componentLoadTime, 0);
    
    return {
      totalComponents: this.metrics.length,
      lazyLoadedComponents: lazyComponents.length,
      averageLoadTime: lazyComponents.length > 0 ? totalLoadTime / lazyComponents.length : 0,
      failedLoads: this.failedComponents.size,
      cacheHits: this.componentCache.size
    };
  }

  // Get component-specific metrics
  getComponentMetrics(componentName: string): PerformanceMetrics[] {
    return this.metrics.filter(m => m.componentName === componentName);
  }

  // Clear metrics (useful for testing or memory management)
  clearMetrics(): void {
    this.metrics = [];
    this.failedComponents.clear();
  }

  // Log performance summary to console (development only)
  logPerformanceSummary(): void {
    if (process.env.NODE_ENV !== 'development') return;

    const stats = this.getStats();
    console.group('🚀 Lazy Loading Performance Summary');
    console.log(`📊 Total Components: ${stats.totalComponents}`);
    console.log(`⚡ Lazy Loaded: ${stats.lazyLoadedComponents}`);
    console.log(`⏱️  Average Load Time: ${stats.averageLoadTime.toFixed(2)}ms`);
    console.log(`❌ Failed Loads: ${stats.failedLoads}`);
    console.log(`💾 Cache Hits: ${stats.cacheHits}`);
    
    // Show slowest components
    const slowestComponents = this.metrics
      .sort((a, b) => b.componentLoadTime - a.componentLoadTime)
      .slice(0, 5);
    
    if (slowestComponents.length > 0) {
      console.log('\n🐌 Slowest Components:');
      slowestComponents.forEach((metric, index) => {
        console.log(`${index + 1}. ${metric.componentName}: ${metric.componentLoadTime.toFixed(2)}ms`);
      });
    }
    
    console.groupEnd();
  }

  // Preload critical components based on usage patterns
  async preloadCriticalComponents(componentLoaders: Record<string, () => Promise<any>>): Promise<void> {
    const criticalComponents = ['Navbar', 'Footer', 'CartDrawer']; // Adjust based on your needs
    
    const preloadPromises = criticalComponents.map(async (componentName) => {
      const loader = componentLoaders[componentName];
      if (loader && !this.componentCache.has(componentName)) {
        try {
          const startTime = this.startTracking(componentName, 'preload');
          const component = await this.getOrCreateLoadingPromise(componentName, loader);
          this.endTracking(componentName, startTime, 'preload', true);
          return component;
        } catch (error) {
          console.warn(`Failed to preload ${componentName}:`, error);
          return null;
        }
      }
      return null;
    });

    await Promise.allSettled(preloadPromises);
  }
}

// Create singleton instance
export const performanceMonitor = new LazyLoadingPerformanceMonitor();

// Enhanced lazy loading utility with performance tracking
export const createLazyComponent = <T extends React.ComponentType<any>>(
  componentLoader: () => Promise<{ default: T }>,
  componentName: string,
  options: {
    preload?: boolean;
    fallback?: React.ComponentType;
    errorBoundary?: React.ComponentType<{ error: Error; children: React.ReactNode }>;
  } = {}
) => {
  const { preload = false, fallback: Fallback, errorBoundary: ErrorBoundary } = options;

  // Check cache first
  const cachedComponent = performanceMonitor.getCachedComponent(componentName);
  if (cachedComponent) {
    return cachedComponent.default;
  }

  const LazyComponent = React.lazy(async () => {
    const startTime = performanceMonitor.startTracking(componentName, preload ? 'preload' : 'lazy');
    
    try {
      const result = await performanceMonitor.getOrCreateLoadingPromise(componentName, componentLoader);
      performanceMonitor.endTracking(componentName, startTime, preload ? 'preload' : 'lazy', true);
      return result;
    } catch (error) {
      performanceMonitor.endTracking(componentName, startTime, preload ? 'preload' : 'lazy', false);
      throw error;
    }
  });

  // Return wrapped component with error boundary if provided
  const WrappedComponent = (props: any) => {
    const ComponentToRender = (
      <React.Suspense fallback={Fallback ? <Fallback /> : <div>Loading...</div>}>
        <LazyComponent {...props} />
      </React.Suspense>
    );

    if (ErrorBoundary) {
      return (
        <ErrorBoundary error={new Error('Component failed to load')}>
          {ComponentToRender}
        </ErrorBoundary>
      );
    }

    return ComponentToRender;
  };

  return WrappedComponent;
};

// Hook for performance monitoring in components
export const usePerformanceMonitoring = (componentName: string) => {
  const startTimeRef = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    startTimeRef.current = performanceMonitor.startTracking(componentName, 'eager');
    
    return () => {
      if (startTimeRef.current !== undefined) {
        performanceMonitor.endTracking(componentName, startTimeRef.current, 'eager', true);
      }
    };
  }, [componentName]);

  return {
    logStats: () => performanceMonitor.logPerformanceSummary(),
    getComponentMetrics: () => performanceMonitor.getComponentMetrics(componentName)
  };
};

// Development-only performance logger
export const logLazyLoadingPerformance = () => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // Log performance after page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        performanceMonitor.logPerformanceSummary();
      }, 2000);
    });
  }
};