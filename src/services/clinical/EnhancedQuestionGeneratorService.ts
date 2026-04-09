// ABOUTME: Coordinating service that manages the two-phase question generation system
// ABOUTME: Orchestrates Phase 1 template questions and Phase 2 adaptive AI questions

import { Question, Answer } from '@/types/medical';
import { ClinicalQuestionTemplateService } from './ClinicalQuestionTemplateService';
import { AdaptiveQuestionGeneratorService } from './AdaptiveQuestionGeneratorService';
import { AnswerAnalysisService, AnswerAnalysis } from './AnswerAnalysisService';
import { supabase } from '@/integrations/supabase/client';

export interface PhaseTransitionData {
  phase1Complete: boolean;
  phase2Triggered: boolean;
  answerAnalysis?: AnswerAnalysis;
  phase2Questions?: Question[];
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export class EnhancedQuestionGeneratorService {
  
  /**
   * Generate Phase 1 questions using clinical templates
   */
  static generatePhase1Questions(chiefComplaint: string): Question[] {
    return ClinicalQuestionTemplateService.generatePhase1Questions(chiefComplaint);
  }

  /**
   * Analyze Phase 1 answers and determine if Phase 2 is needed
   */
  static analyzePhase1Completion(
    chiefComplaint: string,
    phase1Answers: Record<string, Answer>
  ): PhaseTransitionData {
    
    // Analyze answers for clinical significance
    const answerAnalysis = AnswerAnalysisService.analyzePhase1Answers(
      phase1Answers, 
      chiefComplaint
    );

    // Determine if Phase 2 is needed based on analysis
    const phase2Triggered = this.shouldTriggerPhase2(answerAnalysis, phase1Answers);
    
    
    return {
      phase1Complete: true,
      phase2Triggered,
      answerAnalysis,
      overallRiskLevel: answerAnalysis.riskLevel
    };
  }

  /**
   * Generate Phase 2 questions based on Phase 1 analysis
   */
  static async generatePhase2Questions(
    chiefComplaint: string,
    phase1Answers: Record<string, Answer>,
    answerAnalysis: AnswerAnalysis
  ): Promise<Question[]> {
    
    return await AdaptiveQuestionGeneratorService.generatePhase2Questions(
      chiefComplaint,
      phase1Answers,
      answerAnalysis
    );
  }

  /**
   * Save phase completion data to database
   */
  static async savePhaseCompletion(
    assessmentId: string,
    phase: 1 | 2,
    answers: Record<string, Answer>,
    analysis?: AnswerAnalysis
  ): Promise<void> {
    try {
      
      const phaseData = {
        assessment_id: assessmentId,
        phase,
        phase_summary: {
          answerCount: Object.keys(answers).length,
          completedAt: new Date().toISOString(),
          riskLevel: analysis?.riskLevel || 'low',
          concerningPatterns: analysis?.concerningPatterns || []
        },
        red_flags_identified: analysis?.redFlags ? JSON.parse(JSON.stringify(analysis.redFlags)) : []
      };

      const { error } = await supabase
        .from('phase_answers')
        .insert(phaseData);

      if (error) {
        console.error('Error saving phase completion:', error);
        throw new Error(`Failed to save phase completion: ${error.message}`);
      }

    } catch (error) {
      console.error('Failed to save phase completion:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive question set for assessment (both phases if applicable)
   */
  static async getComprehensiveQuestionSet(
    chiefComplaint: string,
    currentPhase: 1 | 2 = 1,
    phase1Answers?: Record<string, Answer>
  ): Promise<{
    phase1Questions: Question[];
    phase2Questions?: Question[];
    transitionData?: PhaseTransitionData;
  }> {
    
    // Always generate Phase 1 questions
    const phase1Questions = this.generatePhase1Questions(chiefComplaint);
    
    let phase2Questions: Question[] | undefined;
    let transitionData: PhaseTransitionData | undefined;
    
    // If Phase 1 is complete and we have answers, analyze and potentially generate Phase 2
    if (currentPhase === 2 && phase1Answers && Object.keys(phase1Answers).length > 0) {
      transitionData = this.analyzePhase1Completion(chiefComplaint, phase1Answers);
      
      if (transitionData.phase2Triggered && transitionData.answerAnalysis) {
        phase2Questions = await this.generatePhase2Questions(
          chiefComplaint,
          phase1Answers,
          transitionData.answerAnalysis
        );
        transitionData.phase2Questions = phase2Questions;
      }
    }

    return {
      phase1Questions,
      phase2Questions,
      transitionData
    };
  }

  /**
   * Determine if Phase 2 should be triggered based on analysis
   */
  private static shouldTriggerPhase2(
    analysis: AnswerAnalysis,
    answers: Record<string, Answer>
  ): boolean {
    
    // Always trigger Phase 2 for high/critical risk cases
    if (analysis.riskLevel === 'critical' || analysis.riskLevel === 'high') {
      return true;
    }

    // Trigger Phase 2 if there are red flags
    if (analysis.redFlags.length > 0) {
      return true;
    }

    // Trigger Phase 2 if there are concerning patterns
    if (analysis.concerningPatterns.length >= 2) {
      return true;
    }

    // Trigger Phase 2 if there are high-priority triggers
    const highPriorityTriggers = analysis.phase2Triggers.filter(t => t.priority <= 2);
    if (highPriorityTriggers.length > 0) {
      return true;
    }

    // Check for incomplete or concerning answers
    const incompleteAnswers = Object.values(answers).filter(a => 
      typeof a.value === 'string' && 
      (a.value.includes('unsure') || a.value.includes('unclear') || a.value.length < 3)
    );
    
    if (incompleteAnswers.length >= 2) {
      return true;
    }

    // For medium risk, trigger Phase 2 if there are multiple concerning factors
    if (analysis.riskLevel === 'medium' && 
        (analysis.concerningPatterns.length > 0 || analysis.phase2Triggers.length > 1)) {
      return true;
    }

    // Default: don't trigger Phase 2 for low-risk, straightforward cases
    return false;
  }

  /**
   * Get phase statistics for reporting
   */
  static getPhaseStatistics(
    phase1Questions: Question[],
    phase2Questions?: Question[]
  ): {
    totalQuestions: number;
    phase1Count: number;
    phase2Count: number;
    redFlagCount: number;
    highPriorityCount: number;
  } {
    
    const allQuestions = [...phase1Questions, ...(phase2Questions || [])];
    
    return {
      totalQuestions: allQuestions.length,
      phase1Count: phase1Questions.length,
      phase2Count: phase2Questions?.length || 0,
      redFlagCount: allQuestions.filter(q => q.redFlagIndicator).length,
      highPriorityCount: allQuestions.filter(q => q.clinicalPriority && q.clinicalPriority <= 2).length
    };
  }
}