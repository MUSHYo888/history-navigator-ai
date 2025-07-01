
// ABOUTME: Type definitions for clinical reporting and documentation system
// ABOUTME: Defines interfaces for PDF reports, referral letters, SOAP notes, and progress notes

export interface ClinicalReport {
  id: string;
  assessmentId: string;
  reportType: 'clinical_summary' | 'investigation_summary' | 'treatment_plan' | 'discharge_summary';
  title: string;
  content: ReportContent;
  generatedAt: string;
  generatedBy?: string;
  format: 'pdf' | 'html' | 'docx';
  filePath?: string;
  metadata: Record<string, any>;
}

export interface ReportContent {
  patientDemographics: {
    name: string;
    age: number;
    gender: string;
    patientId: string;
    location?: string;
  };
  chiefComplaint: string;
  historyPresentIllness: string[];
  reviewOfSystems: Record<string, any>;
  pastMedicalHistory?: any;
  physicalExamination?: any;
  investigations?: string[];
  differentialDiagnosis: Array<{
    condition: string;
    probability: number;
    explanation?: string;
  }>;
  treatmentPlan?: string[];
  followUpInstructions?: string[];
}

export interface ReferralLetter {
  id: string;
  assessmentId: string;
  specialty: string;
  recipientName?: string;
  recipientFacility?: string;
  urgency: 'routine' | 'urgent' | 'stat';
  clinicalQuestion: string;
  relevantHistory?: string;
  examinationFindings?: string;
  investigationsCompleted?: string;
  letterContent: ReferralLetterContent;
  createdAt: string;
  sentAt?: string;
  status: 'draft' | 'sent' | 'acknowledged';
}

export interface ReferralLetterContent {
  patientDetails: {
    name: string;
    age: number;
    gender: string;
    patientId: string;
  };
  clinicalSummary: string;
  specificRequest: string;
  investigations: string[];
  urgencyReason?: string;
  contactDetails: {
    referringPhysician: string;
    facility: string;
    phone?: string;
    email?: string;
  };
}

export interface SOAPNote {
  id: string;
  assessmentId: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  additionalNotes?: string;
  createdAt: string;
  updatedAt: string;
  author?: string;
  templateUsed?: string;
}

export interface ProgressNote {
  id: string;
  patientId: string;
  assessmentId?: string;
  previousAssessmentId?: string;
  visitDate: string;
  chiefComplaint?: string;
  intervalHistory: string;
  examinationChanges?: string;
  investigationResults?: string;
  assessmentChanges?: string;
  planModifications?: string;
  followUpInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  type: 'clinical_report' | 'referral_letter' | 'soap_note' | 'progress_note';
  specialty?: string;
  templateContent: any;
  defaultTemplate: boolean;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

export interface PDFExportOptions {
  includeHeader: boolean;
  includeFooter: boolean;
  includePageNumbers: boolean;
  orientation: 'portrait' | 'landscape';
  format: 'a4' | 'letter';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}
