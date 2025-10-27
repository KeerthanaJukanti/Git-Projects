/**
 * API Configuration and Utilities
 * Handles different environments (development, Docker, production)
 */

// Get the API base URL based on environment
function getApiBaseUrl(): string {
  // In browser environment, check for Vite environment variable
  if (typeof window !== 'undefined') {
    // Check if we're in a Docker container or production
    const hostname = window.location.hostname;
    
    // If running in Docker or production, use the current host
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${window.location.protocol}//${hostname}:4000`;
    }
    
    // For local development, use localhost
    return 'http://localhost:4000';
  }
  
  // Fallback for server-side rendering
  return process.env.VITE_API_URL || 'http://localhost:4000';
}

export const API_BASE_URL = getApiBaseUrl();

/**
 * Makes an API request with proper error handling
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorMessage;
    } catch {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return response.text() as T;
}

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  // Authentication
  REQUEST_PASSWORDLESS: '/auth/passwordless/request',
  VERIFY_TOKEN: '/auth/passwordless/verify',
  REFRESH_TOKEN: '/auth/refresh',
  LOGOUT: '/auth/logout',
  
  // User
  GET_USER: '/me',
  
  // Health
  HEALTH: '/health',
} as const;

/**
 * Authentication API calls
 */
export const authApi = {
  requestPasswordless: (email: string) =>
    apiRequest(API_ENDPOINTS.REQUEST_PASSWORDLESS, {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyToken: (token: string) =>
    apiRequest(API_ENDPOINTS.VERIFY_TOKEN, {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  refreshToken: () =>
    apiRequest(API_ENDPOINTS.REFRESH_TOKEN, {
      method: 'POST',
    }),

  logout: () =>
    apiRequest(API_ENDPOINTS.LOGOUT, {
      method: 'POST',
    }),
};

/**
 * User API calls
 */
export const userApi = {
  getCurrentUser: () => apiRequest(API_ENDPOINTS.GET_USER),
};

/**
 * Health check
 */
export const healthApi = {
  check: () => apiRequest(API_ENDPOINTS.HEALTH),
};
