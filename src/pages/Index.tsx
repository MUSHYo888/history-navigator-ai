
// ABOUTME: Main application page handling workflow state and navigation with enhanced error recovery
// ABOUTME: Orchestrates patient creation, assessment workflow, and data persistence with localStorage session persistence

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { AdvancedAnalyticsDashboard } from '@/components/AdvancedAnalyticsDashboard';
import { NewPatientForm } from '@/components/NewPatientForm';
import { ChiefComplaintSelector } from '@/components/ChiefComplaintSelector';
import { AssessmentWorkflow } from '@/components/AssessmentWorkflow';
import { PatientList } from '@/components/PatientList';
import { AssessmentResume } from '@/components/AssessmentResume';
import { ClinicalSummary } from '@/components/ClinicalSummary';
import { PatientDetails } from '@/components/PatientDetails';
import { AssessmentErrorRecovery } from '@/components/AssessmentErrorRecovery';
import { AIServiceTest } from '@/components/AIServiceTest';
import { Patient, Assessment } from '@/types/medical';
import { useMedical } from '@/context/MedicalContext';
import { useCreateAssessment, useUpdateAssessmentStep, useAssessment } from '@/hooks/useAssessment';
import { useUpdatePatientAssessment } from '@/hooks/usePatients';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AppState = 'dashboard' | 'new-patient' | 'chief-complaint' | 'assessment' | 'patients' | 'patient-details' | 'summary' | 'view-summary' | 'resume-assessment' | 'error-recovery' | 'ai-testing' | 'analytics';

const SESSION_KEYS = {
  assessmentId: 'history-pro:active-assessment-id',
  patientId: 'history-pro:active-patient-id',
};

