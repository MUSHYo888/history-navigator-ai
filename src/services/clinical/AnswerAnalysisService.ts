// ABOUTME: Service for analyzing Phase 1 answers to identify red flags and determine Phase 2 questions
// ABOUTME: Implements clinical decision logic to assess risk and generate targeted follow-up questions

import { Answer } from '@/types/medical';

export interface AnswerAnalysis {
  redFlags: RedFlagAlert[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  concerningPatterns: string[];
  recommendedFollowUp: string[];
  phase2Triggers: Phase2Trigger[];
}

export interface RedFlagAlert {
  condition: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  immediateActions: string[];
  triggeredBy: string;
}

export interface Phase2Trigger {
  category: string;
  reason: string;
  priority: 1 | 2 | 3 | 4 | 5;
  suggestedQuestions: string[];
}

export class AnswerAnalysisService {
  static analyzePhase1Answers(
    answers: Record<string, Answer>, 
    chiefComplaint: string
  ): AnswerAnalysis {
    
    const redFlags: RedFlagAlert[] = [];
    const concerningPatterns: string[] = [];
    const phase2Triggers: Phase2Trigger[] = [];
    const recommendedFollowUp: string[] = [];
    
    // Analyze individual answers for red flags
    Object.values(answers).forEach(answer => {
      this.checkForRedFlags(answer, redFlags, chiefComplaint);
      this.identifyConcerningPatterns(answer, concerningPatterns);
    });

    // Generate Phase 2 triggers based on analysis
    this.generatePhase2Triggers(answers, phase2Triggers, chiefComplaint);
    
    // Determine overall risk level
    const riskLevel = this.calculateRiskLevel(redFlags, concerningPatterns);
    
    // Generate follow-up recommendations
    this.generateFollowUpRecommendations(riskLevel, redFlags, recommendedFollowUp);

    
    return {
      redFlags,
      riskLevel,
      concerningPatterns,
      recommendedFollowUp,
      phase2Triggers
    };
  }

  private static checkForRedFlags(
    answer: Answer, 
    redFlags: RedFlagAlert[], 
    chiefComplaint: string
  ): void {
    const value = typeof answer.value === 'string' ? answer.value.toLowerCase() : '';
    
    // Pain-related red flags
    if (chiefComplaint.match(/pain/i)) {
      if (value.includes('sudden') || value.includes('worst pain')) {
        redFlags.push({
          condition: 'Acute severe pain',
          severity: 'high',
          description: 'Sudden onset severe pain may indicate serious pathology',
          immediateActions: ['Urgent assessment', 'Consider immediate imaging', 'Pain management'],
          triggeredBy: 'sudden onset or severe pain description'
        });
      }
      
      if (value.includes('crushing') || value.includes('pressure')) {
        redFlags.push({
          condition: 'Possible cardiac event',
          severity: 'high',
          description: 'Crushing/pressure chest pain may indicate MI',
          immediateActions: ['ECG', 'Cardiac enzymes', 'Urgent cardiology consultation'],
          triggeredBy: 'crushing or pressure-type chest pain'
        });
      }
    }

    // Respiratory red flags
    if (chiefComplaint.match(/breath|dyspn|sob/i)) {
      if (value.includes('sudden') || value.includes('acute')) {
        redFlags.push({
          condition: 'Acute respiratory distress',
          severity: 'high',
          description: 'Sudden dyspnea may indicate PE, pneumothorax, or acute heart failure',
          immediateActions: ['Oxygen saturation', 'Chest X-ray', 'D-dimer/CT-PA', 'ABG if severe'],
          triggeredBy: 'sudden onset breathing difficulty'
        });
      }
    }

    // Neurological red flags
    if (chiefComplaint.match(/headache|neuro|weakness/i)) {
      if (value.includes('worst headache') || value.includes('sudden') || value.includes('thunderclap')) {
        redFlags.push({
          condition: 'Possible subarachnoid hemorrhage',
          severity: 'high',
          description: 'Worst headache of life may indicate SAH',
          immediateActions: ['Urgent CT head', 'Neurology consultation', 'LP if CT negative'],
          triggeredBy: 'worst headache ever or thunderclap description'
        });
      }
      
      if (value.includes('weakness') || value.includes('paralysis')) {
        redFlags.push({
          condition: 'Possible stroke',
          severity: 'high',
          description: 'Acute weakness may indicate cerebrovascular accident',
          immediateActions: ['Urgent CT/MRI', 'Stroke team activation', 'NIHSS assessment'],
          triggeredBy: 'acute weakness or paralysis'
        });
      }
    }

    // Scale-based red flags (severity scores)
    if (typeof answer.value === 'number' && answer.value >= 8) {
      redFlags.push({
        condition: 'Severe symptoms',
        severity: 'medium',
        description: 'High severity score indicates significant distress',
        immediateActions: ['Priority assessment', 'Consider pain management', 'Frequent monitoring'],
        triggeredBy: `severity score of ${answer.value}/10`
      });
    }
  }

