// ABOUTME: Phase 2 adaptive question generator using AI and clinical analysis
// ABOUTME: Generates targeted follow-up questions based on Phase 1 answers and identified concerns

import { Question, Answer } from '@/types/medical';
import { AnswerAnalysisService, AnswerAnalysis } from './AnswerAnalysisService';
import { supabase } from '@/integrations/supabase/client';

export class AdaptiveQuestionGeneratorService {
  
  static async generatePhase2Questions(
    chiefComplaint: string,
    phase1Answers: Record<string, Answer>,
    answerAnalysis: AnswerAnalysis
  ): Promise<Question[]> {
    
    try {
      // First, try AI-powered generation
      const aiQuestions = await this.generateAIQuestions(chiefComplaint, phase1Answers, answerAnalysis);
      if (aiQuestions.length > 0) {
        return aiQuestions;
      }
    } catch (error) {
    }
    
    // Fallback to rule-based generation
    return this.generateRuleBasedQuestions(chiefComplaint, phase1Answers, answerAnalysis);
  }

  private static async generateAIQuestions(
    chiefComplaint: string,
    phase1Answers: Record<string, Answer>,
    answerAnalysis: AnswerAnalysis
  ): Promise<Question[]> {
    
    const answersText = Object.values(phase1Answers)
      .map(a => `Q: ${a.questionId} A: ${a.value} ${a.notes || ''}`)
      .join('\n');

    const redFlagsText = answerAnalysis.redFlags
      .map(f => `- ${f.condition}: ${f.description}`)
      .join('\n');

    const triggersText = answerAnalysis.phase2Triggers
      .map(t => `${t.category}: ${t.reason}`)
      .join('\n');

    const { data, error } = await supabase.functions.invoke('ai-assistant', {
      body: {
        action: 'generate-adaptive-questions',
        chiefComplaint,
        phase1Answers: answersText,
        redFlags: redFlagsText,
        triggers: triggersText,
        riskLevel: answerAnalysis.riskLevel,
        maxQuestions: 5
      }
    });

    if (error) {
      throw new Error(`AI service error: ${error.message}`);
    }

    if (!data?.questions) {
      throw new Error('No questions returned from AI service');
    }

    return data.questions.map((q: any, index: number) => ({
      id: this.generateUUID(),
      text: q.text,
      type: q.type || 'multiple-choice-with-text',
      options: q.options || this.getDefaultOptions(q.category),
      category: q.category || 'follow_up',
      required: q.required !== false,
      phase: 2,
      clinicalPriority: q.priority || this.calculatePriority(q.category, answerAnalysis),
      redFlagIndicator: q.redFlag || false,
      questionRationale: q.rationale || `AI-generated follow-up question based on Phase 1 analysis`,
      followUpTrigger: q.trigger || `Generated from ${answerAnalysis.riskLevel} risk assessment`
    }));
  }

