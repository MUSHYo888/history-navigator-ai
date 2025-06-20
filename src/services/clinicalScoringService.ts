
// ABOUTME: Clinical scoring algorithms and risk stratification calculations
// ABOUTME: Implements various medical scoring systems like QSOFA, CURB-65, Wells score

import { SeverityScore, RiskAssessment, TriageRecommendation, ClinicalAlert, RiskFactor } from '@/types/clinical-scores';

export class ClinicalScoringService {
  static calculateQSOFA(
    systolicBP: number,
    respiratoryRate: number,
    glasgowComaScale: number
  ): SeverityScore {
    let score = 0;
    
    if (systolicBP <= 100) score += 1;
    if (respiratoryRate >= 22) score += 1;
    if (glasgowComaScale < 15) score += 1;

    const interpretation = score >= 2 
      ? 'High risk of poor outcome - consider sepsis'
      : score === 1
      ? 'Moderate risk - monitor closely'
      : 'Low risk';

    const riskLevel = score >= 2 ? 'high' : score === 1 ? 'moderate' : 'low';

    return {
      id: 'qsofa',
      name: 'qSOFA (Quick Sequential Organ Failure Assessment)',
      score,
      maxScore: 3,
      interpretation,
      riskLevel,
      recommendations: score >= 2 
        ? ['Consider sepsis workup', 'Urgent medical attention', 'Monitor vital signs']
        : ['Continue monitoring', 'Reassess if condition changes']
    };
  }

  static calculateCURB65(
    confusion: boolean,
    urea: number,
    respiratoryRate: number,
    systolicBP: number,
    diastolicBP: number,
    age: number
  ): SeverityScore {
    let score = 0;
    
    if (confusion) score += 1;
    if (urea > 7) score += 1;
    if (respiratoryRate >= 30) score += 1;
    if (systolicBP < 90 || diastolicBP <= 60) score += 1;
    if (age >= 65) score += 1;

    const interpretation = 
      score >= 3 ? 'Severe pneumonia - hospital treatment'
      : score === 2 ? 'Moderate pneumonia - consider hospital'
      : 'Mild pneumonia - outpatient treatment';

    const riskLevel = 
      score >= 3 ? 'high'
      : score === 2 ? 'moderate'
      : 'low';

    return {
      id: 'curb65',
      name: 'CURB-65 (Pneumonia Severity)',
      score,
      maxScore: 5,
      interpretation,
      riskLevel,
      recommendations: score >= 3 
        ? ['Hospital admission', 'IV antibiotics', 'Close monitoring']
        : score === 2
        ? ['Consider short hospital stay', 'Oral antibiotics', 'Follow-up in 24-48h']
        : ['Oral antibiotics', 'Home management', 'Follow-up in 48-72h']
    };
  }

  static calculateWellsPE(
    clinicalSigns: boolean,
    alternativeDiagnosis: boolean,
    heartRate: number,
    immobilization: boolean,
    previousPE: boolean,
    hemoptysis: boolean,
    malignancy: boolean
  ): SeverityScore {
    let score = 0;
    
    if (clinicalSigns) score += 3;
    if (!alternativeDiagnosis) score += 3;
    if (heartRate > 100) score += 1.5;
    if (immobilization) score += 1.5;
    if (previousPE) score += 1.5;
    if (hemoptysis) score += 1;
    if (malignancy) score += 1;

    const interpretation = 
      score > 6 ? 'High probability of PE'
      : score >= 2 ? 'Moderate probability of PE'
      : 'Low probability of PE';

    const riskLevel = 
      score > 6 ? 'high'
      : score >= 2 ? 'moderate'
      : 'low';

    return {
      id: 'wells-pe',
      name: 'Wells Score (Pulmonary Embolism)',
      score,
      maxScore: 12.5,
      interpretation,
      riskLevel,
      recommendations: score > 6 
        ? ['CT pulmonary angiogram', 'Anticoagulation if confirmed', 'Hospital admission']
        : score >= 2
        ? ['D-dimer test', 'Consider imaging if elevated']
        : ['Clinical observation', 'Consider alternative diagnoses']
    };
  }

