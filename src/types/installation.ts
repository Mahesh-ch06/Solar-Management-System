export type InstallationStage = 'SCHEDULED' | 'MATERIAL_STAGED' | 'IN_PROGRESS' | 'TESTING' | 'COMMISSIONED';

export interface InstallationChecklist {
  structureAnchoringChecked: boolean;
  panelMountingTightened: boolean;
  dcPolarityVerified: boolean;
  dcStringVocVolts: number;
  inverterWallMounted: boolean;
  acDcdbInstalled: boolean;
  earthResistanceOhms: number; // must be < 5 ohms
  lightningArresterConnected: boolean;
  generationTestWatts: number;
  customerBriefed: boolean;
}

export interface InstallationJob {
  id: string;
  jobCode: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  siteAddress: string;
  capacityKW: number;
  systemType: 'ON_GRID' | 'OFF_GRID';
  leadTechnicianId: string;
  leadTechnicianName: string;
  assistantTechnicianIds: string[];
  scheduledStartDate: string;
  scheduledEndDate: string;
  actualStartTime?: string;
  actualFinishTime?: string;
  stage: InstallationStage;
  checklist: InstallationChecklist;
  photos: {
    panelsMountedUrl?: string;
    inverterWiringUrl?: string;
    netMeterUrl?: string;
  };
  customerSignature?: string; // data URL or signature confirmation
  customerRating?: number; // 1 to 5
  customerFeedback?: string;
  completionReportNumber?: string;
  commissionedAt?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
