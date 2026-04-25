// ABOUTME: Centralized fallback data service for AI responses
// ABOUTME: Provides mock questions, diagnoses, and clinical support when AI fails

import { Question, DifferentialDiagnosis } from '@/types/medical';
import { InvestigationRecommendation, RedFlag, ClinicalGuideline } from '@/types/medical';

// Helper function to generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export class FallbackDataService {
  static getFallbackQuestions(chiefComplaint: string): Question[] {
    const fallbackQuestions: Record<string, Question[]> = {
      'headache': [
        {
          id: generateUUID(),
          text: 'How did the headache begin?',
          type: 'multiple-choice',
          options: ['Suddenly', 'Gradually', 'After eating', 'After injury', 'Woke up with it'],
          category: 'onset',
          required: true
        },
        {
          id: generateUUID(),
          text: 'On a scale of 1-10, how severe is the pain?',
          type: 'scale',
          category: 'severity',
          required: true
        },
        {
          id: generateUUID(),
          text: 'Where is the headache located?',
          type: 'multiple-choice',
          options: ['Frontal', 'Temporal', 'Occipital', 'Whole head', 'One side'],
          category: 'location',
          required: true
        },
        {
          id: generateUUID(),
          text: 'How would you describe the pain?',
          type: 'multiple-choice',
          options: ['Throbbing', 'Sharp', 'Dull', 'Burning', 'Pressure'],
          category: 'quality',
          required: true
        }
      ],
      'fatigue': [
        {
          id: generateUUID(),
          text: 'When did the fatigue begin?',
          type: 'multiple-choice',
          options: ['Days ago', 'Weeks ago', 'Months ago', 'Gradually over time', 'Suddenly'],
          category: 'onset',
          required: true
        },
        {
          id: generateUUID(),
          text: 'On a scale of 1-10, how severe is the fatigue?',
          type: 'scale',
          category: 'severity',
          required: true
        },
        {
          id: generateUUID(),
          text: 'What is the pattern of your fatigue?',
          type: 'multiple-choice',
          options: ['Constant throughout the day', 'Worse in morning', 'Worse in evening', 'Comes and goes', 'After activities'],
          category: 'timing',
          required: true
        },
        {
          id: generateUUID(),
          text: 'How is your sleep quality?',
          type: 'multiple-choice',
          options: ['Good, restful sleep', 'Difficulty falling asleep', 'Frequent awakening', 'Early morning awakening', 'Unrefreshing sleep'],
          category: 'associated',
          required: true
        }
      ],
      'chest pain': [
        {
          id: generateUUID(),
          text: 'How did the chest pain begin?',
          type: 'multiple-choice',
          options: ['Suddenly', 'Gradually', 'During exercise', 'At rest', 'While eating'],
          category: 'onset',
          required: true
        },
        {
          id: generateUUID(),
          text: 'On a scale of 1-10, how severe is the pain?',
          type: 'scale',
          category: 'severity',
          required: true
        },
        {
          id: generateUUID(),
          text: 'Where exactly is the chest pain?',
          type: 'multiple-choice',
          options: ['Center of chest', 'Left side', 'Right side', 'Under breastbone', 'Whole chest'],
          category: 'location',
          required: true
        },
        {
          id: generateUUID(),
          text: 'How would you describe the pain?',
          type: 'multiple-choice',
          options: ['Sharp', 'Crushing', 'Burning', 'Stabbing', 'Pressure', 'Tight'],
          category: 'quality',
          required: true
        }
      ]
    };

    const complaint = chiefComplaint.toLowerCase();
    
    // Try exact match first
    let questions = fallbackQuestions[complaint];
    
    // If no exact match, try partial matches
    if (!questions) {
      const matchingKey = Object.keys(fallbackQuestions).find(key => 
        complaint.includes(key) || key.includes(complaint)
      );
      questions = matchingKey ? fallbackQuestions[matchingKey] : null;
    }
    
    // If still no match, use generic questions based on symptoms
    if (!questions) {
      if (complaint.includes('pain')) {
        questions = fallbackQuestions['chest pain'];
      } else if (complaint.includes('tired') || complaint.includes('weak')) {
        questions = fallbackQuestions['fatigue'];
      } else {
        questions = fallbackQuestions['fatigue']; // Default fallback
      }
    }
    
    return questions || [];
  }

  static getFallbackDifferentials(chiefComplaint: string): DifferentialDiagnosis[] {
    const mockDiagnoses: Record<string, DifferentialDiagnosis[]> = {
      'headache': [
        {
          condition: 'Subarachnoid Hemorrhage',
          probability: 5,
          explanation: 'Critical "do not miss" diagnosis. Often presents as thunderclap headache.',
          keyFeatures: ['Worst headache of life', 'Sudden onset', 'Meningismus']
        },
        {
          condition: 'Meningitis',
          probability: 10,
          explanation: 'Infectious emergency requiring prompt antibiotics.',
          keyFeatures: ['Fever', 'Neck stiffness', 'Photophobia']
        },
        {
          condition: 'Migraine or Tension Headache',
          probability: 85,
          explanation: 'Most common causes of headache, but must rule out red flags first.',
          keyFeatures: ['Throbbing or pressure', 'Gradual onset', 'History of similar headaches']
        }
      ],
      'fatigue': [
        {
          condition: 'Anemia / Occult Bleeding',
          probability: 30,
          explanation: 'Must rule out GI bleed or severe anemia in worsening fatigue.',
          keyFeatures: ['Pallor', 'Tachycardia', 'Melena or heavy menses']
        },
        {
          condition: 'Endocrine (Hypothyroidism / Adrenal Insufficiency)',
          probability: 20,
          explanation: 'Systemic causes of severe fatigue.',
          keyFeatures: ['Weight changes', 'Cold intolerance', 'Hypotension']
        },
        {
          condition: 'Viral Syndrome / Post-viral Fatigue',
          probability: 50,
          explanation: 'Common benign cause of generalized fatigue.',
          keyFeatures: ['Recent illness', 'Myalgias', 'Self-limiting']
        }
      ],
      'chest pain': [
        {
          condition: 'Acute Coronary Syndrome (ACS)',
          probability: 40,
          explanation: 'Critical emergency. Always assume ACS until proven otherwise.',
          keyFeatures: ['Crushing or pressure-like pain', 'Radiation to jaw/arm', 'Diaphoresis']
        },
        {
          condition: 'Pulmonary Embolism (PE)',
          probability: 20,
          explanation: 'Life-threatening vascular occlusion.',
          keyFeatures: ['Sudden onset', 'Pleuritic pain', 'Shortness of breath', 'Tachycardia']
        },
        {
          condition: 'Aortic Dissection',
          probability: 5,
          explanation: 'Highly fatal if missed. Tearing sensation.',
          keyFeatures: ['Tearing pain', 'Radiation to back', 'Unequal pulses']
        },
        {
          condition: 'Musculoskeletal / GERD',
          probability: 35,
          explanation: 'Common benign causes, diagnoses of exclusion.',
          keyFeatures: ['Reproducible pain', 'Burning sensation', 'Related to meals or movement']
        }
      ]
    };

    const complaint = chiefComplaint.toLowerCase();
    
    // Try exact match first
    let diagnoses = mockDiagnoses[complaint];
    
    // If no exact match, try partial matches
    if (!diagnoses) {
      const matchingKey = Object.keys(mockDiagnoses).find(key => 
        complaint.includes(key) || key.includes(complaint)
      );
      diagnoses = matchingKey ? mockDiagnoses[matchingKey] : null;
    }

    const results = diagnoses || mockDiagnoses['fatigue']; // Default to systemic
    return results.map((d: DifferentialDiagnosis) => ({
      ...d,
      guidelineCitation: 'Standard Clinical Guidelines',
      statOrders: ['Clinical evaluation', 'Vital signs monitoring']
    })) as DifferentialDiagnosis[];
  }

  static getFallbackInvestigations(chiefComplaint: string): InvestigationRecommendation[] {
    const mockInvestigations: Record<string, InvestigationRecommendation[]> = {
      'chest pain': [
        {
          investigation: {
            id: 'ecg',
            name: 'ECG',
            type: 'cardiac',
            category: 'Cardiac',
            indication: 'Rule out acute coronary syndrome',
            urgency: 'stat',
            cost: 'low',
            rationale: 'Essential for detecting acute ST changes or arrhythmias'
          },
          priority: 1,
          clinicalRationale: 'First-line investigation for chest pain to rule out MI'
        }
      ],
      'fatigue': [
        {
          investigation: {
            id: 'fbc',
            name: 'Full Blood Count',
            type: 'laboratory',
            category: 'Hematology',
            indication: 'Screen for anemia, infection',
            urgency: 'routine',
            cost: 'low',
            rationale: 'Common cause of fatigue is anemia'
          },
          priority: 1,
          clinicalRationale: 'Anemia is a common reversible cause of fatigue'
        }
      ]
    };

    const complaint = chiefComplaint.toLowerCase();
    return mockInvestigations[complaint] || mockInvestigations['fatigue'];
  }

  static getFallbackRedFlags(chiefComplaint: string): RedFlag[] {
    const complaint = chiefComplaint.toLowerCase();

    if (complaint.includes('chest pain')) {
      return [
        {
          condition: 'Suspected ACS or PE',
          severity: 'high',
          description: 'Any new onset chest pain requires immediate cardiac evaluation to rule out fatal etiologies.',
          immediateActions: ['Obtain STAT ECG', 'Activate emergency response if unstable', 'Consider Aspirin if no contraindications']
        }
      ];
    }

    if (complaint.includes('headache')) {
      return [
        {
          condition: 'Suspected Subarachnoid Hemorrhage or Infection',
          severity: 'high',
          description: 'Thunderclap onset, fever, or neurologic deficits require emergent imaging.',
          immediateActions: ['Urgent Non-con CT Head', 'Neurologic exam', 'Vital signs monitoring']
        }
      ];
    }

    return [
      {
        condition: 'Vital Sign Instability',
        severity: 'high',
        description: 'Patient requires immediate clinical evaluation for hemodynamic stability.',
        immediateActions: ['Urgent physician review', 'Check ABCs (Airway, Breathing, Circulation)', 'Continuous monitoring']
      }
    ];
  }

  static getFallbackGuidelines(chiefComplaint: string): ClinicalGuideline[] {
    return [
      {
        title: 'Standard Clinical Assessment',
        source: 'Clinical Best Practice',
        recommendation: 'Comprehensive history and physical examination required',
        evidenceLevel: 'C',
        applicableConditions: [chiefComplaint]
      }
    ];
  }
}