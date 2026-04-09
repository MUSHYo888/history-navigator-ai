
// ABOUTME: AI-powered question generation service with retry logic
// ABOUTME: Handles intelligent question generation with UUID validation and fallback mechanisms

import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/medical';
import { FallbackDataService } from '../fallback/FallbackDataService';
import { withRetry } from '@/utils/withRetry';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function isValidUUID(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
}

export class QuestionGeneratorService {
  static async generateQuestions(
    chiefComplaint: string,
    previousAnswers?: Record<string, any>
  ): Promise<Question[]> {
    try {
      const result = await withRetry(async () => {
        
        const { data, error } = await supabase.functions.invoke('ai-assistant', {
          body: {
            action: 'generate-questions',
            chiefComplaint,
            previousAnswers
          }
        });

        if (error) throw new Error(`Supabase function error: ${error.message}`);
        if (!data?.questions) throw new Error('Invalid response - no questions returned');

        // Validate and fix question IDs
        const validatedQuestions = data.questions.map((question: any, index: number) => {
          if (!question.id || !isValidUUID(question.id)) {
            question.id = generateUUID();
          }
          if (!question.text) throw new Error(`Question ${index} missing text field`);
          if (!question.type) question.type = 'text';
          if (!question.category) question.category = 'general';
          if (typeof question.required !== 'boolean') question.required = true;
          return question;
        });

        return validatedQuestions;
      }, 3, 1000);

      return result;
    } catch (error) {
      console.error('Error generating AI questions, using fallback:', error);
      return FallbackDataService.getFallbackQuestions(chiefComplaint);
    }
  }
}
