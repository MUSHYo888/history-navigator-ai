
// ABOUTME: Enhanced investigation intelligence service for cost-benefit analysis and evidence-based pathways
// ABOUTME: Provides contraindication checking and follow-up algorithms for clinical investigations

import { 
  CostBenefitAnalysis, 
  EvidenceBasedPathway, 
  ContraindicationCheck, 
  FollowUpAlgorithm,
  InvestigationIntelligence,
  InvestigationRecommendation
} from '@/types/investigation-intelligence';

export class InvestigationIntelligenceService {
  
  static analyzeCostBenefit(
    investigationId: string,
    patientData: any,
    clinicalContext: any
  ): CostBenefitAnalysis {
    // Cost database - in real implementation, this would come from healthcare pricing databases
    const costDatabase: Record<string, any> = {
      'ecg': { cost: 50, category: 'very-low', yield: 85 },
      'troponin': { cost: 120, category: 'low', yield: 75 },
      'fbc': { cost: 30, category: 'very-low', yield: 60 },
      'tft': { cost: 80, category: 'low', yield: 70 },
      'chest-xray': { cost: 150, category: 'low', yield: 65 },
      'ct-chest': { cost: 800, category: 'high', yield: 90 },
      'mri-brain': { cost: 1200, category: 'very-high', yield: 95 },
      'echo': { cost: 300, category: 'moderate', yield: 80 }
    };

    const costData = costDatabase[investigationId] || { cost: 200, category: 'moderate', yield: 70 };
    
    // Calculate clinical benefit based on patient presentation
    const clinicalBenefit = this.calculateClinicalBenefit(investigationId, patientData, clinicalContext);
    
    // Calculate diagnostic yield based on pretest probability
    const diagnosticYield = this.calculateDiagnosticYield(investigationId, patientData);
    
    return {
      investigationId,
      estimatedCost: costData.cost,
      currency: 'USD',
      costCategory: costData.category,
      clinicalBenefit,
      diagnosticYield,
      costEffectivenessRatio: costData.cost / diagnosticYield,
      alternativesAvailable: this.hasAlternatives(investigationId),
      justification: this.generateCostJustification(investigationId, clinicalBenefit, diagnosticYield)
    };
  }

  static getEvidenceBasedPathway(
    chiefComplaint: string,
    differentialDiagnoses: any[]
  ): EvidenceBasedPathway {
    const pathways: Record<string, EvidenceBasedPathway> = {
      'chest pain': {
        pathwayId: 'chest-pain-pathway',
        name: 'Chest Pain Evaluation Pathway',
        condition: 'Chest Pain',
        evidenceLevel: 'A',
        guidelineSource: 'AHA/ACC 2021 Chest Pain Guidelines',
        steps: [
          {
            stepNumber: 1,
            investigationType: 'cardiac',
            investigationName: 'ECG',
            timing: 'immediate',
            prerequisites: [],
            expectedOutcomes: ['Rule out STEMI', 'Detect arrhythmias'],
            nextStepCriteria: 'If normal ECG and ongoing chest pain'
          },
          {
            stepNumber: 2,
            investigationType: 'laboratory',
            investigationName: 'Troponin',
            timing: 'immediate',
            prerequisites: ['ECG completed'],
            expectedOutcomes: ['Detect myocardial injury'],
            nextStepCriteria: 'If troponin negative, consider stress testing'
          }
        ],
        decisionPoints: [
          {
            pointId: 'troponin-decision',
            condition: 'Troponin result',
            ifPositive: 'Acute coronary syndrome pathway',
            ifNegative: 'Consider stress testing or CT coronary angiography',
            ifInconclusive: 'Repeat troponin in 3-6 hours',
            clinicalAction: 'Cardiology consultation if positive'
          }
        ],
        estimatedTimeframe: '2-4 hours for initial workup',
        successRate: 95
      },
      'fatigue': {
        pathwayId: 'fatigue-pathway',
        name: 'Fatigue Investigation Pathway',
        condition: 'Fatigue',
        evidenceLevel: 'B',
        guidelineSource: 'NICE Clinical Knowledge Summary',
        steps: [
          {
            stepNumber: 1,
            investigationType: 'laboratory',
            investigationName: 'Full Blood Count',
            timing: 'routine',
            prerequisites: [],
            expectedOutcomes: ['Screen for anemia', 'Detect infection'],
            nextStepCriteria: 'If normal, proceed to step 2'
          },
          {
            stepNumber: 2,
            investigationType: 'laboratory',
            investigationName: 'Thyroid Function Tests',
            timing: 'routine',
            prerequisites: ['FBC completed'],
            expectedOutcomes: ['Rule out thyroid dysfunction'],
            nextStepCriteria: 'If abnormal, endocrine referral'
          }
        ],
        decisionPoints: [
          {
            pointId: 'anemia-decision',
            condition: 'Hemoglobin level',
            ifPositive: 'Iron studies and B12/folate',
            ifNegative: 'Continue with thyroid function',
            ifInconclusive: 'Repeat in 4-6 weeks',
            clinicalAction: 'Treat underlying cause if identified'
          }
        ],
        estimatedTimeframe: '1-2 weeks for results',
        successRate: 80
      }
    };

    const complaint = chiefComplaint.toLowerCase();
    return pathways[complaint] || pathways['fatigue'];
  }

