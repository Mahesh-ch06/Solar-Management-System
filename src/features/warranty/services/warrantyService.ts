import { ApiResponse } from '../../../types/common';
import { WarrantyRecord } from '../../../types/operations';
import { warrantyRecords } from '../../../store/inMemoryDb';
import { simulateMockApiCall } from '../../../mocks/mockService';

export const warrantyService = {
  /**
   * Retrieves all registered warranty records
   */
  async getWarrantyRecords(): Promise<ApiResponse<WarrantyRecord[]>> {
    return simulateMockApiCall<WarrantyRecord[]>([...warrantyRecords], 350);
  },

  /**
   * Searches for a warranty record by exact or partial serial number
   */
  async searchBySerial(serialNumber: string): Promise<ApiResponse<WarrantyRecord | null>> {
    const clean = serialNumber.trim().toLowerCase();
    const match =
      warrantyRecords.find((w) => w.serialNumber.trim().toLowerCase() === clean) ||
      warrantyRecords.find((w) => w.serialNumber.toLowerCase().includes(clean)) ||
      null;

    return simulateMockApiCall<WarrantyRecord | null>(match ? { ...match } : null, 350);
  },

  /**
   * Retrieves records that are expiring within the specified days threshold (default 60 days)
   */
  async getExpiringRecords(daysThreshold: number = 60): Promise<ApiResponse<WarrantyRecord[]>> {
    const now = Date.now();
    const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000;

    const expiring = warrantyRecords.filter((w) => {
      if (w.status === 'EXPIRING_SOON') return true;
      if (w.status === 'EXPIRED') return false;

      const expiryTime = new Date(w.warrantyExpiryDate).getTime();
      const diff = expiryTime - now;
      return diff > 0 && diff <= thresholdMs;
    });

    return simulateMockApiCall<WarrantyRecord[]>([...expiring], 350);
  },
};
