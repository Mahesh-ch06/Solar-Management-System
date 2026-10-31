import { apiClient, USE_MOCK_DATA } from '../../../api/apiClient';
import { DashboardData } from '../../../types/dashboard';
import { ApiResponse } from '../../../types/common';
import { MOCK_DASHBOARD_DATA } from '../../../mocks/data/mockDashboard';
import { simulateMockApiCall } from '../../../mocks/mockService';

export const dashboardService = {
  async getDashboardData(): Promise<ApiResponse<DashboardData>> {
    if (USE_MOCK_DATA) {
      return simulateMockApiCall(MOCK_DASHBOARD_DATA, 400);
    }

    const response = await apiClient.get<ApiResponse<DashboardData>>('/dashboard/overview');
    return response.data;
  },
};
