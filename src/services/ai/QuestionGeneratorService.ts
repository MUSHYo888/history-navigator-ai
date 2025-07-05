
// ABOUTME: AI-powered question generation service with enhanced error handling
// ABOUTME: Handles intelligent question generation with UUID validation and fallback mechanisms

import { supabase } from '@/integrations/supabase/client';
import { Question } from '@/types/medical';
import { FallbackDataService } from '../fallback/FallbackDataService';

// Helper function to generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export class QuestionGeneratorService {
  static async generateQuestions(
    chiefComplaint: string,
    previousAnswers?: Record<string, any>
  ): Promise<Question[]> {
    try {
      console.log(`QuestionGeneratorService: Generating questions for: "${chiefComplaint}"`);
      
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          action: 'generate-questions',
          chiefComplaint,
          previousAnswers
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Supabase function error: ${error.message}`);
      }

      if (!data?.questions) {
        console.error('Invalid response from AI service:', data);
        throw new Error('Invalid response from AI service - no questions returned');
      }

      // Validate and fix question IDs
      const validatedQuestions = data.questions.map((question: any, index: number) => {
        if (!question.id || !isValidUUID(question.id)) {
          const newId = generateUUID();
          console.warn(`Question ${index} has invalid ID "${question.id}", generating new UUID: ${newId}`);
          question.id = newId;
        }
        
        // Ensure required fields are present
        if (!question.text) {
          throw new Error(`Question ${index} missing required text field`);
        }
        if (!question.type) {
          question.type = 'text'; // Default type
        }
        if (!question.category) {
          question.category = 'general'; // Default category
        }
        if (typeof question.required !== 'boolean') {
          question.required = true; // Default to required
        }
        
        return question;
      });

      console.log(`QuestionGeneratorService: Successfully generated ${validatedQuestions.length} AI questions`);
      console.log('Question IDs:', validatedQuestions.map(q => q.id));
      
      return validatedQuestions;

    } catch (error) {
      console.error('Error generating AI questions:', error);
      console.log('QuestionGeneratorService: Falling back to predefined questions');
      
      // Use fallback questions with proper UUIDs
      const fallbackQuestions = FallbackDataService.getFallbackQuestions(chiefComplaint);
      console.log(`QuestionGeneratorService: Using ${fallbackQuestions.length} fallback questions`);
      
      return fallbackQuestions;
    }
  }
}
