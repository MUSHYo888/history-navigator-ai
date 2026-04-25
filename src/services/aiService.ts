// ABOUTME: Main AI service orchestrator for clinical AI features with enhanced error handling
// ABOUTME: Coordinates specialized AI services and provides unified interface with fallback mechanisms

import { Question, DifferentialDiagnosis, Answer, ReviewOfSystems, ClinicalDecisionSupport } from '@/types/medical';
import { AdvancedClinicalSupport, SeverityScore, ClinicalAlert } from '@/types/clinical-scores';
import { ClinicalScoringService } from '@/services/clinicalScoringService';
import { FallbackDataService } from './fallback/FallbackDataService';
import { withRetry } from '@/utils/withRetry';

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
  private static logAICall(service: string, chiefComplaint: string, success: boolean, error?: Error | unknown) {
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : 'An unknown clinical error occurred';
    console.log({
      timestamp,
      service,
      chiefComplaint,
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

  private static async callGroq(systemPrompt: string, userPrompt: string): Promise<Record<string, unknown>> {
    return withRetry(async () => {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY || 'mock-key-for-local-testing';
      if (!import.meta.env.VITE_GROQ_API_KEY && import.meta.env.DEV) {
        console.warn('VITE_GROQ_API_KEY missing locally. Falling back to mock data.');
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2
        })
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Groq API Error: ${response.status} ${err}`);
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    }, 3, 1000);
  }

  static async generateQuestions(
    chiefComplaint: string, 
    previousAnswers?: Record<string, Answer>
  ): Promise<Question[]> {
    try {
      const systemPrompt = `You are a clinical AI assistant generating focused medical history questions.
      Generate 4-6 relevant questions following the SOCRATES/OLDCARTS framework.
      Return ONLY a valid JSON object with a "questions" array matching this structure:
      { "questions": [ { "id": "uuid", "text": "Question text?", "type": "multiple-choice", "options": ["Option 1", "Option 2"], "category": "onset", "required": true } ] }`;
      
      const userPrompt = `Chief complaint: ${chiefComplaint}\nPrevious answers: ${JSON.stringify(previousAnswers || {})}`;
      
      const result = await this.callGroq(systemPrompt, userPrompt) as { questions?: Partial<Question>[] };
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
      const systemPrompt = `You are an expert clinical diagnostician. Analyze the clinical presentation and generate a comprehensive differential diagnosis list.
      You must extract 3-5 pertinent negatives from the HPI/ROS.
      Draft a complete, formal SOAP note based on the provided clinical data.
      For each diagnosis, you must provide a real-world, evidence-based guideline citation.
      Instead of generic investigations, provide actionable, STAT order sets (CPOE style).
      Return ONLY a valid JSON object matching this exact structure:
      { "pertinentNegatives": ["negative 1"], "soapNote": "S: ...", "differentials": [ { "condition": "Condition Name", "probability": 85, "explanation": "Clinical reasoning", "keyFeatures": ["Supporting feature 1"], "conflictingFeatures": ["Feature against"], "urgency": "high", "category": "cardiovascular", "redFlags": ["Red flag 1"], "guidelineCitation": "2021 AHA/ACC", "statOrders": ["STAT ECG"] } ] }
      Generate 5-8 diagnoses ranked by probability (0-100). Include common and serious conditions.`;

      const userPrompt = `Chief Complaint: ${chiefComplaint}\nPatient answers: ${JSON.stringify(answers)}\nReview of Systems: ${JSON.stringify(rosData || {})}`;
      
      const result = await this.callGroq(systemPrompt, userPrompt) as { differentials?: DifferentialDiagnosis[], pertinentNegatives?: string[], soapNote?: string };

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
      const systemPrompt = `You are a clinical AI assistant providing investigation recommendations and clinical decision support.
      Return ONLY a valid JSON object matching this exact structure:
      { "investigations": [ { "investigation": { "id": "unique_id", "name": "Test Name", "type": "laboratory", "category": "Cat", "indication": "Reason", "urgency": "routine", "cost": "low", "rationale": "Scientific rationale" }, "priority": 1, "clinicalRationale": "Why this is recommended", "contraindications": [] } ], "redFlags": [ { "condition": "Name", "severity": "high", "description": "Desc", "immediateActions": ["Action1"] } ], "guidelines": [ { "title": "Guideline title", "source": "Source", "recommendation": "Recommendation", "evidenceLevel": "A", "applicableConditions": ["Condition1"] } ], "treatmentRecommendations": ["Treatment1"], "followUpRecommendations": ["Followup1"] }
      Provide evidence-based recommendations.`;

      const userPrompt = `Chief complaint: ${chiefComplaint}\nDifferential diagnoses: ${JSON.stringify(differentialDiagnoses)}\nPatient answers: ${JSON.stringify(answers)}\nReview of Systems: ${JSON.stringify(rosData || {})}`;
      
      const result = await this.callGroq(systemPrompt, userPrompt) as unknown as ClinicalDecisionSupport;

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

      const severityScores = this.calculateRelevantScores(chiefComplaint, answers, vitals, age);
      
      const riskAssessment = ClinicalScoringService.assessOverallRisk(
        age,
        vitals,
        this.extractComorbidities(rosData),
        Object.values(answers).map(a => String(a.value))
      );

      const clinicalAlerts = this.generateClinicalAlerts(chiefComplaint, answers, vitals, severityScores);

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
      return this.getFallbackAdvancedSupport(chiefComplaint);
    }
  }

  private static calculateRelevantScores(
    chiefComplaint: string,
    answers: Record<string, Answer>,
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
    
    Object.entries(rosData).forEach(([system, data]) => {
      if (data.positive && Array.isArray(data.positive)) {
        comorbidities.push(...data.positive);
      }
    });

    return comorbidities;
  }

  private static generateClinicalAlerts(
    chiefComplaint: string,
    answers: Record<string, Answer>,
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

  private static getFallbackAdvancedSupport(chiefComplaint: string): AdvancedClinicalSupport {
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
