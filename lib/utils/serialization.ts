/**
 * Serializes MongoDB documents and objects containing ObjectId to plain JSON
 * This resolves the error: "Only plain objects can be passed to Client Components from Server Components"
 */
export function serializeData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => serializeData(item));
  }

  // Handle plain objects (but not dates, etc.)
  if (data !== null && typeof data === 'object' && Object.getPrototypeOf(data) === Object.prototype) {
    const serialized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      // Convert MongoDB ObjectIds to strings
      if (key === '_id' && value && typeof value === 'object' && 'toString' in value) {
        serialized[key] = value.toString();
      } else {
        serialized[key] = serializeData(value);
      }
    }
    return serialized;
  }

  // Handle MongoDB ObjectId specifically
  if (data && typeof data === 'object' && data.constructor && data.constructor.name === 'ObjectId') {
    return data.toString();
  }

  // Return primitive values and other types as-is
  return data;
}
