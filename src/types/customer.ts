export type EnquiryStatus =
  | 'QUEUED'
  | 'NEW'
  | 'CONTACTED'
  | 'SURVEY_SCHEDULED'
  | 'SURVEY_DONE'
  | 'QUOTATION_SENT'
  | 'CONVERTED'
  | 'CLOSED_LOST';

export type EnquirySource = 'WEB_FORM' | 'WHATSAPP' | 'PHONE_CALL' | 'REFERRAL' | 'WALK_IN';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  pincode: string;
  monthlyBill: number; // in INR
  requiredCapacityKW: number; // 1-10
  systemType: 'ON_GRID' | 'OFF_GRID';
  subsidyRequired: boolean;
  enquirySource: EnquirySource;
  status: EnquiryStatus;
  milestoneStep?: number; // 0: Inquiry, 1: Survey, 2: Quotation, 3: DISCOM, 4: Installation, 5: Commissioned
  notes: string;
  assignedTo: string; // sales person name
  createdAt: string;
  updatedAt: string;
}