  private static generateRuleBasedQuestions(
    chiefComplaint: string,
    phase1Answers: Record<string, Answer>,
    answerAnalysis: AnswerAnalysis
  ): Question[] {
    
    const questions: Question[] = [];
    
    // High-priority questions based on red flags
    if (answerAnalysis.riskLevel === 'critical' || answerAnalysis.riskLevel === 'high') {
      questions.push({
        id: this.generateUUID(),
        text: 'Are you experiencing any of these serious symptoms right now?',
        type: 'multiple-choice-with-text',
        options: [
          'Severe chest pain', 'Difficulty breathing', 'Loss of consciousness',
          'Severe bleeding', 'Signs of stroke', 'Severe allergic reaction', 'None of these'
        ],
        category: 'emergency_screening',
        required: true,
        phase: 2,
        clinicalPriority: 1,
        redFlagIndicator: true,
        questionRationale: 'Emergency symptom screening based on high risk assessment',
        followUpTrigger: `High risk level: ${answerAnalysis.riskLevel}`
      });
    }

    // Questions based on specific triggers
    answerAnalysis.phase2Triggers.forEach(trigger => {
      if (trigger.priority <= 2 && questions.length < 4) {
        const question = this.createQuestionFromTrigger(trigger, chiefComplaint);
        if (question) {
          questions.push(question);
        }
      }
    });

    // Pain-specific follow-up questions
    if (chiefComplaint.match(/pain/i) && questions.length < 5) {
      questions.push({
        id: this.generateUUID(),
        text: 'Have you tried any pain medications, and what was their effect?',
        type: 'multiple-choice-with-text',
        options: [
          'Over-the-counter medications helped', 'Prescription medications helped',
          'Medications did not help', 'Have not tried any medications',
          'Medications made it worse'
        ],
        category: 'pain_management',
        required: false,
        phase: 2,
        clinicalPriority: 3,
        questionRationale: 'Medication response helps guide treatment plan',
        followUpTrigger: 'Pain chief complaint follow-up'
      });
    }

    // Medical history screening for concerning cases
    if (answerAnalysis.riskLevel !== 'low' && questions.length < 5) {
      questions.push({
        id: this.generateUUID(),
        text: 'Do you have any significant past medical history or current medications?',
        type: 'multiple-choice-with-text',
        options: [
          'No significant history', 'Heart disease', 'Diabetes', 'High blood pressure',
          'Previous surgery', 'Currently taking medications', 'Multiple conditions'
        ],
        category: 'medical_history',
        required: true,
        phase: 2,
        clinicalPriority: 2,
        questionRationale: 'Medical history affects risk assessment and treatment options',
        followUpTrigger: 'Elevated risk assessment'
      });
    }

    // Ensure we have at least 2-3 questions for comprehensive assessment
    if (questions.length < 2) {
      questions.push({
        id: this.generateUUID(),
        text: 'Is there anything else about your symptoms that you think is important?',
        type: 'text',
        category: 'additional_concerns',
        required: false,
        phase: 2,
        clinicalPriority: 4,
        questionRationale: 'Open-ended question to capture missed important information',
        followUpTrigger: 'Comprehensive assessment completion'
      });
    }

    // Limit to maximum 5 questions for Phase 2
    return questions.slice(0, 5);
  }

  private static createQuestionFromTrigger(trigger: any, chiefComplaint: string): Question | null {
    const baseQuestion = {
      id: this.generateUUID(),
      phase: 2 as const,
      required: trigger.priority <= 2,
      clinicalPriority: trigger.priority,
      followUpTrigger: trigger.reason
    };

    switch (trigger.category) {
      case 'symptom_clarification':
        return {
          ...baseQuestion,
          text: 'Can you provide more details about how your symptoms have changed over time?',
          type: 'multiple-choice-with-text',
          options: [
            'Symptoms getting worse', 'Symptoms improving', 'Symptoms fluctuating',
            'Symptoms staying the same', 'New symptoms appearing'
          ],
          category: 'symptom_progression',
          questionRationale: 'Symptom progression helps determine urgency and treatment'
        } as Question;

      case 'red_flag_screening':
        return {
          ...baseQuestion,
          text: 'Have you had any recent major illnesses, surgeries, or hospitalizations?',
          type: 'multiple-choice-with-text',
          options: [
            'No recent major events', 'Recent surgery (within 6 weeks)', 'Recent hospitalization',
            'Recent major illness', 'Recent injury/trauma'
          ],
          category: 'recent_events',
          redFlagIndicator: true,
          questionRationale: 'Recent medical events may affect current presentation and risk'
        } as Question;

      default:
        return null;
    }
  }

  private static calculatePriority(category: string, analysis: AnswerAnalysis): 1 | 2 | 3 | 4 | 5 {
    if (category === 'emergency_screening' || analysis.riskLevel === 'critical') return 1;
    if (analysis.riskLevel === 'high') return 2;
    if (analysis.riskLevel === 'medium') return 3;
    return 4;
  }

  private static getDefaultOptions(category: string): string[] {
    const defaultOptionSets: Record<string, string[]> = {
      'pain_assessment': ['Mild', 'Moderate', 'Severe', 'Varies', 'Not applicable'],
      'respiratory': ['Yes', 'No', 'Sometimes', 'Getting worse', 'Getting better'],
      'neurological': ['No changes', 'Mild changes', 'Significant changes', 'Gradual onset', 'Sudden onset'],
      'follow_up': ['Yes', 'No', 'Unsure', 'Sometimes', 'Not applicable']
    };
    
    return defaultOptionSets[category] || ['Yes', 'No', 'Unsure', 'Not applicable'];
  }

  private static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}