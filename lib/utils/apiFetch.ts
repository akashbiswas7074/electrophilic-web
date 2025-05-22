// Example of a centralized fetch utility

/**
 * Centralized fetch utility that ensures credentials are always included
 * and common headers are set
 */
export const apiFetch = async (url: string, options: RequestInit = {}) => {
  // Always include credentials by default
  const finalOptions: RequestInit = {
    ...options,
    credentials: 'include', // This ensures cookies are sent with requests
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  };

  const response = await fetch(url, finalOptions);
  
  // Handle common response scenarios
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }
  
  return response.json();
};

// Type-safe post helper
export const apiPost = async <T>(url: string, data: any): Promise<T> => {
  return apiFetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
  }) as Promise<T>;
};

// Type-safe put helper
export const apiPut = async <T>(url: string, data: any): Promise<T> => {
  return apiFetch(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  }) as Promise<T>;
};

// Type-safe delete helper
export const apiDelete = async <T>(url: string, data?: any): Promise<T> => {
  return apiFetch(url, {
    method: 'DELETE',
    ...(data ? { body: JSON.stringify(data) } : {})
  }) as Promise<T>;
};

// Usage:
// const data = await apiFetch('/api/user/address', { 
//   method: 'POST', 
//   body: JSON.stringify({ address: addressData }) 
// });