  static checkContraindications(
    investigationId: string,
    patientData: any,
    medications: string[] = [],
    allergies: string[] = [],
    medicalHistory: string[] = []
  ): ContraindicationCheck {
    const contraindicationDatabase: Record<string, any> = {
      'ct-contrast': {
        absolute: ['Severe renal impairment (eGFR <30)', 'Previous severe contrast reaction'],
        relative: ['Mild renal impairment', 'Diabetes with metformin', 'Pregnancy'],
        warnings: [
          { category: 'renal', description: 'Risk of contrast-induced nephropathy', riskLevel: 'moderate' },
          { category: 'allergy', description: 'Risk of allergic reaction', riskLevel: 'low' }
        ]
      },
      'mri': {
        absolute: ['Pacemaker (non-MRI compatible)', 'Cochlear implants', 'Metallic foreign bodies in eyes'],
        relative: ['Claustrophobia', 'Pregnancy (first trimester)'],
        warnings: [
          { category: 'other', description: 'Metallic implants may cause artifacts', riskLevel: 'low' }
        ]
      },
      'exercise-stress-test': {
        absolute: ['Unstable angina', 'Recent MI (<48 hours)', 'Severe aortic stenosis'],
        relative: ['Uncontrolled hypertension', 'Severe heart failure'],
        warnings: [
          { category: 'cardiac', description: 'Risk of cardiac events during stress', riskLevel: 'moderate' }
        ]
      }
    };

    const contraData = contraindicationDatabase[investigationId] || { absolute: [], relative: [], warnings: [] };
    
    // Check for contraindications based on patient data
    const detectedContraindications = this.detectContraindications(contraData, patientData, medicalHistory);
    
    return {
      investigationId,
      contraindications: detectedContraindications.contraindications,
      warnings: detectedContraindications.warnings,
      precautions: detectedContraindications.precautions,
      riskAssessment: detectedContraindications.riskLevel,
      alternativeRecommendations: this.getAlternativeInvestigations(investigationId)
    };
  }

  static generateFollowUpAlgorithm(investigationId: string): FollowUpAlgorithm {
    const algorithms: Record<string, FollowUpAlgorithm> = {
      'troponin': {
        algorithmId: 'troponin-followup',
        investigationId: 'troponin',
        resultCategories: [
          {
            category: 'normal',
            criteria: ['<0.04 ng/mL'],
            followUpAction: {
              action: 'routine-follow-up',
              timeframe: '24-48 hours',
              provider: 'primary-care',
              instructions: ['Monitor symptoms', 'Return if chest pain worsens']
            },
            timeframe: '24-48 hours'
          },
          {
            category: 'abnormal-mild',
            criteria: ['0.04-0.1 ng/mL'],
            followUpAction: {
              action: 'urgent-follow-up',
              timeframe: '6-12 hours',
              provider: 'specialist',
              instructions: ['Cardiology consultation', 'Serial troponins', 'ECG monitoring']
            },
            timeframe: '6-12 hours',
            repeatInvestigation: {
              timing: '6-12 hours',
              indication: 'Monitor trend',
              frequency: 'Every 6 hours x 3',
              stoppingCriteria: ['Stable or declining levels', 'Clinical improvement']
            }
          },
          {
            category: 'critical',
            criteria: ['>0.1 ng/mL'],
            followUpAction: {
              action: 'immediate-referral',
              timeframe: 'Immediate',
              provider: 'emergency',
              instructions: ['Emergency cardiology', 'Consider PCI', 'Intensive monitoring']
            },
            timeframe: 'Immediate'
          }
        ],
        defaultFollowUp: {
          action: 'routine-follow-up',
          timeframe: '24 hours',
          provider: 'primary-care',
          instructions: ['Clinical assessment', 'Symptom review']
        },
        urgentFollowUp: {
          action: 'urgent-follow-up',
          timeframe: '6 hours',
          provider: 'specialist',
          instructions: ['Specialist assessment', 'Additional investigations']
        },
        routineFollowUp: {
          action: 'routine-follow-up',
          timeframe: '1-2 weeks',
          provider: 'primary-care',
          instructions: ['General follow-up', 'Symptom monitoring']
        }
      }
    };

    return algorithms[investigationId] || this.getDefaultFollowUpAlgorithm(investigationId);
  }

