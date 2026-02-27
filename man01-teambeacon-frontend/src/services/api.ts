/**
 * Axios API client configuration
 * Handles HTTP requests with interceptors for error handling and logging
 */

import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '../types/api.types';

// API base URL - using AWS API Gateway endpoint
const API_BASE_URL = 'https://e596qxoav7.execute-api.us-west-2.amazonaws.com/dev/api';

// Create Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 seconds
  headers: {
    'Content-Type': 'application/json',
  },
}); 

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add any auth tokens here if needed in the future
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }

    return config;
  },
  (error: AxiosError) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Handle Lambda response format (body is a JSON string)
    if (response.data && typeof response.data.body === 'string') {
      try {
        const parsedBody = JSON.parse(response.data.body);
        response.data = parsedBody;
      } catch (e) {
        console.warn('[API] Failed to parse response body:', e);
      }
    }
    
    return response;
  },
  (error: AxiosError) => {
    // Handle different error types
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      status: error.response?.status,
    };

    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 400:
          apiError.message = 'Invalid request. Please check your information and try again.';
          apiError.code = 'BAD_REQUEST';
          break;
        case 401:
          apiError.message = 'Unauthorized. Please log in and try again.';
          apiError.code = 'UNAUTHORIZED';
          break;
        case 403:
          apiError.message = 'Access forbidden. You do not have permission for this action.';
          apiError.code = 'FORBIDDEN';
          break;
        case 404:
          apiError.message = 'Resource not found. Please try again later.';
          apiError.code = 'NOT_FOUND';
          break;
        case 429:
          apiError.message = 'Too many requests. Please wait a moment and try again.';
          apiError.code = 'RATE_LIMITED';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          apiError.message = 'Server error. Please try again later or contact support.';
          apiError.code = 'SERVER_ERROR';
          break;
        default:
          apiError.message = (data as any)?.message || 'An error occurred. Please try again.';
          apiError.code = 'UNKNOWN_ERROR';
      }

      apiError.details = data as any;
    } else if (error.request) {
      // Request was made but no response received
      apiError.message = 'Unable to connect to the server. Please check your internet connection.';
      apiError.code = 'NETWORK_ERROR';
    } else {
      // Error in request setup
      apiError.message = error.message || 'Failed to make request.';
      apiError.code = 'REQUEST_ERROR';
    }

    console.error('[API Error]', apiError);
    return Promise.reject(apiError);
  }
);

/**
 * Retry failed requests with exponential backoff
 */
export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx) except 429 (rate limit)
      const apiError = error as ApiError;
      if (apiError.status && apiError.status >= 400 && apiError.status < 500 && apiError.status !== 429) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        const waitTime = delay * Math.pow(2, i);
        console.log(`[API] Retrying in ${waitTime}ms... (attempt ${i + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}

/**
 * Check API health
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await apiClient.get('/health');
    return response.status === 200;
  } catch (error) {
    console.error('[API Health Check Failed]', error);
    return false;
  }
}

export default apiClient;
