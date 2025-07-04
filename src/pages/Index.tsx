
// ABOUTME: Main application page handling workflow state and navigation with enhanced error recovery
// ABOUTME: Orchestrates patient creation, assessment workflow, and data persistence with comprehensive error handling

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { NewPatientForm } from '@/components/NewPatientForm';
import { ChiefComplaintSelector } from '@/components/ChiefComplaintSelector';
import { AssessmentWorkflow } from '@/components/AssessmentWorkflow';
import { PatientList } from '@/components/PatientList';
import { AssessmentResume } from '@/components/AssessmentResume';
import { AssessmentErrorRecovery } from '@/components/AssessmentErrorRecovery';
import { Patient, Assessment } from '@/types/medical';
import { useMedical } from '@/context/MedicalContext';
import { useCreateAssessment, useUpdateAssessmentStep, useAssessment } from '@/hooks/useAssessment';
import { useUpdatePatientAssessment } from '@/hooks/usePatients';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AppState = 'dashboard' | 'new-patient' | 'chief-complaint' | 'assessment' | 'patients' | 'summary' | 'resume-assessment' | 'error-recovery';

const Index = () => {
  const { state, dispatch } = useMedical();
  const [currentView, setCurrentView] = useState<AppState>('dashboard');
  const [selectedComplaint, setSelectedComplaint] = useState<string>('');
  const [globalError, setGlobalError] = useState<string | null>(null);
  
  const createAssessmentMutation = useCreateAssessment();
  const updatePatientMutation = useUpdatePatientAssessment();

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
      console.log('Patient created:', patient);
      dispatch({ type: 'SET_CURRENT_PATIENT', payload: patient });
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

      console.log('Creating assessment for patient:', state.currentPatient.id, 'with complaint:', complaint);

      // Create new assessment in database
      const assessment = await createAssessmentMutation.mutateAsync({
        patientId: state.currentPatient.id,
        chiefComplaint: complaint
      });
      
      console.log('Assessment created:', assessment);
      
      // Update patient's last assessment timestamp
      await updatePatientMutation.mutateAsync(state.currentPatient.id);
      
      // Set assessment in context
      dispatch({ type: 'SET_CURRENT_ASSESSMENT', payload: assessment });
      setCurrentView('assessment');
      
      toast.success('Assessment started successfully');
    } catch (error) {
      console.error('Failed to create assessment:', error);
      handleError(error.message || 'Failed to create assessment', 'complaint selection');
    }
  };

  const handleAssessmentComplete = () => {
    try {
      console.log('Assessment completed successfully');
      setCurrentView('summary');
      toast.success('Assessment completed!');
    } catch (error) {
      handleError(error.message, 'assessment completion');
    }
  };

  const handleBackToDashboard = () => {
    try {
      dispatch({ type: 'RESET_ASSESSMENT' });
      setCurrentView('dashboard');
      setSelectedComplaint('');
      setGlobalError(null);
    } catch (error) {
      handleError(error.message, 'navigation to dashboard');
    }
  };

  const handleResumeAssessment = async (assessmentId: string) => {
    try {
      console.log('Resuming assessment:', assessmentId);
      
      // Load the assessment details
      const { data: assessment, error } = await supabase
        .from('assessments')
        .select(`
          *,
          patients!inner(*)
        `)
        .eq('id', assessmentId)
        .single();

      if (error) throw error;

      // Set up the context
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

      setSelectedComplaint(assessment.chief_complaint);
      setCurrentView('assessment');
      
      toast.success('Assessment resumed successfully');
    } catch (error) {
      console.error('Failed to resume assessment:', error);
      handleError(error.message || 'Failed to resume assessment', 'assessment resume');
    }
  };

  if (currentView === 'error-recovery') {
    return (
      <AssessmentErrorRecovery
        error={globalError || 'Unknown error occurred'}
        onRetry={() => {
          setGlobalError(null);
          // Try to return to the previous state
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
          />
        )}

        {currentView === 'patients' && (
          <PatientList
            onNewPatient={handleNewPatient}
            onSelectPatient={(patient) => {
              dispatch({ type: 'SET_CURRENT_PATIENT', payload: patient });
              setCurrentView('chief-complaint');
            }}
            onBack={() => setCurrentView('dashboard')}
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
