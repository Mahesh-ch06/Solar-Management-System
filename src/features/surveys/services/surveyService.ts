import { Survey, SurveyStatus } from '../../../types/survey';
import {
  surveys,
  customers,
  addSurvey as dbAddSurvey,
  updateSurvey as dbUpdateSurvey,
  updateCustomer as dbUpdateCustomer,
} from '../../../store/inMemoryDb';
import { SurveyFormData } from '../../../utils/validators';

const SIMULATED_DELAY_MS = 350;

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
   * Fetches all surveys from in-memory store
   */
  async getSurveys(): Promise<Survey[]> {
    await delay();
    return [...surveys];
  },

  /**
   * Fetches a single survey by ID
   */
  async getSurveyById(id: string): Promise<Survey | undefined> {
    await delay();
    return surveys.find((s) => s.id === id);
  },

  /**
   * Fetches surveys associated with a specific customer
   */
  async getSurveysByCustomerId(customerId: string): Promise<Survey[]> {
    await delay();
    return surveys.filter((s) => s.customerId === customerId);
  },

  /**
   * Creates a new survey and updates customer enquiry status to SURVEY_SCHEDULED
   */
  async addSurvey(data: CreateSurveyPayload): Promise<Survey> {
    await delay();

    // Look up customer details if not directly supplied
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

    // Automatically transition customer to SURVEY_SCHEDULED if currently NEW/CONTACTED
    if (targetCustomer && (targetCustomer.status === 'NEW' || targetCustomer.status === 'CONTACTED')) {
      try {
        dbUpdateCustomer(targetCustomer.id, { status: 'SURVEY_SCHEDULED' });
      } catch {
        // Safe ignore
      }
    }

    return newSurvey;
  },

  /**
   * Approves, rejects, or updates the status of a survey with engineer notes
   */
  async updateSurveyStatus(
    id: string,
    status: SurveyStatus,
    notes?: string
  ): Promise<Survey> {
    await delay();

    const patch: Partial<Survey> = {
      status,
    };

    const todayDate = new Date().toISOString().split('T')[0];

    if (status === 'APPROVED') {
      patch.approvedBy = 'Vikram Mehta (Chief Engineer)';
      patch.approvalNotes = notes || 'Technical roof assessment verified and approved.';
      patch.completedDate = patch.completedDate || todayDate;
    } else if (status === 'REJECTED') {
      patch.rejectionReason = notes || 'Site does not meet structural or solar radiation criteria.';
    } else if (status === 'COMPLETED') {
      patch.completedDate = todayDate;
      if (notes) {
        patch.surveyNotes = notes;
      }
    }

    const updated = dbUpdateSurvey(id, patch);
    if (!updated) {
      throw new Error(`Survey with id ${id} not found`);
    }

    // If approved, update customer enquiry status to SURVEY_DONE
    if (status === 'APPROVED' && updated.customerId) {
      try {
        dbUpdateCustomer(updated.customerId, { status: 'SURVEY_DONE' });
      } catch {
        // Safe ignore
      }
    }

    return updated;
  },
};
