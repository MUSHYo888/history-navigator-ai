
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Patient, Assessment, Answer, ReviewOfSystems } from '@/types/medical';

interface MedicalState {
  currentPatient: Patient | null;
  currentAssessment: Assessment | null;
  patients: Patient[];
  answers: Record<string, Answer>;
  reviewOfSystems: ReviewOfSystems;
  currentStep: number;
}

type MedicalAction =
  | { type: 'SET_CURRENT_PATIENT'; payload: Patient }
  | { type: 'SET_CURRENT_ASSESSMENT'; payload: Assessment }
  | { type: 'ADD_PATIENT'; payload: Patient }
  | { type: 'UPDATE_PATIENTS'; payload: Patient[] }
  | { type: 'ADD_ANSWER'; payload: { questionId: string; answer: Answer } }
  | { type: 'UPDATE_ROS'; payload: { system: string; data: any } }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'RESET_ASSESSMENT' };

const initialState: MedicalState = {
  currentPatient: null,
  currentAssessment: null,
  patients: [],
  answers: {},
  reviewOfSystems: {},
  currentStep: 1,
};

function medicalReducer(state: MedicalState, action: MedicalAction): MedicalState {
  switch (action.type) {
    case 'SET_CURRENT_PATIENT':
      return { ...state, currentPatient: action.payload };
    case 'SET_CURRENT_ASSESSMENT':
      return { ...state, currentAssessment: action.payload };
    case 'ADD_PATIENT':
      return { ...state, patients: [...state.patients, action.payload] };
    case 'UPDATE_PATIENTS':
      return { ...state, patients: action.payload };
    case 'ADD_ANSWER':
      return {
        ...state,
        answers: { ...state.answers, [action.payload.questionId]: action.payload.answer }
      };
    case 'UPDATE_ROS':
      return {
        ...state,
        reviewOfSystems: { ...state.reviewOfSystems, [action.payload.system]: action.payload.data }
      };
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'RESET_ASSESSMENT':
      return { ...state, currentAssessment: null, answers: {}, reviewOfSystems: {}, currentStep: 1 };
    default:
      return state;
  }
}

const MedicalContext = createContext<{
  state: MedicalState;
  dispatch: React.Dispatch<MedicalAction>;
} | null>(null);

export function MedicalProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(medicalReducer, initialState);

  // Persist state to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('historyProState');
    if (saved) {
      try {
        const parsedState = JSON.parse(saved);
        if (parsedState.currentPatient) {
          dispatch({ type: 'SET_CURRENT_PATIENT', payload: parsedState.currentPatient });
        }
        if (parsedState.currentAssessment) {
          dispatch({ type: 'SET_CURRENT_ASSESSMENT', payload: parsedState.currentAssessment });
        }
        if (parsedState.patients) {
          dispatch({ type: 'UPDATE_PATIENTS', payload: parsedState.patients });
        }
      } catch (error) {
        console.error('Failed to load saved state:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('historyProState', JSON.stringify({
      currentPatient: state.currentPatient,
      currentAssessment: state.currentAssessment,
      patients: state.patients,
    }));
  }, [state.currentPatient, state.currentAssessment, state.patients]);

  return (
    <MedicalContext.Provider value={{ state, dispatch }}>
      {children}
    </MedicalContext.Provider>
  );
}

export function useMedical() {
  const context = useContext(MedicalContext);
  if (!context) {
    throw new Error('useMedical must be used within a MedicalProvider');
  }
  return context;
}
