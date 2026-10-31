import { InstallationJob, InstallationStage, InstallationChecklist } from '../../../types/installation';
import { installationJobs, addInstallationJob, updateInstallationJob } from '../../../store/inMemoryDb';
import { ApiResponse } from '../../../types/common';
import { wrapResponse } from '../../../services/apiResponse';
import { apiClient, USE_MOCK_DATA } from '../../../api/apiClient';

export const installationService = {
  async getInstallationJobs(): Promise<ApiResponse<InstallationJob[]>> {
    if (!USE_MOCK_DATA) {
      try {
        const response = await apiClient.get<{ success: boolean; data: InstallationJob[] }>('/installations');
        return wrapResponse<InstallationJob[]>(response.data.data);
      } catch (err) {
        console.warn('[installationService] API failed, falling back to local store:', err);
      }
    }
    return wrapResponse<InstallationJob[]>([...installationJobs]);
  },

  async getInstallationJobById(id: string): Promise<ApiResponse<InstallationJob>> {
    if (!USE_MOCK_DATA) {
      try {
        const response = await apiClient.get<{ success: boolean; data: InstallationJob }>(`/installations/${id}`);
        return wrapResponse<InstallationJob>(response.data.data);
      } catch (err) {
        console.warn('[installationService] API failed, falling back to local store:', err);
      }
    }
    const job = installationJobs.find((j) => j.id === id);
    if (!job) {
      throw new Error(`Installation job "${id}" not found`);
    }
    return wrapResponse<InstallationJob>({ ...job });
  },

  async updateJobStage(id: string, stage: InstallationStage): Promise<ApiResponse<InstallationJob>> {
    if (!USE_MOCK_DATA) {
      try {
        await apiClient.patch(`/installations/${id}/stage`, { stage });
      } catch (err) {
        console.warn('[installationService] Stage update API failed, continuing with local store:', err);
      }
    }
    const updated = updateInstallationJob(id, { stage });
    return wrapResponse<InstallationJob>(updated, 'Job stage updated');
  },

  async submitCommissioning(
    id: string,
    checklist: InstallationChecklist,
    customerSignature: string,
    customerRating?: number,
    customerFeedback?: string
  ): Promise<ApiResponse<InstallationJob>> {
    const now = new Date().toISOString();
    const completionReportNumber = `ICR-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    if (!USE_MOCK_DATA) {
      try {
        await apiClient.put(`/installations/${id}/checklist`, { checklist });
        await apiClient.patch(`/installations/${id}/stage`, { stage: 'COMMISSIONED' });
      } catch (err) {
        console.warn('[installationService] Commissioning API failed, continuing with local store:', err);
      }
    }

    const updated = updateInstallationJob(id, {
      stage: 'COMMISSIONED',
      checklist,
      actualFinishTime: now,
      commissionedAt: now,
      customerSignature,
      customerRating: customerRating || 5,
      customerFeedback,
      completionReportNumber,
    });

    return wrapResponse<InstallationJob>(updated, 'Commissioning report submitted successfully');
  },

  async createJob(data: Omit<InstallationJob, 'id' | 'jobCode' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<InstallationJob>> {
    if (!USE_MOCK_DATA) {
      try {
        const res = await apiClient.post<{ success: boolean; data: InstallationJob }>('/installations', data);
        return wrapResponse<InstallationJob>(res.data.data, 'Installation job created');
      } catch (err) {
        console.warn('[installationService] Create job API failed, continuing with local store:', err);
      }
    }
    const created = addInstallationJob(data as InstallationJob);
    return wrapResponse<InstallationJob>(created, 'Installation job created');
  },
};
