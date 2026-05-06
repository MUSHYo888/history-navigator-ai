// ABOUTME: Main AI service orchestrator for clinical AI features with enhanced error handling
// ABOUTME: Coordinates specialized AI services and provides unified interface with fallback mechanisms

import { Question, DifferentialDiagnosis, Answer, ReviewOfSystems, ClinicalDecisionSupport } from '@/types/medical';
import { AdvancedClinicalSupport, SeverityScore, ClinicalAlert } from '@/types/clinical-scores';
import { ClinicalScoringService } from '@/services/clinicalScoringService';
import { FallbackDataService } from './fallback/FallbackDataService';
import { withRetry } from '@/utils/withRetry';
import { supabase } from '@/integrations/supabase/client';

export interface DDxResponse {
  diagnosis?: string;
  confidence?: number;
  reasoning?: string;
  treatment_suggestions?: string[];
  differentialDiagnoses: DifferentialDiagnosis[];
  pertinentNegatives: string[];
  soapNote: string;
}

export interface AssessmentContext {
  age?: number;
  gender?: string;
  symptoms?: string[];
  systolicBP?: number | string;
  diastolicBP?: number | string;
  heartRate?: number | string;
  respiratoryRate?: number | string;
  temperature?: number | string;
  oxygenSaturation?: number | string;
}

export class AIService {
  private static logAICall(service: string, _chiefComplaint: string, success: boolean, error?: Error | unknown) {
    // Avoid logging PHI (chief complaint) to the browser console.
    if (!import.meta.env.DEV) return;
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : 'An unknown clinical error occurred';
    console.log({
      timestamp,
      service,
      success,
      error: error ? errorMessage : null
    });
  }

