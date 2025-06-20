
// ABOUTME: Enhanced investigation intelligence types for cost-benefit analysis and evidence-based pathways
// ABOUTME: Supports contraindication checking and follow-up algorithms for clinical investigations

export interface CostBenefitAnalysis {
  investigationId: string;
  estimatedCost: number;
  currency: string;
  costCategory: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
  clinicalBenefit: number; // 1-10 scale
  diagnosticYield: number; // percentage likelihood of positive/actionable result
  costEffectivenessRatio: number; // cost per diagnostic yield
  alternativesAvailable: boolean;
  justification: string;
}

export interface EvidenceBasedPathway {
  pathwayId: string;
  name: string;
  condition: string;
  evidenceLevel: 'A' | 'B' | 'C' | 'D';
  guidelineSource: string;
  steps: InvestigationStep[];
  decisionPoints: DecisionPoint[];
  estimatedTimeframe: string;
  successRate: number;
}

export interface InvestigationStep {
  stepNumber: number;
  investigationType: string;
  investigationName: string;
  timing: 'immediate' | 'within-24h' | 'within-48h' | 'within-week' | 'routine';
  prerequisites: string[];
  expectedOutcomes: string[];
  nextStepCriteria: string;
}

export interface DecisionPoint {
  pointId: string;
  condition: string;
  ifPositive: string;
  ifNegative: string;
  ifInconclusive: string;
  clinicalAction: string;
}

export interface ContraindicationCheck {
  investigationId: string;
  contraindications: Contraindication[];
  warnings: Warning[];
  precautions: Precaution[];
  riskAssessment: 'low' | 'moderate' | 'high' | 'contraindicated';
  alternativeRecommendations: string[];
}

export interface Contraindication {
  type: 'absolute' | 'relative';
  condition: string;
  reason: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  overrideConditions?: string[];
}

export interface Warning {
  category: 'allergy' | 'pregnancy' | 'renal' | 'hepatic' | 'cardiac' | 'medication' | 'other';
  description: string;
  riskLevel: 'low' | 'moderate' | 'high';
  monitoringRequired: string[];
}

export interface Precaution {
  condition: string;
  action: string;
  monitoring: string[];
  duration: string;
}

export interface FollowUpAlgorithm {
  algorithmId: string;
  investigationId: string;
  resultCategories: ResultCategory[];
  defaultFollowUp: FollowUpAction;
  urgentFollowUp: FollowUpAction;
  routineFollowUp: FollowUpAction;
}

export interface ResultCategory {
  category: 'normal' | 'abnormal-mild' | 'abnormal-moderate' | 'abnormal-severe' | 'critical';
  criteria: string[];
  followUpAction: FollowUpAction;
  timeframe: string;
  repeatInvestigation?: RepeatInvestigation;
}

export interface FollowUpAction {
  action: 'discharge' | 'routine-follow-up' | 'urgent-follow-up' | 'immediate-referral' | 'repeat-investigation' | 'additional-investigation';
  timeframe: string;
  provider: 'primary-care' | 'specialist' | 'emergency' | 'inpatient';
  instructions: string[];
  additionalInvestigations?: string[];
}

export interface RepeatInvestigation {
  timing: string;
  indication: string;
  frequency: string;
  stoppingCriteria: string[];
}

export interface InvestigationIntelligence {
  costBenefit: CostBenefitAnalysis;
  pathway: EvidenceBasedPathway;
  contraindications: ContraindicationCheck;
  followUp: FollowUpAlgorithm;
  overallRecommendation: InvestigationRecommendation;
}

export interface InvestigationRecommendation {
  recommendation: 'strongly-recommended' | 'recommended' | 'consider' | 'not-recommended' | 'contraindicated';
  strength: number; // 1-10
  rationale: string[];
  conditions: string[];
  alternatives: string[];
}
