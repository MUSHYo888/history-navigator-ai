
// ABOUTME: Clinical scoring systems and risk stratification types
// ABOUTME: Defines interfaces for severity scores, risk assessment, and triage recommendations

export interface SeverityScore {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  interpretation: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  recommendations: string[];
}

export interface RiskFactor {
  factor: string;
  present: boolean;
  weight: number;
  description: string;
}

export interface RiskAssessment {
  overallRisk: 'low' | 'moderate' | 'high' | 'critical';
  riskScore: number;
  maxRiskScore: number;
  riskFactors: RiskFactor[];
  recommendations: string[];
}

export interface TriageRecommendation {
  priority: 'routine' | 'urgent' | 'emergency' | 'resuscitation';
  timeframe: string;
  location: 'home' | 'primary-care' | 'emergency' | 'icu';
  reasoning: string;
  immediateActions: string[];
}

export interface ClinicalAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  title: string;
  message: string;
  triggeredBy: string[];
  actions: string[];
}

export interface AdvancedClinicalSupport {
  severityScores: SeverityScore[];
  riskAssessment: RiskAssessment;
  triageRecommendation: TriageRecommendation;
  clinicalAlerts: ClinicalAlert[];
}
