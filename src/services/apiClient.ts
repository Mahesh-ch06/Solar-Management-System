/**
 * Production HTTP API Client for SunPower Solutions Solar ERP
 * Handles base URL configuration, Bearer token injection, request envelopes, and unified error handling
 */

export interface ApiClientConfig {
  baseUrl: string;
  timeoutMs?: number;
}

export class ApiError extends Error {
  public status: number;
  public data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
  }

  /**
   * Check whether a real backend server URL is configured
   */
  public isBackendAvailable(): boolean {
    return Boolean(import.meta.env.VITE_API_BASE_URL);
  }

  /**
   * Retrieve active session JWT / Bearer token
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('sunpower_auth_session');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.token || null;
    } catch {
      return null;
    }
  }

  /**
   * Construct standard HTTP headers
   */
  private getHeaders(customHeaders?: HeadersInit): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (customHeaders) {
      return { ...headers, ...customHeaders };
    }

    return headers;
  }

  /**
   * Unified request handler
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: this.getHeaders(options.headers),
      });

      if (response.status === 401) {
        // Clear expired or invalid token
        if (typeof window !== 'undefined') {
          localStorage.removeItem('sunpower_auth_session');
        }
        throw new ApiError('Authentication required or session expired', 401);
      }

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        const errorMessage =
          (isJson && data?.message) ||
          `HTTP Error ${response.status}: ${response.statusText}`;
        throw new ApiError(errorMessage, response.status, data);
      }

      return data as T;
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        throw err;
      }
      const message = err instanceof Error ? err.message : 'Unknown network error';
      throw new ApiError(`Network connection failed: ${message}`, 0);
    }
  }

  // HTTP Method Wrappers
  public async get<T>(endpoint: string, queryParams?: Record<string, string | number | boolean>): Promise<T> {
    let url = endpoint;
    if (queryParams) {
      const searchParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const qs = searchParams.toString();
      if (qs) {
        url += (url.includes('?') ? '&' : '?') + qs;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  public async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
