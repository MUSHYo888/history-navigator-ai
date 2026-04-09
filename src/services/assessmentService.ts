// ABOUTME: Service for assessment workflow operations with Supabase
// ABOUTME: Manages assessment lifecycle, questions, answers, and ROS data
import { supabase } from '@/integrations/supabase/client';
import { Assessment, Question, Answer, ReviewOfSystems } from '@/types/medical';

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export class AssessmentService {
  static async createAssessment(patientId: string, chiefComplaint: string): Promise<Assessment> {
    const { data, error } = await supabase
      .from('assessments')
      .insert({
        patient_id: patientId,
        chief_complaint: chiefComplaint,
        status: 'in-progress',
        current_step: 1
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating assessment:', error);
      throw new Error('Failed to create assessment');
    }

    return {
      id: data.id,
      patientId: data.patient_id,
      chiefComplaint: data.chief_complaint,
      status: data.status as 'in-progress' | 'completed' | 'draft',
      currentStep: data.current_step,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  static async updateAssessmentStep(assessmentId: string, step: number): Promise<void> {
    const { error } = await supabase
      .from('assessments')
      .update({ current_step: step })
      .eq('id', assessmentId);

    if (error) {
      console.error('Error updating assessment step:', error);
      throw new Error('Failed to update assessment step');
    }
  }

  static async completeAssessment(assessmentId: string): Promise<void> {
    const { error } = await supabase
      .from('assessments')
      .update({ status: 'completed' })
      .eq('id', assessmentId);

    if (error) {
      console.error('Error completing assessment:', error);
      throw new Error('Failed to complete assessment');
    }
  }

  static async saveQuestions(assessmentId: string, questions: Question[]): Promise<void> {
    
    if (!isValidUUID(assessmentId)) {
      throw new Error(`Invalid assessment ID format: ${assessmentId}`);
    }

    const questionsData = questions.map((q, index) => {
      if (!isValidUUID(q.id)) {
        throw new Error(`Invalid question ID format: ${q.id}`);
      }
      
      return {
        id: q.id, // Use the question's UUID as the database ID
        assessment_id: assessmentId,
        question_text: q.text,
        question_type: q.type,
        options: q.options || null,
        category: q.category,
        required: q.required,
        order_index: index
      };
    });

    const { error } = await supabase
      .from('questions')
      .insert(questionsData);

    if (error) {
      console.error('Error saving questions:', error);
      throw new Error(`Failed to save questions: ${error.message}`);
    }
    
  }

  static async saveAnswer(assessmentId: string, questionId: string, answer: Answer): Promise<void> {
    
    // Validate UUIDs
    if (!isValidUUID(assessmentId)) {
      throw new Error(`Invalid assessment ID format: ${assessmentId}`);
    }
    
    if (!isValidUUID(questionId)) {
      throw new Error(`Invalid question ID format: ${questionId}`);
    }

    // Validate answer data
    if (!answer || typeof answer.value === 'undefined') {
      throw new Error('Answer value is required');
    }

      assessment_id: assessmentId,
      question_id: questionId,
      answer_value: answer.value,
      notes: answer.notes
    });

    const { error } = await supabase
      .from('answers')
      .upsert({
        assessment_id: assessmentId,
        question_id: questionId,
        answer_value: answer.value,
        notes: answer.notes
      });

    if (error) {
      console.error('Error saving answer:', error);
      throw new Error(`Failed to save answer: ${error.message}`);
    }
    
  }

  static async saveReviewOfSystems(assessmentId: string, systemName: string, rosData: { positive: string[]; negative: string[]; notes?: string }): Promise<void> {
    const { error } = await supabase
      .from('review_of_systems')
      .upsert({
        assessment_id: assessmentId,
        system_name: systemName,
        positive_symptoms: rosData.positive,
        negative_symptoms: rosData.negative,
        notes: rosData.notes
      });

    if (error) {
      console.error('Error saving ROS data:', error);
      throw new Error('Failed to save review of systems');
    }
  }

  static async getAssessmentQuestions(assessmentId: string): Promise<Question[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('order_index');

    if (error) {
      console.error('Error fetching questions:', error);
      throw new Error('Failed to fetch questions');
    }

    return data.map(q => ({
      id: q.id,
      text: q.question_text,
      type: q.question_type as 'multiple-choice' | 'yes-no' | 'text' | 'scale',
      options: q.options as string[] | undefined,
      category: q.category,
      required: q.required
    }));
  }

  static async getAssessmentAnswers(assessmentId: string): Promise<Record<string, Answer>> {
    const { data, error } = await supabase
      .from('answers')
      .select('*')
      .eq('assessment_id', assessmentId);

    if (error) {
      console.error('Error fetching answers:', error);
      throw new Error('Failed to fetch answers');
    }

    const answers: Record<string, Answer> = {};
    data.forEach(answer => {
      // Safely convert Json type to Answer value
      let answerValue: string | number | boolean;
      
      if (typeof answer.answer_value === 'string' || 
          typeof answer.answer_value === 'number' || 
          typeof answer.answer_value === 'boolean') {
        answerValue = answer.answer_value;
      } else {
        // Fallback for complex Json values - convert to string
        answerValue = JSON.stringify(answer.answer_value);
      }

      answers[answer.question_id] = {
        questionId: answer.question_id,
        value: answerValue,
        notes: answer.notes || undefined
      };
    });

    return answers;
  }

  static async getAssessment(assessmentId: string): Promise<Assessment | null> {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', assessmentId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching assessment:', error);
      throw new Error('Failed to fetch assessment');
    }

    if (!data) return null;

    return {
      id: data.id,
      patientId: data.patient_id,
      chiefComplaint: data.chief_complaint,
      status: data.status as 'in-progress' | 'completed' | 'draft',
      currentStep: data.current_step,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}
