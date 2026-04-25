import { Json } from '@/integrations/supabase/types';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  patientId: string;
  location: string;
  createdAt: string;
  lastAssessment?: string;
}

export interface Assessment {
  id: string;
  patientId: string;
  chiefComplaint: string;
  status: 'in-progress' | 'completed' | 'draft';
  currentStep: number;
  createdAt: string;
  updatedAt: string;
  family_history?: string;
  social_history?: string;
  vital_signs?: Json;
  systems?: Json;
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'yes-no' | 'text' | 'scale' | 'multiple-choice-with-text';
  options?: string[];
  category: string;
  required: boolean;
  phase?: 1 | 2;
  clinicalPriority?: 1 | 2 | 3 | 4 | 5;
  redFlagIndicator?: boolean;
  questionRationale?: string;
  followUpTrigger?: string;
}

export interface Answer {
  questionId: string;
  value: string | number | boolean;
  notes?: string;
}

export interface ReviewOfSystems {
  [system: string]: {
    positive: string[];
    negative: string[];
    notes?: string;
  };
}

export interface DifferentialDiagnosis {
  condition: string;
  probability: number;
  explanation: string;
  keyFeatures: string[];
  guidelineCitation?: string;
  statOrders?: string[];
}

export interface DDxResponse {
  pertinentNegatives: string[];
  soapNote: string;
  differentialDiagnoses: DifferentialDiagnosis[];
}

export interface ClinicalSummary {
  patientInfo: Patient;
  chiefComplaint: string;
  historyOfPresentIllness: string;
  reviewOfSystems: ReviewOfSystems;
  pastMedicalHistory: string[];
  socialHistory: string[];
  physicalExam: string;
  investigations: string[];
  differentialDiagnoses: DifferentialDiagnosis[];
  plan: string;
}

export interface SocialHistoryData {
  smokingStatus: string;
  packYears: string;
  alcoholUse: string;
  alcoholDetails: string;
  occupation: string;
  livingSituation: string;
  otherNotes: string;
}

export interface PastMedicalHistoryData {
  conditions: string[];
  surgeries: string[];
  medications: string[];
  allergies: string[];
  familyHistory: string;
  socialHistory: string;
  socialHistoryStructured?: SocialHistoryData;
}

export interface Investigation {
  id: string;
  name: string;
  type: 'laboratory' | 'imaging' | 'cardiac' | 'pulmonary' | 'other';
  category: string;
  indication: string;
  urgency: 'routine' | 'urgent' | 'stat';
  cost: 'low' | 'moderate' | 'high';
  rationale: string;
  expectedFindings?: string;
}

export interface InvestigationRecommendation {
  investigation: Investigation;
  priority: number;
  clinicalRationale: string;
  contraindications?: string[];
  alternatives?: string[];
}

export interface RedFlag {
  condition: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  immediateActions: string[];
}

export interface ClinicalGuideline {
  title: string;
  source: string;
  recommendation: string;
  evidenceLevel: 'A' | 'B' | 'C' | 'D';
  applicableConditions: string[];
}

export interface ClinicalDecisionSupport {
  investigations: InvestigationRecommendation[];
  redFlags: RedFlag[];
  guidelines: ClinicalGuideline[];
  treatmentRecommendations: string[];
  followUpRecommendations: string[];
}
