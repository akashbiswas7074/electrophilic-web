// Image utility functions for consistent image handling across the platform

export interface ImageConfig {
  defaultPlaceholder?: string;
  retryAttempts?: number;
  retryDelay?: number;
  compressionQuality?: number;
  enableProgressiveLoading?: boolean;
}

export const defaultImageConfig: ImageConfig = {
  defaultPlaceholder: '/images/placeholder.jpg',
  retryAttempts: 3,
  retryDelay: 1000,
  compressionQuality: 80,
  enableProgressiveLoading: true,
};

// Generate optimized image URLs with various transformations
export const generateImageUrl = (
  baseUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
    fit?: 'cover' | 'contain' | 'fill';
  } = {}
): string => {
  if (!baseUrl) return defaultImageConfig.defaultPlaceholder!;
  
  // If it's already a placeholder or external URL, return as-is
  if (baseUrl.includes('placeholder') || baseUrl.startsWith('http')) {
    return baseUrl;
  }

  const params = new URLSearchParams();
  
  if (options.width) params.append('w', options.width.toString());
  if (options.height) params.append('h', options.height.toString());
  if (options.quality) params.append('q', options.quality.toString());
  if (options.format) params.append('f', options.format);
  if (options.fit) params.append('fit', options.fit);

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

// Generate responsive image srcSet
export const generateSrcSet = (baseUrl: string, widths: number[] = [320, 640, 768, 1024, 1280]): string => {
  if (!baseUrl || baseUrl.includes('placeholder')) return '';
  
  return widths
    .map(width => `${generateImageUrl(baseUrl, { width, quality: 80, format: 'webp' })} ${width}w`)
    .join(', ');
};

// Generate sizes attribute for responsive images
export const generateSizes = (breakpoints: { [key: string]: string } = {}): string => {
  const defaultBreakpoints = {
    '(max-width: 640px)': '100vw',
    '(max-width: 768px)': '50vw',
    '(max-width: 1024px)': '33vw',
    ...breakpoints
  };

  const sizeEntries = Object.entries(defaultBreakpoints);
  const mediaQueries = sizeEntries.slice(0, -1).map(([query, size]) => `${query} ${size}`);
  const defaultSize = sizeEntries[sizeEntries.length - 1][1];
  
  return [...mediaQueries, defaultSize].join(', ');
};

// Preload critical images
export const preloadImage = (src: string, priority: 'high' | 'low' = 'low'): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    
    if (priority === 'high') {
      img.loading = 'eager';
    }
    
    img.src = src;
  });
};

// Batch preload multiple images
export const preloadImages = async (urls: string[], priority: 'high' | 'low' = 'low'): Promise<void> => {
  const preloadPromises = urls.map(url => preloadImage(url, priority));
  await Promise.allSettled(preloadPromises);
};

// Check if image URL is valid
export const isValidImageUrl = (url: string): boolean => {
  try {
    new URL(url);
    return /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url);
  } catch {
    return false;
  }
};

// Get image placeholder based on category
export const getCategoryPlaceholder = (category?: string): string => {
  const placeholders = {
    electronics: '/images/placeholders/electronics.jpg',
    clothing: '/images/placeholders/clothing.jpg',
    books: '/images/placeholders/books.jpg',
    home: '/images/placeholders/home.jpg',
    sports: '/images/placeholders/sports.jpg',
    beauty: '/images/placeholders/beauty.jpg',
    default: '/images/placeholder.jpg'
  };

  return placeholders[category?.toLowerCase() as keyof typeof placeholders] || placeholders.default;
};

// Image compression utility (client-side)
export const compressImage = (
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to compress image'));
        }
      }, 'image/jpeg', quality);
    };

    img.src = URL.createObjectURL(file);
  });
};

// Generate blur data URL for progressive loading
export const generateBlurDataUrl = (width: number = 10, height: number = 10): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL();
};

// Image loading state manager
export class ImageLoadingManager {
  private loadingStates = new Map<string, boolean>();
  private errorStates = new Map<string, boolean>();
  private retryCount = new Map<string, number>();

  isLoading(src: string): boolean {
    return this.loadingStates.get(src) || false;
  }

  hasError(src: string): boolean {
    return this.errorStates.get(src) || false;
  }

  setLoading(src: string, loading: boolean): void {
    this.loadingStates.set(src, loading);
    if (loading) {
      this.errorStates.set(src, false);
    }
  }

  setError(src: string, error: boolean): void {
    this.errorStates.set(src, error);
    this.loadingStates.set(src, false);
  }

  canRetry(src: string): boolean {
    const count = this.retryCount.get(src) || 0;
    return count < defaultImageConfig.retryAttempts!;
  }

  incrementRetry(src: string): void {
    const count = this.retryCount.get(src) || 0;
    this.retryCount.set(src, count + 1);
  }

  reset(src: string): void {
    this.loadingStates.delete(src);
    this.errorStates.delete(src);
    this.retryCount.delete(src);
  }

  clear(): void {
    this.loadingStates.clear();
    this.errorStates.clear();
    this.retryCount.clear();
  }
}

// Global image loading manager instance
export const imageLoadingManager = new ImageLoadingManager();