  static assessOverallRisk(
    age: number,
    vitalSigns: any,
    comorbidities: string[],
    symptoms: string[]
  ): RiskAssessment {
    const riskFactors: RiskFactor[] = [];
    let totalRiskScore = 0;

    // Age-based risk
    if (age >= 65) {
      riskFactors.push({
        factor: 'Advanced age (≥65)',
        present: true,
        weight: 2,
        description: 'Increased risk of complications and mortality'
      });
      totalRiskScore += 2;
    }

    // Vital signs risk
    if (vitalSigns.systolicBP < 90 || vitalSigns.systolicBP > 180) {
      riskFactors.push({
        factor: 'Abnormal blood pressure',
        present: true,
        weight: 3,
        description: 'Hemodynamic instability'
      });
      totalRiskScore += 3;
    }

    if (vitalSigns.heartRate > 100 || vitalSigns.heartRate < 50) {
      riskFactors.push({
        factor: 'Abnormal heart rate',
        present: true,
        weight: 2,
        description: 'Cardiac compromise or stress response'
      });
      totalRiskScore += 2;
    }

    // Comorbidity risk
    const highRiskComorbidities = ['heart failure', 'copd', 'diabetes', 'kidney disease'];
    const presentComorbidities = comorbidities.filter(c => 
      highRiskComorbidities.some(hrc => c.toLowerCase().includes(hrc))
    );

    if (presentComorbidities.length > 0) {
      riskFactors.push({
        factor: 'High-risk comorbidities',
        present: true,
        weight: presentComorbidities.length * 2,
        description: `Present: ${presentComorbidities.join(', ')}`
      });
      totalRiskScore += presentComorbidities.length * 2;
    }

    const overallRisk = 
      totalRiskScore >= 8 ? 'critical'
      : totalRiskScore >= 5 ? 'high'
      : totalRiskScore >= 3 ? 'moderate'
      : 'low';

    return {
      overallRisk,
      riskScore: totalRiskScore,
      maxRiskScore: 15,
      riskFactors,
      recommendations: this.getRiskRecommendations(overallRisk)
    };
  }

  static generateTriageRecommendation(
    riskLevel: string,
    severityScores: SeverityScore[],
    clinicalAlerts: ClinicalAlert[]
  ): TriageRecommendation {
    const hasCriticalAlerts = clinicalAlerts.some(alert => alert.type === 'critical');
    const hasHighSeverityScores = severityScores.some(score => score.riskLevel === 'high' || score.riskLevel === 'critical');

    if (hasCriticalAlerts || riskLevel === 'critical') {
      return {
        priority: 'resuscitation',
        timeframe: 'Immediate',
        location: 'emergency',
        reasoning: 'Critical condition requiring immediate intervention',
        immediateActions: [
          'Activate emergency response team',
          'Continuous monitoring',
          'Prepare for resuscitation'
        ]
      };
    }

    if (hasHighSeverityScores || riskLevel === 'high') {
      return {
        priority: 'emergency',
        timeframe: 'Within 10 minutes',
        location: 'emergency',
        reasoning: 'High-risk presentation requiring urgent medical attention',
        immediateActions: [
          'Immediate physician assessment',
          'Vital signs monitoring',
          'Prepare for investigations'
        ]
      };
    }

    if (riskLevel === 'moderate') {
      return {
        priority: 'urgent',
        timeframe: 'Within 30 minutes',
        location: 'emergency',
        reasoning: 'Moderate risk requiring prompt evaluation',
        immediateActions: [
          'Nursing assessment',
          'Basic observations',
          'Queue for physician review'
        ]
      };
    }

    return {
      priority: 'routine',
      timeframe: 'Within 2 hours',
      location: 'primary-care',
      reasoning: 'Low risk suitable for routine care',
      immediateActions: [
        'Standard triage',
        'Basic observations',
        'Routine queue'
      ]
    };
  }

  private static getRiskRecommendations(riskLevel: string): string[] {
    switch (riskLevel) {
      case 'critical':
        return [
          'Immediate emergency care required',
          'Continuous monitoring',
          'Consider ICU admission',
          'Activate rapid response team'
        ];
      case 'high':
        return [
          'Urgent medical attention needed',
          'Hospital admission likely required',
          'Frequent vital sign monitoring',
          'Senior clinician review'
        ];
      case 'moderate':
        return [
          'Close monitoring required',
          'Consider hospital observation',
          'Regular reassessment',
          'Clear discharge criteria'
        ];
      default:
        return [
          'Standard monitoring',
          'Outpatient management appropriate',
          'Routine follow-up',
          'Patient education'
        ];
    }
  }
}