  static generateInvestigationIntelligence(
    investigationId: string,
    chiefComplaint: string,
    patientData: any,
    differentialDiagnoses: any[]
  ): InvestigationIntelligence {
    const costBenefit = this.analyzeCostBenefit(investigationId, patientData, { chiefComplaint });
    const pathway = this.getEvidenceBasedPathway(chiefComplaint, differentialDiagnoses);
    const contraindications = this.checkContraindications(investigationId, patientData);
    const followUp = this.generateFollowUpAlgorithm(investigationId);
    
    const overallRecommendation = this.generateOverallRecommendation(
      costBenefit,
      contraindications,
      patientData
    );

    return {
      costBenefit,
      pathway,
      contraindications,
      followUp,
      overallRecommendation
    };
  }

  // Helper methods
  private static calculateClinicalBenefit(investigationId: string, patientData: any, context: any): number {
    // Simplified clinical benefit calculation
    const benefitScores: Record<string, number> = {
      'ecg': 9, 'troponin': 8, 'fbc': 6, 'tft': 7, 'chest-xray': 7, 'ct-chest': 9, 'mri-brain': 9
    };
    return benefitScores[investigationId] || 6;
  }

  private static calculateDiagnosticYield(investigationId: string, patientData: any): number {
    // Simplified diagnostic yield calculation
    const yieldScores: Record<string, number> = {
      'ecg': 85, 'troponin': 75, 'fbc': 60, 'tft': 70, 'chest-xray': 65, 'ct-chest': 90
    };
    return yieldScores[investigationId] || 70;
  }

  private static hasAlternatives(investigationId: string): boolean {
    const alternatives: Record<string, boolean> = {
      'ct-chest': true, 'mri-brain': true, 'echo': true, 'stress-test': true
    };
    return alternatives[investigationId] || false;
  }

  private static generateCostJustification(id: string, benefit: number, yield: number): string {
    if (benefit >= 8 && yield >= 80) return 'High clinical benefit with excellent diagnostic yield justifies cost';
    if (benefit >= 6 && yield >= 60) return 'Moderate benefit-cost ratio, clinically justified';
    return 'Consider alternatives due to lower cost-effectiveness ratio';
  }

  private static detectContraindications(contraData: any, patientData: any, history: string[]): any {
    return {
      contraindications: [],
      warnings: contraData.warnings || [],
      precautions: [],
      riskLevel: 'low' as const
    };
  }

  private static getAlternativeInvestigations(investigationId: string): string[] {
    const alternatives: Record<string, string[]> = {
      'ct-chest': ['Chest X-ray', 'MRI chest', 'Ultrasound'],
      'mri-brain': ['CT brain', 'Ultrasound (if applicable)'],
      'stress-test': ['Echocardiogram', 'CT coronary angiography']
    };
    return alternatives[investigationId] || [];
  }

  private static getDefaultFollowUpAlgorithm(investigationId: string): FollowUpAlgorithm {
    return {
      algorithmId: `${investigationId}-default`,
      investigationId,
      resultCategories: [
        {
          category: 'normal',
          criteria: ['Within normal limits'],
          followUpAction: {
            action: 'routine-follow-up',
            timeframe: '1-2 weeks',
            provider: 'primary-care',
            instructions: ['Clinical review', 'Symptom monitoring']
          },
          timeframe: '1-2 weeks'
        }
      ],
      defaultFollowUp: {
        action: 'routine-follow-up',
        timeframe: '1-2 weeks',
        provider: 'primary-care',
        instructions: ['Clinical assessment']
      },
      urgentFollowUp: {
        action: 'urgent-follow-up',
        timeframe: '24-48 hours',
        provider: 'specialist',
        instructions: ['Specialist review']
      },
      routineFollowUp: {
        action: 'routine-follow-up',
        timeframe: '1-2 weeks',
        provider: 'primary-care',
        instructions: ['General follow-up']
      }
    };
  }

  private static generateOverallRecommendation(
    costBenefit: CostBenefitAnalysis,
    contraindications: ContraindicationCheck,
    patientData: any
  ): InvestigationRecommendation {
    let recommendation: any = 'recommended';
    let strength = 7;

    // Adjust based on contraindications
    if (contraindications.riskAssessment === 'contraindicated') {
      recommendation = 'contraindicated';
      strength = 1;
    } else if (contraindications.riskAssessment === 'high') {
      recommendation = 'not-recommended';
      strength = 3;
    }

    // Adjust based on cost-benefit
    if (costBenefit.costEffectivenessRatio > 100 && costBenefit.clinicalBenefit < 6) {
      recommendation = 'consider';
      strength = Math.max(strength - 2, 1);
    }

    return {
      recommendation,
      strength,
      rationale: [
        `Clinical benefit score: ${costBenefit.clinicalBenefit}/10`,
        `Diagnostic yield: ${costBenefit.diagnosticYield}%`,
        `Cost-effectiveness ratio: ${costBenefit.costEffectivenessRatio.toFixed(2)}`
      ],
      conditions: [],
      alternatives: contraindications.alternativeRecommendations
    };
  }
}
