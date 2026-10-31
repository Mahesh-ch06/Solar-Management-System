import { InstallationJob, InstallationStage, InstallationChecklist } from '../../../types/installation';
import { installationJobs, addInstallationJob, updateInstallationJob } from '../../../store/inMemoryDb';
import { ApiResponse } from '../../../types/common';
import { simulateMockApiCall } from '../../../mocks/mockService';

export const installationService = {
  async getInstallationJobs(): Promise<ApiResponse<InstallationJob[]>> {
    return simulateMockApiCall([...installationJobs], 350);
  },

  async getInstallationJobById(id: string): Promise<ApiResponse<InstallationJob>> {
    const job = installationJobs.find((j) => j.id === id);
    if (!job) {
      throw new Error(`Installation job "${id}" not found`);
    }
    return simulateMockApiCall({ ...job }, 250);
  },

  async updateJobStage(id: string, stage: InstallationStage): Promise<ApiResponse<InstallationJob>> {
    const updated = updateInstallationJob(id, { stage });
    return simulateMockApiCall(updated, 300);
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

    return simulateMockApiCall(updated, 400);
  },

  async createJob(data: Omit<InstallationJob, 'id' | 'jobCode' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<InstallationJob>> {
    const created = addInstallationJob(data as InstallationJob);
    return simulateMockApiCall(created, 350);
  },
};
