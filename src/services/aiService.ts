// ABOUTME: AI service for clinical question generation and differential diagnosis
// ABOUTME: Uses OpenRouter API through Supabase Edge Functions for real AI capabilities
import { supabase } from '@/integrations/supabase/client';
import { Question, DifferentialDiagnosis, AdvancedClinicalSupport } from '@/types/medical';
import { ClinicalScoringService } from '@/services/clinicalScoringService';

export class AIService {
  // Comprehensive fallback questions for different chief complaints
  private static fallbackQuestions: Record<string, Question[]> = {
    'headache': [
      {
        id: 'head_onset',
        text: 'How did the headache begin?',
        type: 'multiple-choice',
        options: ['Suddenly', 'Gradually', 'After eating', 'After injury', 'Woke up with it'],
        category: 'onset',
        required: true
      },
      {
        id: 'head_severity',
        text: 'On a scale of 1-10, how severe is the pain?',
        type: 'scale',
        category: 'severity',
        required: true
      },
      {
        id: 'head_location',
        text: 'Where is the headache located?',
        type: 'multiple-choice',
        options: ['Frontal', 'Temporal', 'Occipital', 'Whole head', 'One side'],
        category: 'location',
        required: true
      },
      {
        id: 'head_quality',
        text: 'How would you describe the pain?',
        type: 'multiple-choice',
        options: ['Throbbing', 'Sharp', 'Dull', 'Burning', 'Pressure'],
        category: 'quality',
        required: true
      }
    ],
    'fatigue': [
      {
        id: 'fatigue_onset',
        text: 'When did the fatigue begin?',
        type: 'multiple-choice',
        options: ['Days ago', 'Weeks ago', 'Months ago', 'Gradually over time', 'Suddenly'],
        category: 'onset',
        required: true
      },
      {
        id: 'fatigue_severity',
        text: 'On a scale of 1-10, how severe is the fatigue?',
        type: 'scale',
        category: 'severity',
        required: true
      },
      {
        id: 'fatigue_pattern',
        text: 'What is the pattern of your fatigue?',
        type: 'multiple-choice',
        options: ['Constant throughout the day', 'Worse in morning', 'Worse in evening', 'Comes and goes', 'After activities'],
        category: 'timing',
        required: true
      },
      {
        id: 'fatigue_sleep',
        text: 'How is your sleep quality?',
        type: 'multiple-choice',
        options: ['Good, restful sleep', 'Difficulty falling asleep', 'Frequent awakening', 'Early morning awakening', 'Unrefreshing sleep'],
        category: 'associated',
        required: true
      },
      {
        id: 'fatigue_activity',
        text: 'How does the fatigue affect your daily activities?',
        type: 'multiple-choice',
        options: ['No impact', 'Mild impact', 'Moderate impact', 'Severe impact', 'Unable to perform activities'],
        category: 'severity',
        required: true
      }
    ],
    'chest pain': [
      {
        id: 'chest_onset',
        text: 'How did the chest pain begin?',
        type: 'multiple-choice',
        options: ['Suddenly', 'Gradually', 'During exercise', 'At rest', 'While eating'],
        category: 'onset',
        required: true
      },
      {
        id: 'chest_severity',
        text: 'On a scale of 1-10, how severe is the pain?',
        type: 'scale',
        category: 'severity',
        required: true
      },
      {
        id: 'chest_location',
        text: 'Where exactly is the chest pain?',
        type: 'multiple-choice',
        options: ['Center of chest', 'Left side', 'Right side', 'Under breastbone', 'Whole chest'],
        category: 'location',
        required: true
      },
      {
        id: 'chest_quality',
        text: 'How would you describe the pain?',
        type: 'multiple-choice',
        options: ['Sharp', 'Crushing', 'Burning', 'Stabbing', 'Pressure', 'Tight'],
        category: 'quality',
        required: true
      },
      {
        id: 'chest_radiation',
        text: 'Does the pain spread anywhere else?',
        type: 'multiple-choice',
        options: ['No radiation', 'Left arm', 'Right arm', 'Both arms', 'Neck', 'Jaw', 'Back'],
        category: 'radiation',
        required: true
      }
    ],
    'abdominal pain': [
      {
        id: 'abd_onset',
        text: 'How did the pain begin?',
        type: 'multiple-choice',
        options: ['Suddenly', 'Gradually', 'After eating', 'After injury', 'Woke up with it'],
        category: 'onset',
        required: true
      },
      {
        id: 'abd_location',
        text: 'Where is the pain located?',
        type: 'multiple-choice',
        options: ['Right upper', 'Left upper', 'Right lower', 'Left lower', 'Central', 'Whole abdomen'],
        category: 'location',
        required: true
      },
      {
        id: 'abd_severity',
        text: 'On a scale of 1-10, how severe is the pain?',
        type: 'scale',
        category: 'severity',
        required: true
      },
      {
        id: 'abd_quality',
        text: 'How would you describe the pain?',
        type: 'multiple-choice',
        options: ['Cramping', 'Sharp', 'Dull', 'Burning', 'Stabbing'],
        category: 'quality',
        required: true
      }
    ],
    'shortness of breath': [
      {
        id: 'sob_onset',
        text: 'When did the shortness of breath begin?',
        type: 'multiple-choice',
        options: ['Suddenly', 'Gradually over days', 'Gradually over weeks', 'With activity', 'At rest'],
        category: 'onset',
        required: true
      },
      {
        id: 'sob_severity',
        text: 'On a scale of 1-10, how severe is the shortness of breath?',
        type: 'scale',
        category: 'severity',
        required: true
      },
      {
        id: 'sob_triggers',
        text: 'What triggers the shortness of breath?',
        type: 'multiple-choice',
        options: ['Exercise', 'Lying down', 'Walking', 'Climbing stairs', 'At rest', 'No specific trigger'],
        category: 'triggers',
        required: true
      },
      {
        id: 'sob_associated',
        text: 'Any associated symptoms?',
        type: 'multiple-choice',
        options: ['None', 'Chest pain', 'Cough', 'Wheezing', 'Swelling in legs', 'Palpitations'],
        category: 'associated',
        required: true
      }
    ],
    'nausea/vomiting': [
      {
        id: 'nausea_onset',
        text: 'When did the nausea/vomiting begin?',
        type: 'multiple-choice',
        options: ['Hours ago', 'Yesterday', 'Days ago', 'After eating', 'Gradually'],
        category: 'onset',
        required: true
      },
      {
        id: 'nausea_severity',
        text: 'On a scale of 1-10, how severe is the nausea?',
        type: 'scale',
        category: 'severity',
        required: true
      },
      {
        id: 'nausea_pattern',
        text: 'What is the pattern?',
        type: 'multiple-choice',
        options: ['Constant nausea', 'Comes and goes', 'Only with eating', 'Only in morning', 'Only at night'],
        category: 'timing',
        required: true
      },
      {
        id: 'nausea_vomiting',
        text: 'Are you vomiting?',
        type: 'multiple-choice',
        options: ['No vomiting', 'Occasional vomiting', 'Frequent vomiting', 'Unable to keep anything down'],
        category: 'associated',
        required: true
      }
    ],
    'fever': [
      {
        id: 'fever_onset',
        text: 'When did the fever begin?',
        type: 'multiple-choice',
        options: ['Today', 'Yesterday', 'Days ago', 'Gradually', 'Suddenly'],
        category: 'onset',
        required: true
      },
      {
        id: 'fever_severity',
        text: 'What is your highest recorded temperature?',
        type: 'multiple-choice',
        options: ['Under 100°F', '100-101°F', '101-102°F', '102-103°F', 'Over 103°F', 'Not measured'],
        category: 'severity',
        required: true
      },
      {
        id: 'fever_pattern',
        text: 'What is the fever pattern?',
        type: 'multiple-choice',
        options: ['Constant', 'Comes and goes', 'Worse at night', 'Worse during day', 'With chills'],
        category: 'timing',
        required: true
      },
      {
        id: 'fever_associated',
        text: 'Any associated symptoms?',
        type: 'multiple-choice',
        options: ['None', 'Headache', 'Body aches', 'Cough', 'Sore throat', 'Abdominal pain'],
        category: 'associated',
        required: true
      }
    ],
    'dizziness': [
      {
        id: 'dizzy_onset',
        text: 'When did the dizziness begin?',
        type: 'multiple-choice',
        options: ['Minutes ago', 'Hours ago', 'Days ago', 'Comes and goes', 'Gradually'],
        category: 'onset',
        required: true
      },
      {
        id: 'dizzy_type',
        text: 'How would you describe the dizziness?',
        type: 'multiple-choice',
        options: ['Room spinning', 'Lightheadedness', 'Unsteadiness', 'About to faint', 'Off balance'],
        category: 'quality',
        required: true
      },
      {
        id: 'dizzy_triggers',
        text: 'What triggers the dizziness?',
        type: 'multiple-choice',
        options: ['Standing up', 'Moving head', 'Lying down', 'Walking', 'No specific trigger'],
        category: 'triggers',
        required: true
      },
      {
        id: 'dizzy_severity',
        text: 'On a scale of 1-10, how severe is the dizziness?',
        type: 'scale',
        category: 'severity',
        required: true
      }
    ]
  };

