import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PatientDetails } from '@/components/PatientDetails';
import { Patient } from '@/types/medical';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ClinicalUtils } from '@/utils/clinicalUtils';

export default function PatientView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPatientData() {
      if (!id) return;
      
      // Validate UUID format before querying Supabase
      if (!ClinicalUtils.isValidUUID(id)) {
        console.error("Invalid UUID format for patient ID:", id);
        toast.error("Invalid patient ID format.");
        setLoading(false);
        return;
      }

      try {
        // Fetch patient
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) {
          console.error("Supabase Error Message:", error.message);
          console.error("Supabase Error Details:", error.details);
          throw error;
        }

        const patientRecord = data;

        if (patientRecord) {
          setPatientData({
            id: patientRecord.id,
            name: patientRecord.name,
            age: patientRecord.age,
            gender: patientRecord.gender as 'male' | 'female' | 'other',
            patientId: patientRecord.patient_id,
            location: patientRecord.location || '',
            createdAt: patientRecord.created_at,
            lastAssessment: undefined
          });
        }
      } catch (error: unknown) {
        console.error("Error fetching patient:", error);
        toast.error("Failed to load patient data.");
      } finally {
        setLoading(false);
      }
    }

    fetchPatientData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <span className="text-muted-foreground">Loading patient details...</span>
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50">
        <h2 className="text-xl font-semibold mb-2">Patient Not Found</h2>
        <p className="text-muted-foreground mb-4">The patient record you are looking for does not exist.</p>
        <button onClick={() => navigate('/')} className="text-primary hover:underline font-medium">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <PatientDetails 
      patient={patientData}
      onBack={() => navigate('/')}
      onStartAssessment={() => navigate('/intake')}
      onResumeAssessment={(assessmentId) => navigate(`/intake?resume=${assessmentId}`)}
      onViewCompletedAssessment={(assessmentId) => {
        if (!assessmentId) {
          toast.error("Cannot load summary: missing assessment ID");
          return;
        }
        navigate(`/patient/${id}/assessment/${assessmentId}/summary`);
      }}
      onDeletePatient={() => navigate('/')}
    />
  );
}