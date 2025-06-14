/**
 * Utility functions for handling route parameters consistently
 */

/**
 * Get the slug parameter from the useParams() hook result
 * This helps standardize parameter usage throughout the app
 */
export function getSlugParam(params: Record<string, string | string[]>): string {
  // Handle both 'slug' and 'categorySlug' for backwards compatibility
  // but prefer 'slug' as the standard
  if ('slug' in params) {
    return Array.isArray(params.slug) ? params.slug[0] : params.slug;
  }
  
  if ('categorySlug' in params) {
    return Array.isArray(params.categorySlug) ? params.categorySlug[0] : params.categorySlug;
  }
  
  // Default fallback
  return '';
}