  static async generateQuestions(
    chiefComplaint: string, 
    previousAnswers?: Record<string, any>
  ): Promise<Question[]> {
    try {
      console.log(`AIService: Generating questions for chief complaint: "${chiefComplaint}"`);
      
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          action: 'generate-questions',
          chiefComplaint,
          previousAnswers
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Supabase function error: ${error.message}`);
      }

      if (!data?.questions) {
        console.error('Invalid response from AI service:', data);
        throw new Error('Invalid response from AI service');
      }

      console.log(`AIService: Successfully generated ${data.questions.length} AI questions for: ${chiefComplaint}`);
      return data.questions;

    } catch (error) {
      console.error('Error generating AI questions:', error);
      console.log(`AIService: Falling back to predefined questions for: ${chiefComplaint}`);
      
      // Use complaint-specific fallback questions
      const complaint = chiefComplaint.toLowerCase();
      
      // Try exact match first
      let questions = this.fallbackQuestions[complaint];
      
      // If no exact match, try partial matches
      if (!questions) {
        const matchingKey = Object.keys(this.fallbackQuestions).find(key => 
          complaint.includes(key) || key.includes(complaint)
        );
        questions = matchingKey ? this.fallbackQuestions[matchingKey] : null;
      }
      
      // If still no match, use generic questions based on common symptoms
      if (!questions) {
        if (complaint.includes('pain')) {
          questions = this.fallbackQuestions['abdominal pain'];
        } else if (complaint.includes('tired') || complaint.includes('weak')) {
          questions = this.fallbackQuestions['fatigue'];
        } else if (complaint.includes('breath')) {
          questions = this.fallbackQuestions['shortness of breath'];
        } else if (complaint.includes('sick') || complaint.includes('nausea')) {
          questions = this.fallbackQuestions['nausea/vomiting'];
        } else {
          // Last resort: use fatigue questions as they're more generic
          questions = this.fallbackQuestions['fatigue'];
        }
      }
      
      console.log(`AIService: Using ${questions.length} fallback questions for: ${chiefComplaint}`);
      return questions;
    }
  }

  static async generateDifferentialDiagnosis(
    chiefComplaint: string,
    answers: Record<string, any>,
    rosData?: Record<string, any>
  ): Promise<DifferentialDiagnosis[]> {
    try {
      console.log(`Generating AI differential diagnosis for: ${chiefComplaint}`);
      
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          action: 'generate-differential',
          chiefComplaint,
          answers,
          rosData
        }
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      if (!data?.differentials) {
        throw new Error('Invalid response from AI service');
      }

      console.log(`AI generated ${data.differentials.length} differential diagnoses`);
      return data.differentials;

    } catch (error) {
      console.error('Error generating AI differential diagnosis:', error);
      console.log('Falling back to mock differentials');
      
      // Fallback to mock diagnoses
      const mockDiagnoses: Record<string, DifferentialDiagnosis[]> = {
        'headache': [
          {
            condition: 'Tension-type headache',
            probability: 65,
            explanation: 'Most common type of headache, typically bilateral and pressing/tightening in quality',
            keyFeatures: ['Bilateral location', 'Pressure sensation', 'Gradual onset']
          },
          {
            condition: 'Migraine',
            probability: 25,
            explanation: 'Recurrent headache disorder with characteristic features',
            keyFeatures: ['Unilateral', 'Throbbing', 'Associated nausea']
          },
          {
            condition: 'Cluster headache',
            probability: 10,
            explanation: 'Severe unilateral headache with autonomic features',
            keyFeatures: ['Severe unilateral pain', 'Short duration', 'Autonomic symptoms']
          }
        ],
        'fatigue': [
          {
            condition: 'Viral syndrome',
            probability: 40,
            explanation: 'Common viral infection causing systemic fatigue',
            keyFeatures: ['Recent onset', 'Associated symptoms', 'Self-limiting']
          },
          {
            condition: 'Iron deficiency anemia',
            probability: 30,
            explanation: 'Common cause of chronic fatigue, especially in women',
            keyFeatures: ['Gradual onset', 'Exercise intolerance', 'Pale appearance']
          },
          {
            condition: 'Depression',
            probability: 20,
            explanation: 'Mood disorder commonly presenting with fatigue',
            keyFeatures: ['Mood changes', 'Sleep disturbance', 'Loss of interest']
          }
        ],
        'abdominal pain': [
          {
            condition: 'Gastroenteritis',
            probability: 40,
            explanation: 'Inflammation of the stomach and intestines, often viral or bacterial',
            keyFeatures: ['Cramping pain', 'Nausea/vomiting', 'Diarrhea']
          },
          {
            condition: 'Appendicitis',
            probability: 30,
            explanation: 'Inflammation of the appendix requiring urgent evaluation',
            keyFeatures: ['Right lower quadrant pain', 'Fever', 'Nausea']
          },
          {
            condition: 'Peptic ulcer disease',
            probability: 20,
            explanation: 'Ulceration in the stomach or duodenum',
            keyFeatures: ['Epigastric pain', 'Related to meals', 'Burning sensation']
          }
        ]
      };

      const complaint = chiefComplaint.toLowerCase();
      return mockDiagnoses[complaint] || mockDiagnoses['fatigue'];
    }
  }

  static async generateClinicalDecisionSupport(
    chiefComplaint: string,
    differentialDiagnoses: any[],
    answers: Record<string, any>,
    rosData?: Record<string, any>
  ): Promise<any> {
    try {
      console.log(`Generating clinical decision support for: ${chiefComplaint}`);
      
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          action: 'generate-clinical-support',
          chiefComplaint,
          differentialDiagnoses,
          answers,
          rosData
        }
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      if (!data?.clinicalSupport) {
        throw new Error('Invalid response from AI service');
      }

      console.log(`AI generated clinical decision support`);
      return data.clinicalSupport;

    } catch (error) {
      console.error('Error generating clinical decision support:', error);
      console.log('Falling back to mock clinical support');
      
      // Fallback to mock clinical support
      const mockSupport: any = {
        investigations: this.getMockInvestigations(chiefComplaint),
        redFlags: this.getMockRedFlags(chiefComplaint),
        guidelines: this.getMockGuidelines(chiefComplaint),
        treatmentRecommendations: [],
        followUpRecommendations: []
      };
      
      return mockSupport;
    }
  }

  static async generateAdvancedClinicalSupport(
    chiefComplaint: string,
    answers: Record<string, any>,
    rosData: Record<string, any>,
    vitalSigns?: any,
    demographics?: any
  ): Promise<AdvancedClinicalSupport> {
    try {
      console.log(`Generating advanced clinical support for: ${chiefComplaint}`);
      
      // Extract relevant data
      const age = demographics?.age || 50; // Default age if not provided
      const vitals = vitalSigns || {
        systolicBP: 120,
        diastolicBP: 80,
        heartRate: 80,
        respiratoryRate: 16,
        temperature: 37,
        oxygenSaturation: 98
      };

      // Calculate severity scores based on chief complaint and data
      const severityScores = this.calculateRelevantScores(chiefComplaint, answers, vitals, age);
      
      // Assess overall risk
      const riskAssessment = ClinicalScoringService.assessOverallRisk(
        age,
        vitals,
        this.extractComorbidities(rosData),
        Object.values(answers).map(a => String(a.value))
      );

      // Generate clinical alerts
      const clinicalAlerts = this.generateClinicalAlerts(chiefComplaint, answers, vitals, severityScores);

      // Generate triage recommendation
      const triageRecommendation = ClinicalScoringService.generateTriageRecommendation(
        riskAssessment.overallRisk,
        severityScores,
        clinicalAlerts
      );

      return {
        severityScores,
        riskAssessment,
        triageRecommendation,
        clinicalAlerts
      };

    } catch (error) {
      console.error('Error generating advanced clinical support:', error);
      
      // Return fallback support
      return this.getFallbackAdvancedSupport(chiefComplaint);
    }
  }

  private static calculateRelevantScores(
    chiefComplaint: string,
    answers: Record<string, any>,
    vitals: any,
    age: number
  ) {
    const scores = [];
    const complaint = chiefComplaint.toLowerCase();

    // qSOFA for sepsis risk
    if (complaint.includes('fever') || complaint.includes('infection') || complaint.includes('sepsis')) {
      const qsofa = ClinicalScoringService.calculateQSOFA(
        vitals.systolicBP,
        vitals.respiratoryRate,
        15 // Assume normal GCS unless indicated otherwise
      );
      scores.push(qsofa);
    }

    // CURB-65 for pneumonia
    if (complaint.includes('cough') || complaint.includes('pneumonia') || complaint.includes('chest')) {
      const curb65 = ClinicalScoringService.calculateCURB65(
        false, // Assume no confusion unless specified
        5, // Normal urea
        vitals.respiratoryRate,
        vitals.systolicBP,
        vitals.diastolicBP,
        age
      );
      scores.push(curb65);
    }

    // Wells Score for PE
    if (complaint.includes('chest pain') || complaint.includes('shortness of breath') || complaint.includes('breathless')) {
      const wellsPE = ClinicalScoringService.calculateWellsPE(
        true, // Assume clinical signs present
        true, // Alternative diagnosis likely
        vitals.heartRate,
        false, // No recent immobilization
        false, // No previous PE
        false, // No hemoptysis
        false // No active malignancy
      );
      scores.push(wellsPE);
    }

    return scores;
  }

  private static extractComorbidities(rosData: Record<string, any>): string[] {
    const comorbidities = [];
    
    // Extract from ROS data
    Object.entries(rosData).forEach(([system, data]: [string, any]) => {
      if (data.positive && Array.isArray(data.positive)) {
        comorbidities.push(...data.positive);
      }
    });

    return comorbidities;
  }

  private static generateClinicalAlerts(
    chiefComplaint: string,
    answers: Record<string, any>,
    vitals: any,
    severityScores: any[]
  ) {
    const alerts = [];

    // Vital signs alerts
    if (vitals.systolicBP < 90) {
      alerts.push({
        id: 'hypotension',
        type: 'critical',
        title: 'Critical Hypotension',
        message: 'Systolic BP < 90 mmHg indicates hemodynamic compromise',
        triggeredBy: ['vital signs'],
        actions: ['IV access', 'Fluid resuscitation', 'Urgent physician review']
      });
    }

    if (vitals.heartRate > 120) {
      alerts.push({
        id: 'tachycardia',
        type: 'warning',
        title: 'Significant Tachycardia',
        message: 'Heart rate > 120 bpm may indicate stress response or pathology',
        triggeredBy: ['vital signs'],
        actions: ['ECG', 'Continuous monitoring', 'Assess for underlying cause']
      });
    }

    if (vitals.oxygenSaturation < 92) {
      alerts.push({
        id: 'hypoxia',
        type: 'critical',
        title: 'Severe Hypoxia',
        message: 'Oxygen saturation < 92% requires immediate intervention',
        triggeredBy: ['vital signs'],
        actions: ['High-flow oxygen', 'ABG analysis', 'Consider ventilatory support']
      });
    }

    // High severity score alerts
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

  private static getMockInvestigations(chiefComplaint: string): any[] {
    const mockInvestigations: Record<string, any[]> = {
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
        },
        {
          investigation: {
            id: 'troponin',
            name: 'Troponin T/I',
            type: 'laboratory',
            category: 'Cardiac Markers',
            indication: 'Detect myocardial injury',
            urgency: 'stat',
            cost: 'moderate',
            rationale: 'Gold standard for myocardial injury detection'
          },
          priority: 2,
          clinicalRationale: 'Elevated troponin indicates myocardial injury'
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
        },
        {
          investigation: {
            id: 'tft',
            name: 'Thyroid Function Tests',
            type: 'laboratory',
            category: 'Endocrine',
            indication: 'Rule out thyroid dysfunction',
            urgency: 'routine',
            cost: 'moderate',
            rationale: 'Thyroid disorders commonly present with fatigue'
          },
          priority: 2,
          clinicalRationale: 'Both hypo- and hyperthyroidism can cause fatigue'
        }
      ]
    };

    const complaint = chiefComplaint.toLowerCase();
    return mockInvestigations[complaint] || mockInvestigations['fatigue'];
  }

  private static getMockRedFlags(chiefComplaint: string): any[] {
    const mockRedFlags: Record<string, any[]> = {
      'chest pain': [
        {
          condition: 'Acute Coronary Syndrome',
          severity: 'high',
          description: 'Chest pain with cardiovascular risk factors',
          immediateActions: ['Obtain ECG within 10 minutes', 'Start cardiac monitoring', 'Prepare for emergency intervention']
        }
      ],
      'fatigue': [
        {
          condition: 'Severe Anemia',
          severity: 'medium',
          description: 'Profound fatigue with possible hemodynamic compromise',
          immediateActions: ['Check vital signs', 'Urgent FBC', 'Consider blood transfusion if Hb <7g/dL']
        }
      ]
    };

    const complaint = chiefComplaint.toLowerCase();
    return mockRedFlags[complaint] || [];
  }

  private static getMockGuidelines(chiefComplaint: string): any[] {
    const mockGuidelines: Record<string, any[]> = {
      'chest pain': [
        {
          title: 'ESC Guidelines for Acute Coronary Syndromes',
          source: 'European Society of Cardiology 2023',
          recommendation: 'ECG should be performed within 10 minutes of presentation for all patients with chest pain',
          evidenceLevel: 'A',
          applicableConditions: ['Chest Pain', 'Acute Coronary Syndrome']
        }
      ],
      'fatigue': [
        {
          title: 'NICE Guidelines for Fatigue',
          source: 'NICE Clinical Knowledge Summary',
          recommendation: 'Initial investigations for unexplained fatigue should include FBC, ferritin, TFTs, and glucose',
          evidenceLevel: 'B',
          applicableConditions: ['Fatigue', 'Tiredness']
        }
      ]
    };

    const complaint = chiefComplaint.toLowerCase();
    return mockGuidelines[complaint] || [];
  }
}
