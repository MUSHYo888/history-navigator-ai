
// ABOUTME: AI-powered clinical decision support service
// ABOUTME: Generates investigation recommendations, red flags, and clinical guidelines

import { supabase } from '@/integrations/supabase/client';
import { FallbackDataService } from '../fallback/FallbackDataService';

export class ClinicalSupportService {
  static async generateClinicalDecisionSupport(
    chiefComplaint: string,
    differentialDiagnoses: any[],
    answers: Record<string, any>,
    rosData?: Record<string, any>
  ): Promise<any> {
    try {
      console.log(`ClinicalSupportService: Generating clinical decision support for: ${chiefComplaint}`);
      
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          action: 'generate-clinical-support',
          chiefComplaint,
          differentialDiagnoses,
          answers,
          rosData
        }
      });

      if (error) {
        console.warn(`AI service error (using fallback): ${error.message}`);
        throw error; // Will be caught by outer try-catch
      }

      if (!data?.clinicalSupport) {
        console.warn('No clinical support data received, using fallback');
        throw new Error('Invalid response from AI service');
      }

      console.log(`ClinicalSupportService: AI generated clinical decision support`);
      return data.clinicalSupport;

    } catch (error) {
      console.warn('AI service unavailable, using evidence-based protocols:', error);
      console.log('ClinicalSupportService: Using fallback clinical protocols');
      
      return {
        investigations: FallbackDataService.getFallbackInvestigations(chiefComplaint),
        redFlags: FallbackDataService.getFallbackRedFlags(chiefComplaint),
        guidelines: FallbackDataService.getFallbackGuidelines(chiefComplaint),
        treatmentRecommendations: [],
        followUpRecommendations: []
      };
    }
  }
}
