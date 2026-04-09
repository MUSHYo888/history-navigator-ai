
// ABOUTME: AI-powered clinical decision support service
// ABOUTME: Generates investigation recommendations, red flags, and clinical guidelines with retry logic

import { supabase } from '@/integrations/supabase/client';
import { FallbackDataService } from '../fallback/FallbackDataService';
import { withRetry } from '@/utils/withRetry';

export class ClinicalSupportService {
  static async generateClinicalDecisionSupport(
    chiefComplaint: string,
    differentialDiagnoses: any[],
    answers: Record<string, any>,
    rosData?: Record<string, any>
  ): Promise<any> {
    try {
      const result = await withRetry(async () => {
        
        const { data, error } = await supabase.functions.invoke('ai-assistant', {
          body: {
            action: 'generate-clinical-support',
            chiefComplaint,
            differentialDiagnoses,
            answers,
            rosData
          }
        });

        if (error) throw error;
        if (!data?.clinicalSupport) throw new Error('Invalid response from AI service');

        return data.clinicalSupport;
      }, 3, 1000);

      return result;
    } catch (error) {
      console.error('All retry attempts exhausted, using fallback clinical protocols:', error);
      return {
        investigations: FallbackDataService.getFallbackInvestigations(chiefComplaint),
        redFlags: FallbackDataService.getFallbackRedFlags(chiefComplaint),
        guidelines: FallbackDataService.getFallbackGuidelines(chiefComplaint),
        treatmentRecommendations: [],
        followUpRecommendations: [],
        _fallbackMode: true,
        _lastError: error?.message || 'AI service unavailable'
      };
    }
  }
}