  private static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private static async callAIAssistant(action: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    return withRetry(async () => {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { action, ...payload },
      });
      if (error) {
        throw new Error(`AI assistant error: ${error.message}`);
      }
      return data as Record<string, unknown>;
    }, 3, 1000);
  }


  static async generateQuestions(
    chiefComplaint: string, 
    previousAnswers?: Record<string, Answer>
  ): Promise<Question[]> {
    try {
      const result = await this.callAIAssistant('generate-questions', { chiefComplaint, previousAnswers: previousAnswers || {} }) as { questions?: Partial<Question>[] };
      const questions = (result.questions || []).map((q: Partial<Question>) => ({
        ...q,
        id: q.id && q.id !== 'uuid' ? q.id : this.generateUUID(),
        type: q.type || 'text',
        category: q.category || 'general',
        required: typeof q.required === 'boolean' ? q.required : true
      }));

      this.logAICall('generateQuestions', chiefComplaint, true);
      return questions as Question[];
    } catch (error) {
      this.logAICall('generateQuestions', chiefComplaint, false, error);
      
      return FallbackDataService.getFallbackQuestions(chiefComplaint);
    }
  }

  static async generateDifferentialDiagnosis(
    chiefComplaint: string,
    answers: Record<string, Answer>,
    rosData?: ReviewOfSystems
  ): Promise<DDxResponse> {
    try {
      
      const result = await this.callAIAssistant('generate-differential', { chiefComplaint, answers, rosData: rosData || {} }) as { differentials?: DifferentialDiagnosis[], pertinentNegatives?: string[], soapNote?: string };

      this.logAICall('generateDifferentialDiagnosis', chiefComplaint, true);
      return {
        differentialDiagnoses: result.differentials || [],
        pertinentNegatives: result.pertinentNegatives || [],
        soapNote: result.soapNote || ''
      };
    } catch (error) {
      this.logAICall('generateDifferentialDiagnosis', chiefComplaint, false, error);
      
      return {
        differentialDiagnoses: FallbackDataService.getFallbackDifferentials(chiefComplaint),
        pertinentNegatives: [],
        soapNote: ''
      };
    }
  }

  static async generateClinicalDecisionSupport(
    chiefComplaint: string,
    differentialDiagnoses: DifferentialDiagnosis[],
    answers: Record<string, Answer>,
    rosData?: ReviewOfSystems
  ): Promise<ClinicalDecisionSupport> {
    try {
      
      const cdsResult = await this.callAIAssistant('generate-clinical-support', { chiefComplaint, differentialDiagnoses, answers, rosData: rosData || {} }) as { clinicalSupport?: ClinicalDecisionSupport };
      const result = (cdsResult.clinicalSupport || cdsResult) as unknown as ClinicalDecisionSupport;

      this.logAICall('generateClinicalDecisionSupport', chiefComplaint, true);
      return result;
    } catch (error) {
      this.logAICall('generateClinicalDecisionSupport', chiefComplaint, false, error);
      
      console.warn('AI Service unavailable or key invalid. Falling back to clinical protocols.');
      return {
        investigations: FallbackDataService.getFallbackInvestigations(chiefComplaint),
        redFlags: FallbackDataService.getFallbackRedFlags(chiefComplaint),
        guidelines: FallbackDataService.getFallbackGuidelines(chiefComplaint),
        treatmentRecommendations: [],
        followUpRecommendations: []
      };
    }
  }

  static async generateAdvancedClinicalSupport(
    chiefComplaint: string,
    answers: Record<string, Answer>,
    rosData: ReviewOfSystems,
    vitalSigns?: Record<string, string | number>,
    demographics?: { age?: number }
  ): Promise<AdvancedClinicalSupport> {
    try {
      
      const age = demographics?.age || 50;
      const vitals: AssessmentContext = vitalSigns || {
        systolicBP: 120,
        diastolicBP: 80,
        heartRate: 80,
        respiratoryRate: 16,
        temperature: 37,
        oxygenSaturation: 98
      };

      const severityScores = this.calculateRelevantScores(chiefComplaint, vitals, age);
      
      const riskAssessment = ClinicalScoringService.assessOverallRisk(
        age,
        vitals as unknown as { [key: string]: unknown; systolicBP?: string | number; heartRate?: string | number },
        this.extractComorbidities(rosData)
      );

      const clinicalAlerts = this.generateClinicalAlerts(vitals, severityScores);

      const triageRecommendation = ClinicalScoringService.generateTriageRecommendation(
        riskAssessment.overallRisk,
        severityScores,
        clinicalAlerts
      );

      this.logAICall('generateAdvancedClinicalSupport', chiefComplaint, true);

      return {
        severityScores,
        riskAssessment,
        triageRecommendation,
        clinicalAlerts
      };

    } catch (error) {
      this.logAICall('generateAdvancedClinicalSupport', chiefComplaint, false, error);
      console.error('Error generating advanced clinical support:', error);
      return this.getFallbackAdvancedSupport();
    }
  }

  private static calculateRelevantScores(
    chiefComplaint: string,
    vitals: AssessmentContext,
    age: number
  ): SeverityScore[] {
    const scores = [];
    const complaint = chiefComplaint.toLowerCase();

    if (complaint.includes('fever') || complaint.includes('infection') || complaint.includes('sepsis')) {
      const qsofa = ClinicalScoringService.calculateQSOFA(
        Number(vitals.systolicBP) || 120,
        Number(vitals.respiratoryRate) || 16,
        15
      );
      scores.push(qsofa);
    }

    if (complaint.includes('cough') || complaint.includes('pneumonia') || complaint.includes('chest')) {
      const curb65 = ClinicalScoringService.calculateCURB65(
        false,
        5,
        Number(vitals.respiratoryRate) || 16,
        Number(vitals.systolicBP) || 120,
        Number(vitals.diastolicBP) || 80,
        age
      );
      scores.push(curb65);
    }

    if (complaint.includes('chest pain') || complaint.includes('shortness of breath') || complaint.includes('breathless')) {
      const wellsPE = ClinicalScoringService.calculateWellsPE(
        true,
        true,
        Number(vitals.heartRate) || 80,
        false,
        false,
        false,
        false
      );
      scores.push(wellsPE);
    }

    return scores;
  }

  private static extractComorbidities(rosData: ReviewOfSystems): string[] {
    const comorbidities: string[] = [];
    
    Object.values(rosData).forEach((data) => {
      if (data.positive && Array.isArray(data.positive)) {
        comorbidities.push(...data.positive);
      }
    });

    return comorbidities;
  }

  private static generateClinicalAlerts(
    vitals: AssessmentContext,
    severityScores: SeverityScore[]
  ): ClinicalAlert[] {
    const alerts = [];

    if (Number(vitals.systolicBP) < 90) {
      alerts.push({
        id: 'hypotension',
        type: 'critical',
        title: 'Critical Hypotension',
        message: 'Systolic BP < 90 mmHg indicates hemodynamic compromise',
        triggeredBy: ['vital signs'],
        actions: ['IV access', 'Fluid resuscitation', 'Urgent physician review']
      });
    }

    if (Number(vitals.heartRate) > 120) {
      alerts.push({
        id: 'tachycardia',
        type: 'warning',
        title: 'Significant Tachycardia',
        message: 'Heart rate > 120 bpm may indicate stress response or pathology',
        triggeredBy: ['vital signs'],
        actions: ['ECG', 'Continuous monitoring', 'Assess for underlying cause']
      });
    }

    if (Number(vitals.oxygenSaturation) < 92) {
      alerts.push({
        id: 'hypoxia',
        type: 'critical',
        title: 'Severe Hypoxia',
        message: 'Oxygen saturation < 92% requires immediate intervention',
        triggeredBy: ['vital signs'],
        actions: ['High-flow oxygen', 'ABG analysis', 'Consider ventilatory support']
      });
    }

    severityScores.forEach(score => {
      if (score.riskLevel === 'high' || score.riskLevel === 'critical') {
        alerts.push({
          id: `score-${score.id}`,
          type: score.riskLevel === 'critical' ? 'critical' : 'warning',
          title: `High ${score.name}`,
          message: `${score.interpretation}`,
          triggeredBy: [score.name],
          actions: score.recommendations
        });
      }
    });

    return alerts;
  }

  private static getFallbackAdvancedSupport(): AdvancedClinicalSupport {
    return {
      severityScores: [],
      riskAssessment: {
        overallRisk: 'moderate',
        riskScore: 3,
        maxRiskScore: 10,
        riskFactors: [
          {
            factor: 'Presenting complaint requires evaluation',
            present: true,
            weight: 3,
            description: 'Patient requires clinical assessment'
          }
        ],
        recommendations: [
          'Clinical assessment required',
          'Monitor vital signs',
          'Consider basic investigations'
        ]
      },
      triageRecommendation: {
        priority: 'urgent',
        timeframe: 'Within 30 minutes',
        location: 'emergency',
        reasoning: 'Standard triage for presenting complaint',
        immediateActions: ['Basic observations', 'Nursing assessment']
      },
      clinicalAlerts: []
    };
  }
}