  private static identifyConcerningPatterns(answer: Answer, patterns: string[]): void {
    const value = typeof answer.value === 'string' ? answer.value.toLowerCase() : '';
    
    if (value.includes('getting worse') || value.includes('progressive')) {
      patterns.push('Progressive symptom pattern');
    }
    
    if (value.includes('night') || value.includes('wake')) {
      patterns.push('Nocturnal symptoms - may indicate serious pathology');
    }
    
    if (value.includes('weight loss') || value.includes('loss of appetite')) {
      patterns.push('Constitutional symptoms - consider systemic disease');
    }
    
    if (value.includes('fever') || value.includes('chills')) {
      patterns.push('Systemic inflammatory response');
    }
  }

  private static generatePhase2Triggers(
    answers: Record<string, Answer>,
    triggers: Phase2Trigger[],
    chiefComplaint: string
  ): void {
    
    // Check for symptom complexity requiring detailed assessment
    const answerCount = Object.keys(answers).length;
    const concerningAnswers = Object.values(answers).filter(a => 
      typeof a.value === 'string' && 
      (a.value.includes('severe') || a.value.includes('concerning') || a.value.includes('worse'))
    );

    if (concerningAnswers.length > 0) {
      triggers.push({
        category: 'symptom_clarification',
        reason: 'Multiple concerning symptoms require detailed assessment',
        priority: 1,
        suggestedQuestions: [
          'Can you describe the progression of your symptoms in more detail?',
          'Have you experienced any similar episodes in the past?',
          'Are there any specific activities that trigger these symptoms?'
        ]
      });
    }

    // Pain-specific triggers
    if (chiefComplaint.match(/pain/i)) {
      triggers.push({
        category: 'pain_assessment',
        reason: 'Detailed pain characterization needed',
        priority: 2,
        suggestedQuestions: [
          'Does your pain follow any specific pattern throughout the day?',
          'Have you tried any treatments, and what was the response?',
          'Is there any family history of similar pain conditions?'
        ]
      });
    }

    // Respiratory-specific triggers
    if (chiefComplaint.match(/breath|cough|chest/i)) {
      triggers.push({
        category: 'respiratory_assessment',
        reason: 'Detailed respiratory evaluation needed',
        priority: 2,
        suggestedQuestions: [
          'Do you have any history of lung disease or smoking?',
          'Are you taking any medications that might affect breathing?',
          'Have you been exposed to any environmental triggers?'
        ]
      });
    }

    // Always add red flag screening trigger
    triggers.push({
      category: 'red_flag_screening',
      reason: 'Systematic screening for emergency conditions',
      priority: 1,
      suggestedQuestions: [
        'Are you experiencing any severe or life-threatening symptoms right now?',
        'Have you had any recent hospitalizations or major medical events?',
        'Are you currently taking any medications or have any allergies?'
      ]
    });
  }

  private static calculateRiskLevel(
    redFlags: RedFlagAlert[], 
    patterns: string[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    
    const highSeverityFlags = redFlags.filter(f => f.severity === 'high').length;
    const mediumSeverityFlags = redFlags.filter(f => f.severity === 'medium').length;
    
    if (highSeverityFlags >= 2 || redFlags.some(f => 
      f.condition.includes('cardiac') || f.condition.includes('stroke') || f.condition.includes('hemorrhage')
    )) {
      return 'critical';
    }
    
    if (highSeverityFlags >= 1 || mediumSeverityFlags >= 2) {
      return 'high';
    }
    
    if (mediumSeverityFlags >= 1 || patterns.length >= 3) {
      return 'medium';
    }
    
    return 'low';
  }

  private static generateFollowUpRecommendations(
    riskLevel: string,
    redFlags: RedFlagAlert[],
    recommendations: string[]
  ): void {
    
    switch (riskLevel) {
      case 'critical':
        recommendations.push('URGENT: Immediate medical evaluation required');
        recommendations.push('Consider emergency department referral');
        recommendations.push('Continuous monitoring needed');
        break;
        
      case 'high':
        recommendations.push('Urgent assessment within 24 hours');
        recommendations.push('Consider same-day appointment or urgent care');
        recommendations.push('Detailed diagnostic workup indicated');
        break;
        
      case 'medium':
        recommendations.push('Assessment within 48-72 hours recommended');
        recommendations.push('Symptom monitoring and follow-up care');
        recommendations.push('Consider targeted investigations');
        break;
        
      case 'low':
        recommendations.push('Routine follow-up appropriate');
        recommendations.push('Symptom diary and self-monitoring');
        recommendations.push('Conservative management initially');
        break;
    }

    // Add specific recommendations based on red flags
    redFlags.forEach(flag => {
      flag.immediateActions.forEach(action => {
        if (!recommendations.includes(action)) {
          recommendations.push(action);
        }
      });
    });
  }
}