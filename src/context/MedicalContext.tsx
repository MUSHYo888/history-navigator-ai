
// ABOUTME: Global state management for medical assessment workflow
// ABOUTME: Manages patient data, assessment state, answers, and clinical data
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Patient, Assessment, Answer, ReviewOfSystems } from '@/types/medical';

interface PastMedicalHistoryData {
  conditions: string[];
  surgeries: string[];
  medications: string[];
  allergies: string[];
  familyHistory: string;
  socialHistory: string;
}

interface PhysicalExamData {
  vitalSigns: {
    bloodPressure: string;
    heartRate: string;
    respiratoryRate: string;
    temperature: string;
    oxygenSaturation: string;
  };
  systems: {
    [systemName: string]: {
      normal: boolean;
      findings: string[];
      notes: string;
    };
  };
  generalAppearance: string;
}

interface MedicalState {
  currentPatient: Patient | null;
  currentAssessment: Assessment | null;
  currentStep: number;
  answers: Record<string, Answer>;
  rosData: ReviewOfSystems;
  pmhData: PastMedicalHistoryData | null;
  peData: PhysicalExamData | null;
}

type MedicalAction =
  | { type: 'SET_CURRENT_PATIENT'; payload: Patient }
  | { type: 'SET_CURRENT_ASSESSMENT'; payload: Assessment }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'ADD_ANSWER'; payload: { questionId: string; answer: Answer } }
  | { type: 'SET_ROS_DATA'; payload: ReviewOfSystems }
  | { type: 'SET_PMH_DATA'; payload: PastMedicalHistoryData }
  | { type: 'SET_PE_DATA'; payload: PhysicalExamData }
  | { type: 'RESET_ASSESSMENT' };

const initialState: MedicalState = {
  currentPatient: null,
  currentAssessment: null,
  currentStep: 1,
  answers: {},
  rosData: {},
  pmhData: null,
  peData: null
};

function medicalReducer(state: MedicalState, action: MedicalAction): MedicalState {
  switch (action.type) {
    case 'SET_CURRENT_PATIENT':
      return { ...state, currentPatient: action.payload };
    
    case 'SET_CURRENT_ASSESSMENT':
      return { ...state, currentAssessment: action.payload };
    
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    
    case 'ADD_ANSWER':
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.payload.questionId]: action.payload.answer
        }
      };
    
    case 'SET_ROS_DATA':
      return { ...state, rosData: action.payload };
    
    case 'SET_PMH_DATA':
      return { ...state, pmhData: action.payload };
    
    case 'SET_PE_DATA':
      return { ...state, peData: action.payload };
    
    case 'RESET_ASSESSMENT':
      return {
        ...initialState,
        currentPatient: state.currentPatient
      };
    
    default:
      return state;
  }
}

interface MedicalContextType {
  state: MedicalState;
  dispatch: React.Dispatch<MedicalAction>;
}

const MedicalContext = createContext<MedicalContextType | undefined>(undefined);

export function MedicalProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(medicalReducer, initialState);

  return (
    <MedicalContext.Provider value={{ state, dispatch }}>
      {children}
    </MedicalContext.Provider>
  );
}

export function useMedical() {
  const context = useContext(MedicalContext);
  if (context === undefined) {
    throw new Error('useMedical must be used within a MedicalProvider');
  }
  return context;
}
