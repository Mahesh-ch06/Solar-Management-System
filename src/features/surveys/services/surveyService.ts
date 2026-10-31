import { Survey, SurveyStatus } from '../../../types/survey';
import {
  surveys,
  customers,
  addSurvey as dbAddSurvey,
  updateSurvey as dbUpdateSurvey,
  updateCustomer as dbUpdateCustomer,
} from '../../../store/inMemoryDb';
import { SurveyFormData } from '../../../utils/validators';
import { apiClient, USE_MOCK_DATA } from '../../../api/apiClient';

const SIMULATED_DELAY_MS = 150;

const delay = (ms: number = SIMULATED_DELAY_MS) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export interface CreateSurveyPayload extends SurveyFormData {
  customerId: string;
  customerName?: string;
  address?: string;
  assignedTechnicianName?: string;
}

export const surveyService = {
  /**
   * Fetches all surveys
   */
  async getSurveys(): Promise<Survey[]> {
    if (!USE_MOCK_DATA) {
      try {
        const res = await apiClient.get<{ success: boolean; data: Survey[] }>('/surveys');
        if (res.data?.success && Array.isArray(res.data.data)) {
          return res.data.data;
        }
      } catch (err) {
        console.warn('[surveyService] API getSurveys failed, falling back to local store:', err);
      }
    }
    await delay();
    return [...surveys];
  },

  /**
   * Fetches a single survey by ID
   */
  async getSurveyById(id: string): Promise<Survey | undefined> {
    if (!USE_MOCK_DATA) {
      try {
        const res = await apiClient.get<{ success: boolean; data: Survey }>(`/surveys/${id}`);
        if (res.data?.success && res.data.data) {
          return res.data.data;
        }
      } catch (err) {
        console.warn('[surveyService] API getSurveyById failed, falling back to local store:', err);
      }
    }
    await delay();
    return surveys.find((s) => s.id === id);
  },

  /**
   * Fetches surveys associated with a specific customer
   */
  async getSurveysByCustomerId(customerId: string): Promise<Survey[]> {
    if (!USE_MOCK_DATA) {
      try {
        const res = await apiClient.get<{ success: boolean; data: Survey[] }>(`/surveys/customer/${customerId}`);
        if (res.data?.success && Array.isArray(res.data.data)) {
          return res.data.data;
        }
      } catch (err) {
        console.warn('[surveyService] API getSurveysByCustomerId failed, falling back to local store:', err);
      }
    }
    await delay();
    return surveys.filter((s) => s.customerId === customerId);
  },

  /**
   * Creates a new survey and updates customer enquiry status to SURVEY_SCHEDULED
   */
  async addSurvey(data: CreateSurveyPayload): Promise<Survey> {
    if (!USE_MOCK_DATA) {
      try {
        const res = await apiClient.post<{ success: boolean; data: Survey }>('/surveys', data);
        if (res.data?.success && res.data.data) {
          return res.data.data;
        }
      } catch (err) {
        console.warn('[surveyService] API addSurvey failed, falling back to local store:', err);
      }
    }

    await delay();

    const targetCustomer = customers.find((c) => c.id === data.customerId);
    const customerName = data.customerName || targetCustomer?.name || 'Unknown Customer';
    const address = data.address || (targetCustomer ? `${targetCustomer.address}, ${targetCustomer.city}` : 'Site Address');

    const now = new Date().toISOString();
    const newSurvey: Survey = {
      id: `srv-${String(surveys.length + 1).padStart(3, '0')}`,
      customerId: data.customerId,
      customerName,
      address,
      status: 'SCHEDULED',
      assignedTechnicianId: data.assignedTechnicianId,
      assignedTechnicianName: data.assignedTechnicianName || 'Field Technician',
      scheduledDate: data.scheduledDate,
      roofType: data.roofType,
      totalRoofAreaSqFt: Number(data.totalRoofAreaSqFt),
      shadowFreeAreaSqFt: Number(data.shadowFreeAreaSqFt),
      roofDirection: data.roofDirection,
      tiltAngleDeg: Number(data.tiltAngleDeg),
      acCableDistanceMeters: Number(data.acCableDistanceMeters),
      dcCableDistanceMeters: Number(data.dcCableDistanceMeters),
      gridConnectionSuitable: Boolean(data.gridConnectionSuitable),
      gridConnectionNotes: data.gridConnectionNotes || '',
      structureFeasible: Boolean(data.structureFeasible),
      recommendedCapacityKW: Number(data.recommendedCapacityKW),
      surveyNotes: data.surveyNotes || '',
      createdAt: now,
      updatedAt: now,
    };

    dbAddSurvey(newSurvey);
    dbUpdateCustomer(data.customerId, { status: 'SURVEY_SCHEDULED' });

    return newSurvey;
  },

  /**
   * Updates an existing survey record
   */
  async updateSurvey(id: string, updates: Partial<Survey>): Promise<Survey | undefined> {
    if (!USE_MOCK_DATA) {
      try {
        if (updates.status && ['APPROVED', 'REJECTED'].includes(updates.status)) {
          const res = await apiClient.patch<{ success: boolean; data: Survey }>(`/surveys/${id}/feasibility`, {
            feasibilityStatus: updates.status,
            rejectionReason: updates.rejectionReason,
            remarks: updates.surveyNotes,
          });
          if (res.data?.success && res.data.data) {
            return res.data.data;
          }
        }
      } catch (err) {
        console.warn('[surveyService] API updateSurvey failed, falling back to local store:', err);
      }
    }

    await delay();
    return dbUpdateSurvey(id, updates);
  },

  /**
   * Approves or rejects a survey
   */
  async updateSurveyStatus(id: string, status: SurveyStatus, rejectionReason?: string): Promise<Survey | undefined> {
    return this.updateSurvey(id, { status, rejectionReason });
  },
};
