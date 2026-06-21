export interface MedicalData {
  patientName?: string;
  patientAge?: string;
  patientGender?: string;
  patientId?: string;
  documentDate?: string;
  documentType: string;
  facilityName?: string;
  providerName?: string;
  summary: string; // Dynamic combination of medical data + visual image observations
  imageObservations?: string; // Foundational language translation of the clinical scan image
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

export interface HistoricalRecord {
  id: string;
  date: string; // YYYY-MM-DD
  fileName?: string;
  imageName?: string;
  medicalData: MedicalData;
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

export interface IntegratedDossierState {
  documentFile: UploadedFileState | null;
  imageFile: UploadedFileState | null;
  medicalHistory: string;
}

