import { ApiResponse } from '../types/common';

/**
 * Wraps payload in a standardized ApiResponse envelope
 */
export function wrapResponse<T>(data: T, message: string = 'Success'): ApiResponse<T> {
  return {
    data,
    success: true,
    message,
    timestamp: new Date().toISOString(),
  };
}
