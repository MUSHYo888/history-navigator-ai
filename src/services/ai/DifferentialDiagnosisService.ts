
// ABOUTME: AI-powered differential diagnosis generation service
// ABOUTME: Analyzes symptoms and generates ranked differential diagnoses with retry logic

import { supabase } from '@/integrations/supabase/client';
import { FallbackDataService } from '../fallback/FallbackDataService';
import { withRetry } from '@/utils/withRetry';

export interface ClinicalInput {
  chiefComplaint: string;
  symptoms: string[];
  patientHistory: string;
}

export interface DifferentialDiagnosis {
  diagnosis: string;
  confidence: number;
  reasoning: string;
  clinicalPearls?: string[];
}

export class DifferentialDiagnosisService {
  static async generateDifferentialDiagnosis(
    input: ClinicalInput
  ): Promise<DifferentialDiagnosis[]> {
    try {
      const result = await withRetry(async () => {
        
        const { data, error } = await supabase.functions.invoke('differential-diagnosis', {
          body: input
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        if (!data?.differentialDiagnoses && !data?.differentials) throw new Error('Invalid response from AI service');

        return data.differentialDiagnoses || data.differentials || [];
      }, 3, 1000);

      return result;
    } catch (error) {
      console.error('All retry attempts exhausted, using fallback differentials:', error);
      const fallbacks = FallbackDataService.getFallbackDifferentials(input.chiefComplaint);
      return fallbacks.map(f => ({
        diagnosis: f.condition,
        confidence: f.probability,
        reasoning: f.explanation,
        clinicalPearls: f.keyFeatures
      }));
    }
  }
}
