// ABOUTME: Hook for retrieving clinical decision support data from database
// ABOUTME: Fetches investigation plans and treatment recommendations for display in patient summary

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useGetClinicalDecisionSupport(assessmentId: string) {
  return useQuery({
    queryKey: ['clinical-decision-support', assessmentId],
    queryFn: async () => {
      if (!assessmentId) return null;
      
      const { data, error } = await supabase
        .from('clinical_decision_support')
        .select('*')
        .eq('assessment_id', assessmentId)
        .single();

      if (error) {
        // If no clinical decision support data exists yet, return null (not an error)
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    },
    enabled: !!assessmentId,
  });
}