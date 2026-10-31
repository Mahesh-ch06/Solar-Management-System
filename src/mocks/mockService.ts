import { ApiResponse } from '../types/common';

const DEFAULT_DELAY_MS = 350;

/**
 * Simulates network latency and wraps data in standard ApiResponse envelope
 */
export async function simulateMockApiCall<T>(
  data: T,
  delayMs: number = DEFAULT_DELAY_MS,
  shouldFail: boolean = false
): Promise<ApiResponse<T>> {
  await new Promise((resolve) => setTimeout(resolve, delayMs));

  if (shouldFail) {
    throw new Error('Simulated network error: Failed to fetch data from mock service');
  }

  return {
    data,
    success: true,
    message: 'Data successfully retrieved from mock adapter',
    timestamp: new Date().toISOString(),
    isMockData: true,
  };
}
