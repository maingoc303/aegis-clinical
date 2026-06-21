export interface MedicalData {
  patientName?: string;
  patientAge?: string;
  patientGender?: string;
  patientId?: string;
  documentDate?: string;
  documentType: string;
  facilityName?: string;
  providerName?: string;
  summary: string;
  findings: Array<{
    parameter: string;
    value: string;
    referenceRange?: string;
    status: "NORMAL" | "HIGH" | "LOW" | "ABNORMAL" | string;
    notes?: string;
  }>;
  diagnoses: string[];
  medicationsAndRecommendations: Array<{
    item: string;
    dosageOrInstructions?: string;
    purpose?: string;
  }>;
  criticalAlerts: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}

export interface UploadedFileState {
  name: string;
  size: number;
  type: string;
  base64?: string;
}
