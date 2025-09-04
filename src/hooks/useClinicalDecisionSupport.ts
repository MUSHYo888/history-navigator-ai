// ABOUTME: Hook for managing clinical decision support data persistence
// ABOUTME: Handles saving and retrieving investigation plans and treatment recommendations

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClinicalPlan {
  investigations: {
    selected: string[];
    rationale: string;
    estimatedCost: number;
  };
  treatment: {
    medications: string[];
    nonPharmacological: string[];
    followUp: string;
  };
  clinicalNotes: string;
}

export function useSaveClinicalDecisionSupport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assessmentId,
      clinicalPlan
    }: {
      assessmentId: string;
      clinicalPlan: ClinicalPlan;
    }) => {
      const { data, error } = await supabase
        .from('clinical_decision_support')
        .upsert({
          assessment_id: assessmentId,
          investigation_plan: clinicalPlan.investigations,
          treatment_plan: clinicalPlan.treatment,
          clinical_notes: clinicalPlan.clinicalNotes,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving clinical decision support:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast.success('Clinical plan saved successfully');
      queryClient.invalidateQueries({ queryKey: ['clinical-decision-support'] });
    },
    onError: (error: any) => {
      console.error('Failed to save clinical plan:', error);
      toast.error(`Failed to save clinical plan: ${error.message}`);
    }
  });
}

export function useGetClinicalDecisionSupport(assessmentId: string) {
  return useQueryClient().getQueryData(['clinical-decision-support', assessmentId]);
}