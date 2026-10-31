import { ApiResponse } from '../../../types/common';
import { WarrantyRecord } from '../../../types/operations';
import { warrantyRecords } from '../../../store/inMemoryDb';
import { wrapResponse } from '../../../services/apiResponse';
import { apiClient, USE_MOCK_DATA } from '../../../api/apiClient';

export const warrantyService = {
  /**
   * Retrieves all registered warranty records
   */
  async getWarrantyRecords(): Promise<ApiResponse<WarrantyRecord[]>> {
    if (!USE_MOCK_DATA) {
      try {
        const res = await apiClient.get<{ success: boolean; data: WarrantyRecord[] }>('/warranties');
        if (res.data?.success && Array.isArray(res.data.data)) {
          return wrapResponse<WarrantyRecord[]>(res.data.data);
        }
      } catch (err) {
        console.warn('[warrantyService] API getWarrantyRecords failed, falling back to local store:', err);
      }
    }
    return wrapResponse<WarrantyRecord[]>([...warrantyRecords]);
  },

  /**
   * Searches for a warranty record by exact or partial serial number
   */
  async searchBySerial(serialNumber: string): Promise<ApiResponse<WarrantyRecord | null>> {
    const clean = serialNumber.trim().toUpperCase();

    if (!USE_MOCK_DATA) {
      try {
        const res = await apiClient.get<{ success: boolean; data: WarrantyRecord }>(`/warranties/verify/${clean}`);
        if (res.data?.success && res.data.data) {
          return wrapResponse<WarrantyRecord | null>(res.data.data);
        }
      } catch (err) {
        console.warn('[warrantyService] API searchBySerial failed, falling back to local store:', err);
      }
    }

    const match =
      warrantyRecords.find((w) => w.serialNumber.trim().toUpperCase() === clean) ||
      warrantyRecords.find((w) => w.serialNumber.toUpperCase().includes(clean)) ||
      null;

    return wrapResponse<WarrantyRecord | null>(match ? { ...match } : null);
  },

  /**
   * Retrieves records that are expiring within the specified days threshold (default 60 days)
   */
  async getExpiringRecords(daysThreshold: number = 60): Promise<ApiResponse<WarrantyRecord[]>> {
    const records = await this.getWarrantyRecords();
    const now = Date.now();
    const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000;

    const expiring = (records.data || []).filter((w) => {
      if (w.status === 'EXPIRING_SOON') return true;
      if (w.status === 'EXPIRED') return false;

      const expiryTime = new Date(w.warrantyExpiryDate).getTime();
      const diff = expiryTime - now;
      return diff > 0 && diff <= thresholdMs;
    });

    return wrapResponse<WarrantyRecord[]>([...expiring]);
  },
};
