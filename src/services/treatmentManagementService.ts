// ABOUTME: Treatment and management recommendation service with medication suggestions and pathways
// ABOUTME: Provides drug interaction checking, treatment pathways, and discharge planning

import {
  Medication,
  DrugInteraction,
  TreatmentPathway,
  DischargePlan,
  MedicationSuggestion,
  TreatmentRecommendation,
  DischargeInstruction
} from '@/types/treatment-management';

export class TreatmentManagementService {

  static generateMedicationSuggestions(
    condition: string,
    patientData: any,
    currentMedications: string[] = [],
    allergies: string[] = []
  ): MedicationSuggestion[] {
    const medicationDatabase = this.getMedicationDatabase();
    const conditionMedications = medicationDatabase[condition.toLowerCase()] || [];
    
    return conditionMedications.map(medication => {
      const interactions = this.checkDrugInteractions(medication.name, currentMedications);
      const contraindicated = this.isContraindicated(medication, patientData, allergies);
      const alternatives = this.getAlternativeMedications(medication, condition);
      
      return {
        medication,
        rationale: this.generateMedicationRationale(medication, condition),
        evidenceLevel: this.getMedicationEvidenceLevel(medication, condition),
        contraindicated,
        interactions,
        alternatives,
        monitoring: this.getMedicationMonitoring(medication)
      };
    });
  }

  static getTreatmentPathway(
    condition: string,
    severity: string,
    patientFactors: any
  ): TreatmentPathway {
    const pathways = this.getTreatmentPathways();
    const pathwayKey = `${condition.toLowerCase()}-${severity}`;
    
    return pathways[pathwayKey] || this.getDefaultTreatmentPathway(condition, severity);
  }

  static checkDrugInteractions(
    newMedication: string,
    currentMedications: string[]
  ): DrugInteraction[] {
    const interactionDatabase = this.getDrugInteractionDatabase();
    const interactions: DrugInteraction[] = [];
    
    currentMedications.forEach(currentMed => {
      const interactionKey = `${newMedication}-${currentMed}`;
      const reverseKey = `${currentMed}-${newMedication}`;
      
      const interaction = interactionDatabase[interactionKey] || interactionDatabase[reverseKey];
      if (interaction) {
        interactions.push(interaction);
      }
    });
    
    return interactions;
  }

  static generateDischargePlan(
    patientId: string,
    condition: string,
    treatmentReceived: any,
    currentMedications: Medication[]
  ): DischargePlan {
    const dischargeReadiness = this.assessDischargeReadiness(patientId, condition);
    const instructions = this.generateDischargeInstructions(condition, treatmentReceived);
    const followUp = this.generateFollowUpPlan(condition, treatmentReceived);
    
    // Determine continuing vs new medications based on duration
    const continuingMedications = currentMedications.filter(med => 
      med.duration.toLowerCase().includes('long term') || 
      med.duration.toLowerCase().includes('ongoing') ||
      med.duration.toLowerCase().includes('chronic')
    );
    
    const newPrescriptions = currentMedications.filter(med => 
      !med.duration.toLowerCase().includes('long term') && 
      !med.duration.toLowerCase().includes('ongoing') &&
      !med.duration.toLowerCase().includes('chronic')
    );
    
    return {
      planId: `discharge-${patientId}-${Date.now()}`,
      patientId,
      condition,
      dischargeReadiness,
      medications: {
        continuing: continuingMedications,
        newPrescriptions: newPrescriptions,
        discontinued: [],
        changes: []
      },
      instructions,
      followUp,
      warningSigns: this.getWarningSignsForCondition(condition),
      emergencyContact: '911 or return to Emergency Department',
      estimatedRecoveryTime: this.getEstimatedRecoveryTime(condition)
    };
  }

  static generateTreatmentRecommendation(
    condition: string,
    severity: string,
    patientData: any,
    differentialDiagnoses: any[]
  ): TreatmentRecommendation {
    const medicationSuggestions = this.generateMedicationSuggestions(
      condition,
      patientData,
      patientData.currentMedications || [],
      patientData.allergies || []
    );
    
    const treatmentPathway = this.getTreatmentPathway(condition, severity, patientData);
    const nonPharmacological = this.getNonPharmacologicalTreatments(condition);
    const lifestyle = this.getLifestyleRecommendations(condition);
    const prognosis = this.getPrognosisInformation(condition, severity, patientData);
    const complications = this.getComplicationInformation(condition);
    
    return {
      condition,
      severity,
      medicationSuggestions,
      treatmentPathway,
      nonPharmacological,
      lifestyle,
      prognosis,
      complications
    };
  }

