import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== 'false'; // Defaults to true for Phase 1

export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach authentication token and client telemetry
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('sunpower_auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['X-Client-Version'] = '1.0.0-phase1';
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Normalize responses and catch global API errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized: Redirect to login or refresh token
          console.warn('[API Client] Unauthorized request - session expired');
          break;
        case 403:
          console.warn('[API Client] Forbidden request - insufficient permissions');
          break;
        case 404:
          console.warn('[API Client] Resource not found:', error.config?.url);
          break;
        case 500:
          console.error('[API Client] Internal server error');
          break;
      }
    } else if (error.request) {
      console.error('[API Client] Network connection lost or timeout');
    }
    return Promise.reject(error);
  }
);
