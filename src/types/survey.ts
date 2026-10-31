export type SurveyStatus = 'PENDING' | 'SCHEDULED' | 'COMPLETED' | 'APPROVED' | 'REJECTED';
export type RoofType = 'RCC_FLAT' | 'RCC_SLOPED' | 'TIN_SHED' | 'TILE' | 'OTHER';

export interface Survey {
  id: string;
  customerId: string;
  customerName: string;
  address: string;
  status: SurveyStatus;
  assignedTechnicianId: string;
  assignedTechnicianName: string;
  scheduledDate: string;
  completedDate?: string;
  // Roof measurements
  roofType: RoofType;
  totalRoofAreaSqFt: number;
  shadowFreeAreaSqFt: number;
  roofDirection: 'SOUTH' | 'SOUTH_EAST' | 'SOUTH_WEST' | 'EAST' | 'WEST' | 'FLAT';
  tiltAngleDeg: number;
  acCableDistanceMeters: number;
  dcCableDistanceMeters: number;
  // Assessment
  gridConnectionSuitable: boolean;
  gridConnectionNotes: string;
  structureFeasible: boolean;
  recommendedCapacityKW: number;
  surveyNotes: string;
  // Approval
  approvedBy?: string;
  approvalNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}