  // Private helper methods
  private static getMedicationDatabase(): Record<string, Medication[]> {
    return {
      'chest pain': [
        {
          id: 'aspirin-chest-pain',
          name: 'Aspirin',
          genericName: 'Acetylsalicylic acid',
          brandName: 'Bayer',
          dosage: '75-100mg',
          frequency: 'Once daily',
          route: 'oral',
          duration: 'Long term',
          indication: 'Cardioprotection',
          category: 'anticoagulant',
          cost: 'low',
          sideEffects: ['GI bleeding', 'Dyspepsia', 'Tinnitus'],
          contraindications: ['Active bleeding', 'Severe hepatic impairment'],
          monitoring: ['Signs of bleeding', 'Platelet count']
        },
        {
          id: 'atorvastatin-chest-pain',
          name: 'Atorvastatin',
          genericName: 'Atorvastatin',
          brandName: 'Lipitor',
          dosage: '20-80mg',
          frequency: 'Once daily',
          route: 'oral',
          duration: 'Long term',
          indication: 'Cholesterol management',
          category: 'other',
          cost: 'moderate',
          sideEffects: ['Myalgia', 'Elevated liver enzymes'],
          contraindications: ['Active liver disease', 'Pregnancy'],
          monitoring: ['Liver function', 'Creatine kinase']
        }
      ],
      'hypertension': [
        {
          id: 'lisinopril-htn',
          name: 'Lisinopril',
          genericName: 'Lisinopril',
          dosage: '5-40mg',
          frequency: 'Once daily',
          route: 'oral',
          duration: 'Long term',
          indication: 'Hypertension',
          category: 'antihypertensive',
          cost: 'low',
          sideEffects: ['Dry cough', 'Hyperkalemia', 'Angioedema'],
          contraindications: ['Pregnancy', 'Bilateral renal artery stenosis'],
          monitoring: ['Blood pressure', 'Renal function', 'Potassium']
        }
      ]
    };
  }

  private static getDrugInteractionDatabase(): Record<string, DrugInteraction> {
    return {
      'aspirin-warfarin': {
        drug1: 'Aspirin',
        drug2: 'Warfarin',
        severity: 'major',
        description: 'Increased risk of bleeding',
        mechanism: 'Additive anticoagulant effects',
        clinicalEffect: 'Significantly increased bleeding risk',
        management: 'Monitor INR closely, consider PPI',
        alternatives: ['Clopidogrel instead of aspirin']
      },
      'lisinopril-spironolactone': {
        drug1: 'Lisinopril',
        drug2: 'Spironolactone',
        severity: 'moderate',
        description: 'Risk of hyperkalemia',
        mechanism: 'Both drugs increase potassium',
        clinicalEffect: 'Elevated serum potassium',
        management: 'Monitor potassium levels regularly',
        alternatives: ['Alternative diuretic']
      }
    };
  }

  private static getTreatmentPathways(): Record<string, TreatmentPathway> {
    return {
      'chest pain-moderate': {
        pathwayId: 'chest-pain-moderate',
        condition: 'Chest Pain',
        severity: 'moderate',
        evidenceLevel: 'A',
        guidelineSource: 'AHA/ACC 2021 Guidelines',
        firstLineTherapy: {
          medications: [
            {
              id: 'aspirin-chest-pain',
              name: 'Aspirin',
              genericName: 'Acetylsalicylic acid',
              dosage: '75mg',
              frequency: 'Once daily',
              route: 'oral',
              duration: 'Long term',
              indication: 'Cardioprotection',
              category: 'anticoagulant',
              cost: 'low',
              sideEffects: ['GI bleeding'],
              contraindications: ['Active bleeding'],
              monitoring: ['Signs of bleeding']
            }
          ],
          nonPharmacological: ['Lifestyle modification', 'Cardiac rehabilitation'],
          duration: '3-6 months initial',
          monitoringRequired: ['Blood pressure', 'Lipid profile', 'Renal function'],
          successCriteria: ['Symptom resolution', 'Improved exercise tolerance']
        },
        specialistReferral: {
          criteria: ['Persistent symptoms', 'Abnormal stress test'],
          urgency: 'routine',
          specialty: 'Cardiology'
        }
      }
    };
  }

  private static generateMedicationRationale(medication: Medication, condition: string): string {
    const rationales: Record<string, string> = {
      'aspirin': 'Proven cardioprotective effects and stroke prevention',
      'lisinopril': 'First-line antihypertensive with cardiovascular benefits',
      'atorvastatin': 'Effective cholesterol reduction and plaque stabilization'
    };
    return rationales[medication.genericName.toLowerCase()] || 'Evidence-based therapy for condition';
  }

  private static getMedicationEvidenceLevel(medication: Medication, condition: string): 'A' | 'B' | 'C' | 'D' {
    // Simplified evidence level assignment
    const highEvidenceMeds = ['aspirin', 'lisinopril', 'atorvastatin'];
    return highEvidenceMeds.includes(medication.genericName.toLowerCase()) ? 'A' : 'B';
  }