const Index = () => {
  const { state, dispatch } = useMedical();
  const [currentView, setCurrentView] = useState<AppState>('dashboard');
  const [selectedComplaint, setSelectedComplaint] = useState<string>('');
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  
  const createAssessmentMutation = useCreateAssessment();
  const updatePatientMutation = useUpdatePatientAssessment();

  // Check for active session on mount
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const savedAssessmentId = localStorage.getItem(SESSION_KEYS.assessmentId);
        if (!savedAssessmentId) {
          setSessionChecked(true);
          return;
        }

        const { data: assessment, error } = await supabase
          .from('assessments')
          .select('*, patients!inner(*)')
          .eq('id', savedAssessmentId)
          .eq('status', 'in-progress')
          .single();

        if (error || !assessment) {
          // Clear stale session
          localStorage.removeItem(SESSION_KEYS.assessmentId);
          localStorage.removeItem(SESSION_KEYS.patientId);
          setSessionChecked(true);
          return;
        }

        // Restore session
        dispatch({
          type: 'SET_CURRENT_PATIENT',
          payload: {
            id: assessment.patients.id,
            name: assessment.patients.name,
            age: assessment.patients.age,
            gender: assessment.patients.gender as 'male' | 'female' | 'other',
            patientId: assessment.patients.patient_id,
            location: assessment.patients.location,
            createdAt: assessment.patients.created_at,
          },
        });

        dispatch({
          type: 'SET_CURRENT_ASSESSMENT',
          payload: {
            id: assessment.id,
            patientId: assessment.patient_id,
            chiefComplaint: assessment.chief_complaint,
            status: assessment.status as 'in-progress' | 'completed' | 'draft',
            currentStep: assessment.current_step,
            createdAt: assessment.created_at,
            updatedAt: assessment.updated_at,
          },
        });

        setSelectedComplaint(assessment.chief_complaint);
        setCurrentView('assessment');
        toast.info('Resumed your in-progress assessment');
      } catch (err) {
        console.error('Failed to restore session:', err);
        localStorage.removeItem(SESSION_KEYS.assessmentId);
        localStorage.removeItem(SESSION_KEYS.patientId);
      } finally {
        setSessionChecked(true);
      }
    };

    checkActiveSession();
  }, []);

  const handleError = (error: string, context?: string) => {
    console.error(`Global error in ${context || 'unknown context'}:`, error);
    setGlobalError(error);
    setCurrentView('error-recovery');
    toast.error(`Error: ${error}`);
  };

  const handleErrorRecovery = () => {
    setGlobalError(null);
    setCurrentView('dashboard');
  };

  const handleNewPatient = () => {
    try {
      setCurrentView('new-patient');
    } catch (error) {
      handleError(error.message, 'navigation to new patient');
    }
  };

  const handlePatientCreated = (patient: Patient) => {
    try {
      dispatch({ type: 'SET_CURRENT_PATIENT', payload: patient });
      localStorage.setItem(SESSION_KEYS.patientId, patient.id);
      setCurrentView('chief-complaint');
    } catch (error) {
      handleError(error.message, 'patient creation');
    }
  };

  const handleComplaintSelected = async (complaint: string) => {
    try {
      setSelectedComplaint(complaint);
      
      if (!state.currentPatient) {
        throw new Error('No current patient set - please restart assessment');
      }


      const assessment = await createAssessmentMutation.mutateAsync({
        patientId: state.currentPatient.id,
        chiefComplaint: complaint
      });
      
      
      await updatePatientMutation.mutateAsync(state.currentPatient.id);
      
      dispatch({ type: 'SET_CURRENT_ASSESSMENT', payload: assessment });

      // Persist active session
      localStorage.setItem(SESSION_KEYS.assessmentId, assessment.id);
      localStorage.setItem(SESSION_KEYS.patientId, state.currentPatient.id);

      setCurrentView('assessment');
      toast.success('Assessment started successfully');
    } catch (error) {
      console.error('Failed to create assessment:', error);
      handleError(error.message || 'Failed to create assessment', 'complaint selection');
    }
  };

  const handleAssessmentComplete = () => {
    try {
      // Clear active session
      localStorage.removeItem(SESSION_KEYS.assessmentId);
      localStorage.removeItem(SESSION_KEYS.patientId);
      setCurrentView('summary');
      toast.success('Assessment completed!');
    } catch (error) {
      handleError(error.message, 'assessment completion');
    }
  };

  const handleBackToDashboard = () => {
    try {
      dispatch({ type: 'RESET_ASSESSMENT' });
      localStorage.removeItem(SESSION_KEYS.assessmentId);
      localStorage.removeItem(SESSION_KEYS.patientId);
      setCurrentView('dashboard');
      setSelectedComplaint('');
      setGlobalError(null);
    } catch (error) {
      handleError(error.message, 'navigation to dashboard');
    }
  };

  const handleResumeAssessment = async (assessmentId: string) => {
    try {
      
      const { data: assessment, error } = await supabase
        .from('assessments')
        .select(`*, patients!inner(*)`)
        .eq('id', assessmentId)
        .single();

      if (error) throw error;
      if (!assessment) throw new Error('Assessment not found');

      dispatch({ 
        type: 'SET_CURRENT_PATIENT', 
        payload: {
          id: assessment.patients.id,
          name: assessment.patients.name,
          age: assessment.patients.age,
          gender: assessment.patients.gender as 'male' | 'female' | 'other',
          patientId: assessment.patients.patient_id,
          location: assessment.patients.location,
          createdAt: assessment.patients.created_at
        }
      });

      dispatch({
        type: 'SET_CURRENT_ASSESSMENT',
        payload: {
          id: assessment.id,
          patientId: assessment.patient_id,
          chiefComplaint: assessment.chief_complaint,
          status: assessment.status as 'in-progress' | 'completed' | 'draft',
          currentStep: assessment.current_step,
          createdAt: assessment.created_at,
          updatedAt: assessment.updated_at
        }
      });

      // Persist active session
      localStorage.setItem(SESSION_KEYS.assessmentId, assessment.id);
      localStorage.setItem(SESSION_KEYS.patientId, assessment.patients.id);

      setSelectedComplaint(assessment.chief_complaint);
      setCurrentView('assessment');
      
      toast.success('Assessment resumed successfully');
    } catch (error) {
      console.error('Failed to resume assessment:', error);
      handleError(error.message || 'Failed to resume assessment', 'assessment resume');
    }
  };

  const handleViewCompletedAssessment = async (assessmentId: string, chiefComplaint: string) => {
    try {
      const { data: assessment, error } = await supabase
        .from('assessments')
        .select(`*, patients!inner(*)`)
        .eq('id', assessmentId)
        .single();

      if (error) throw error;
      if (!assessment) throw new Error('Assessment not found');

      dispatch({ 
        type: 'SET_CURRENT_PATIENT', 
        payload: {
          id: assessment.patients.id,
          name: assessment.patients.name,
          age: assessment.patients.age,
          gender: assessment.patients.gender as 'male' | 'female' | 'other',
          patientId: assessment.patients.patient_id,
          location: assessment.patients.location,
          createdAt: assessment.patients.created_at
        }
      });

      dispatch({
        type: 'SET_CURRENT_ASSESSMENT',
        payload: {
          id: assessment.id,
          patientId: assessment.patient_id,
          chiefComplaint: assessment.chief_complaint,
          status: assessment.status as 'in-progress' | 'completed' | 'draft',
          currentStep: assessment.current_step,
          createdAt: assessment.created_at,
          updatedAt: assessment.updated_at
        }
      });

      setSelectedComplaint(chiefComplaint);
      setCurrentView('view-summary');
    } catch (error) {
      console.error('Failed to load completed assessment:', error);
      toast.error('Failed to load assessment summary');
    }
  };

  if (!sessionChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (currentView === 'error-recovery') {
    return (
      <AssessmentErrorRecovery
        error={globalError || 'Unknown error occurred'}
        onRetry={() => {
          setGlobalError(null);
          if (state.currentAssessment) {
            setCurrentView('assessment');
          } else if (state.currentPatient) {
            setCurrentView('chief-complaint');
          } else {
            setCurrentView('dashboard');
          }
        }}
        onRestart={() => {
          dispatch({ type: 'RESET_ASSESSMENT' });
          setGlobalError(null);
          setCurrentView('new-patient');
        }}
        onReturnHome={handleBackToDashboard}
        assessmentId={state.currentAssessment?.id}
        patientId={state.currentPatient?.id}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="min-h-[calc(100vh-80px)]">
        {currentView === 'dashboard' && (
          <Dashboard 
            onNewPatient={handleNewPatient}
            onViewPatients={() => setCurrentView('patients')}
            onSelectPatient={(patient) => {
              dispatch({ type: 'SET_CURRENT_PATIENT', payload: patient });
              setCurrentView('patient-details');
            }}
            onTestAI={() => setCurrentView('ai-testing')}
            onViewAnalytics={() => setCurrentView('analytics')}
          />
        )}

        {currentView === 'patients' && (
          <PatientList
            onNewPatient={handleNewPatient}
            onSelectPatient={(patient) => {
              dispatch({ type: 'SET_CURRENT_PATIENT', payload: patient });
              setCurrentView('patient-details');
            }}
            onBack={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'patient-details' && state.currentPatient && (
          <PatientDetails
            patient={state.currentPatient}
            onBack={() => setCurrentView('dashboard')}
            onStartAssessment={() => setCurrentView('chief-complaint')}
            onResumeAssessment={handleResumeAssessment}
          />
        )}
        
        {currentView === 'new-patient' && (
          <NewPatientForm
            onSubmit={handlePatientCreated}
            onCancel={() => setCurrentView('dashboard')}
          />
        )}
        
        {currentView === 'chief-complaint' && (
          <ChiefComplaintSelector
            onSelect={handleComplaintSelected}
            onBack={() => setCurrentView('new-patient')}
          />
        )}
        
        {currentView === 'assessment' && (
          <AssessmentWorkflow
            chiefComplaint={selectedComplaint}
            onComplete={handleAssessmentComplete}
            onBack={() => setCurrentView('chief-complaint')}
          />
        )}
        
        {currentView === 'resume-assessment' && (
          <AssessmentResume
            onResumeAssessment={handleResumeAssessment}
            onNewAssessment={handleNewPatient}
          />
        )}

        {currentView === 'ai-testing' && (
          <div className="p-6">
            <div className="mb-4">
              <Button
                variant="outline"
                onClick={() => setCurrentView('dashboard')}
              >
                ← Back to Dashboard
              </Button>
            </div>
            <AIServiceTest />
          </div>
        )}

        {currentView === 'analytics' && (
          <div>
            <div className="p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <Button
                variant="outline"
                onClick={() => setCurrentView('dashboard')}
                className="mb-4"
              >
                ← Back to Dashboard
              </Button>
            </div>
            <AdvancedAnalyticsDashboard />
          </div>
        )}

        {currentView === 'summary' && (
          <div className="p-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Assessment Complete! 
              </h2>
              <p className="text-gray-600 mb-8">
                Clinical summary and differential diagnosis have been generated.
              </p>
              <button 
                onClick={handleBackToDashboard}
                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
