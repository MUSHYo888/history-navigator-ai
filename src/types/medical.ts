
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
}

export interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'yes-no' | 'text' | 'scale';
  options?: string[];
  category: string;
  required: boolean;
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
