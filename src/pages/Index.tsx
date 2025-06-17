
import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { NewPatientForm } from '@/components/NewPatientForm';
import { ChiefComplaintSelector } from '@/components/ChiefComplaintSelector';
import { AssessmentWorkflow } from '@/components/AssessmentWorkflow';
import { Patient, Assessment } from '@/types/medical';
import { useMedical } from '@/context/MedicalContext';

type AppState = 'dashboard' | 'new-patient' | 'chief-complaint' | 'assessment' | 'patients' | 'summary';

const Index = () => {
  const { state, dispatch } = useMedical();
  const [currentView, setCurrentView] = useState<AppState>('dashboard');
  const [selectedComplaint, setSelectedComplaint] = useState<string>('');

  const handleNewPatient = () => {
    setCurrentView('new-patient');
  };

  const handlePatientCreated = (patient: Patient) => {
    setCurrentView('chief-complaint');
  };

  const handleComplaintSelected = (complaint: string) => {
    setSelectedComplaint(complaint);
    
    // Create new assessment
    const assessment: Assessment = {
      id: `assessment_${Date.now()}`,
      patientId: state.currentPatient?.id || '',
      chiefComplaint: complaint,
      status: 'in-progress',
      currentStep: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    dispatch({ type: 'SET_CURRENT_ASSESSMENT', payload: assessment });
    setCurrentView('assessment');
  };

  const handleAssessmentComplete = () => {
    setCurrentView('summary');
  };

  const handleBackToDashboard = () => {
    dispatch({ type: 'RESET_ASSESSMENT' });
    setCurrentView('dashboard');
    setSelectedComplaint('');
  };

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
