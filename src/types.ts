export interface BiobankInfo {
  consent: boolean;
  consentDate?: string;
  bloodTubesCount?: number;
  urineSample?: boolean;
  stoolSample?: boolean;
  otherSamples?: string[];
}

export interface OmicsData {
  dnaSequenced?: boolean;
  rnaSequenced?: boolean;
  proteinProfiling?: boolean;
  metabolomics?: boolean;
  details?: {
    dnaVariantCount?: string;
    rnaExpressedGenes?: string;
    proteinBiomarkers?: string[];
    metabolitesIdentified?: string;
  };
}

export interface ClinicalImage {
  id: string;
  type: "Xray" | "MRI" | "CT" | string;
  bodyPart: string;
  date: string;
  findings: string;
  visualDescription?: string;
}

export interface Patient {
  id: string;
  name: string;
  birth: string;
  gender: string;
  facility: string;
  status: string;
  biobankConsent?: boolean;
  biobankSamples?: string[];
  biobankConsentDate?: string;
  biobankInfo?: BiobankInfo;
  omicsData?: OmicsData;
  images?: ClinicalImage[];
  records: HistoricalRecord[];
}

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
  chatHistory?: ChatMessage[];
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