  private static isContraindicated(medication: Medication, patientData: any, allergies: string[]): boolean {
    // Check allergies
    if (allergies.some(allergy => 
      medication.name.toLowerCase().includes(allergy.toLowerCase()) ||
      medication.genericName.toLowerCase().includes(allergy.toLowerCase())
    )) {
      return true;
    }
    
    // Check medical conditions against contraindications
    const patientConditions = patientData.medicalHistory || [];
    return medication.contraindications.some(contraindication =>
      patientConditions.some((condition: string) =>
        condition.toLowerCase().includes(contraindication.toLowerCase())
      )
    );
  }

  private static getAlternativeMedications(medication: Medication, condition: string): Medication[] {
    // Simplified alternative medication logic
    return [];
  }

  private static getMedicationMonitoring(medication: Medication) {
    return {
      parameters: medication.monitoring,
      frequency: 'Monthly initially, then every 3 months',
      duration: 'Ongoing while on therapy'
    };
  }

  private static getDefaultTreatmentPathway(condition: string, severity: string): TreatmentPathway {
    return {
      pathwayId: `${condition}-${severity}-default`,
      condition,
      severity: severity as any,
      evidenceLevel: 'C',
      guidelineSource: 'Clinical consensus',
      firstLineTherapy: {
        medications: [],
        nonPharmacological: ['Conservative management', 'Lifestyle modification'],
        duration: '4-6 weeks',
        monitoringRequired: ['Clinical assessment'],
        successCriteria: ['Symptom improvement']
      }
    };
  }

  private static assessDischargeReadiness(patientId: string, condition: string) {
    // Simplified discharge readiness assessment
    return {
      clinicalStability: true,
      painControlled: true,
      ableToEat: true,
      mobilizing: true,
      socialSupport: true,
      followUpArranged: true
    };
  }

  private static generateDischargeInstructions(condition: string, treatment: any): DischargeInstruction[] {
    return [
      {
        category: 'medication',
        instruction: 'Take medications as prescribed',
        importance: 'critical'
      },
      {
        category: 'activity',
        instruction: 'Gradually increase activity as tolerated',
        importance: 'important'
      },
      {
        category: 'follow-up',
        instruction: 'Attend scheduled follow-up appointments',
        importance: 'critical'
      }
    ];
  }

  private static generateFollowUpPlan(condition: string, treatment: any) {
    return {
      primaryCare: {
        timeframe: '1-2 weeks',
        purpose: 'Clinical review and medication adjustment',
        urgency: 'routine' as const
      }
    };
  }

  private static getWarningSignsForCondition(condition: string): string[] {
    const warningSigns: Record<string, string[]> = {
      'chest pain': [
        'Severe chest pain',
        'Shortness of breath',
        'Nausea or vomiting',
        'Sweating'
      ],
      'hypertension': [
        'Severe headache',
        'Vision changes',
        'Chest pain',
        'Difficulty breathing'
      ]
    };
    return warningSigns[condition.toLowerCase()] || ['Worsening symptoms', 'New concerning symptoms'];
  }

  private static getEstimatedRecoveryTime(condition: string): string {
    const recoveryTimes: Record<string, string> = {
      'chest pain': '2-4 weeks for stabilization',
      'hypertension': 'Ongoing management required'
    };
    return recoveryTimes[condition.toLowerCase()] || '2-6 weeks';
  }

  private static getNonPharmacologicalTreatments(condition: string): string[] {
    const treatments: Record<string, string[]> = {
      'chest pain': ['Cardiac rehabilitation', 'Stress management', 'Exercise program'],
      'hypertension': ['Weight loss', 'Sodium restriction', 'Regular exercise']
    };
    return treatments[condition.toLowerCase()] || ['Lifestyle modification', 'Physical therapy'];
  }

  private static getLifestyleRecommendations(condition: string): string[] {
    const recommendations: Record<string, string[]> = {
      'chest pain': ['Smoking cessation', 'Heart-healthy diet', 'Regular exercise'],
      'hypertension': ['Low sodium diet', 'Weight management', 'Limit alcohol']
    };
    return recommendations[condition.toLowerCase()] || ['Healthy diet', 'Regular exercise', 'Adequate sleep'];
  }

  private static getPrognosisInformation(condition: string, severity: string, patientData: any) {
    return {
      shortTerm: 'Good with appropriate treatment',
      longTerm: 'Excellent with lifestyle modifications',
      factors: ['Compliance with therapy', 'Lifestyle changes', 'Regular monitoring']
    };
  }

  private static getComplicationInformation(condition: string) {
    return {
      potential: ['Disease progression', 'Medication side effects'],
      prevention: ['Regular monitoring', 'Lifestyle modifications'],
      monitoring: ['Regular clinical assessment', 'Laboratory monitoring']
    };
  }
}
