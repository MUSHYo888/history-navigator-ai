// ABOUTME: Service providing evidence-based clinical question templates for Phase 1 assessments
// ABOUTME: Contains structured question sets using clinical frameworks like SOCRATES for different chief complaints

import { Question } from '@/types/medical';

interface ClinicalQuestionTemplate {
  chiefComplaintPattern: RegExp;
  questions: Omit<Question, 'id'>[];
  framework: string;
  description: string;
}

export class ClinicalQuestionTemplateService {
  private static templates: ClinicalQuestionTemplate[] = [
    // Pain Complaints - SOCRATES Framework
    {
      chiefComplaintPattern: /pain|ache|hurt|sore|cramp|burning|sharp|dull/i,
      framework: 'SOCRATES',
      description: 'Systematic pain assessment using SOCRATES approach',
      questions: [
        {
          text: 'Where exactly is your pain located? Please point to or describe the specific area.',
          type: 'multiple-choice-with-text',
          options: [
            'Head/face', 'Neck', 'Chest', 'Abdomen', 'Back', 'Arms', 'Legs', 'Multiple areas'
          ],
          category: 'site',
          required: true,
          phase: 1,
          clinicalPriority: 1,
          questionRationale: 'Site: Anatomical location helps narrow differential diagnosis'
        },
        {
          text: 'When did your pain start? How did it begin?',
          type: 'multiple-choice-with-text',
          options: [
            'Sudden onset (seconds to minutes)', 'Gradual onset (hours)', 'Slow onset (days to weeks)',
            'After specific activity', 'Upon waking', 'During activity'
          ],
          category: 'onset',
          required: true,
          phase: 1,
          clinicalPriority: 1,
          redFlagIndicator: true,
          questionRationale: 'Onset: Sudden onset may indicate serious conditions requiring immediate evaluation'
        },
        {
          text: 'How would you describe the character of your pain?',
          type: 'multiple-choice-with-text',
          options: [
            'Sharp/stabbing', 'Dull/aching', 'Burning', 'Crushing/pressure', 
            'Throbbing/pulsating', 'Cramping', 'Electric/shooting'
          ],
          category: 'character',
          required: true,
          phase: 1,
          clinicalPriority: 2,
          questionRationale: 'Character: Pain quality provides clues about underlying pathophysiology'
        },
        {
          text: 'Does your pain spread or radiate to other areas?',
          type: 'multiple-choice-with-text',
          options: [
            'No radiation', 'Down arm(s)', 'To back', 'To jaw/neck', 
            'To groin/legs', 'Around chest/back', 'Up to shoulder'
          ],
          category: 'radiation',
          required: true,
          phase: 1,
          clinicalPriority: 2,
          redFlagIndicator: true,
          questionRationale: 'Radiation: Pain patterns help identify specific anatomical involvement'
        },
        {
          text: 'Do you have any symptoms along with the pain?',
          type: 'multiple-choice-with-text',
          options: [
            'Nausea/vomiting', 'Shortness of breath', 'Sweating', 'Dizziness', 
            'Fever/chills', 'Numbness/tingling', 'Weakness', 'No other symptoms'
          ],
          category: 'associated_symptoms',
          required: true,
          phase: 1,
          clinicalPriority: 1,
          redFlagIndicator: true,
          questionRationale: 'Associated symptoms: Can indicate systemic involvement or serious conditions'
        },
        {
          text: 'On a scale of 1-10, how severe is your pain right now?',
          type: 'scale',
          category: 'severity',
          required: true,
          phase: 1,
          clinicalPriority: 1,
          questionRationale: 'Severity: Helps assess urgency and guide analgesic management'
        }
      ]
    },

    // Respiratory Complaints
    {
      chiefComplaintPattern: /shortness of breath|sob|dyspn|cough|wheezing|chest tight|breathing/i,
      framework: 'Respiratory Assessment',
      description: 'Systematic respiratory symptom evaluation',
      questions: [
        {
          text: 'When did your breathing difficulty start?',
          type: 'multiple-choice-with-text',
          options: [
            'Sudden onset (minutes)', 'Gradual over hours', 'Gradual over days/weeks',
            'Chronic (months/years)', 'After specific trigger'
          ],
          category: 'onset',
          required: true,
          phase: 1,
          clinicalPriority: 1,
          redFlagIndicator: true,
          questionRationale: 'Onset: Sudden dyspnea may indicate PE, pneumothorax, or acute heart failure'
        },
        {
          text: 'What triggers or worsens your breathing difficulty?',
          type: 'multiple-choice-with-text',
          options: [
            'Physical exertion', 'Lying flat', 'Cold air/allergens', 'Stress/anxiety',
            'Certain positions', 'Nothing specific', 'At rest'
          ],
          category: 'triggers',
          required: true,
          phase: 1,
          clinicalPriority: 2,
          questionRationale: 'Triggers: Help differentiate cardiac, pulmonary, and other causes'
        },
        {
          text: 'Do you have a cough?',
          type: 'multiple-choice-with-text',
          options: [
            'No cough', 'Dry cough', 'Productive cough with sputum', 
            'Cough with blood', 'Chronic cough'
          ],
          category: 'associated_cough',
          required: true,
          phase: 1,
          clinicalPriority: 1,
          redFlagIndicator: true,
          questionRationale: 'Cough: Productive cough suggests infection, blood suggests serious pathology'
        },
        {
          text: 'Do you have chest pain along with breathing difficulty?',
          type: 'multiple-choice-with-text',
          options: [
            'No chest pain', 'Sharp chest pain with breathing', 'Crushing/pressure pain',
            'Pleuritic pain (worse with breathing)', 'Burning chest pain'
          ],
          category: 'chest_pain',
          required: true,
          phase: 1,
          clinicalPriority: 1,
          redFlagIndicator: true,
          questionRationale: 'Chest pain: May indicate MI, PE, pneumothorax, or pleural involvement'
        },
        {
          text: 'Rate your breathing difficulty on a scale of 1-10',
          type: 'scale',
          category: 'severity',
          required: true,
          phase: 1,
          clinicalPriority: 1,
          questionRationale: 'Severity: Helps assess urgency and need for immediate intervention'
        }
      ]
    },

    // Gastrointestinal Complaints
    {
      chiefComplaintPattern: /nausea|vomit|stomach|abdominal|belly|diarrhea|constip|gi|gastro/i,
      framework: 'GI Assessment',
      description: 'Systematic gastrointestinal symptom evaluation',
      questions: [
        {
          text: 'Where exactly is your abdominal discomfort located?',
          type: 'multiple-choice-with-text',
          options: [
            'Upper right abdomen', 'Upper left abdomen', 'Lower right abdomen',
            'Lower left abdomen', 'Central/around navel', 'Entire abdomen', 'Epigastric (upper middle)'
          ],
          category: 'location',
          required: true,
          phase: 1,
          clinicalPriority: 1,
          questionRationale: 'Location: Anatomical location helps narrow differential diagnosis'
        },
        {
          text: 'What is the nature of your bowel movements?',
          type: 'multiple-choice-with-text',
          options: [
            'Normal', 'Diarrhea (loose/watery)', 'Constipation', 'Blood in stool',
            'Black/tarry stools', 'Alternating diarrhea/constipation', 'Mucus in stool'
          ],
          category: 'bowel_pattern',
          required: true,
          phase: 1,
          clinicalPriority: 1,
          redFlagIndicator: true,
          questionRationale: 'Bowel changes: Blood or melena may indicate GI bleeding'
        },
        {
          text: 'Are you experiencing nausea or vomiting?',
          type: 'multiple-choice-with-text',
          options: [
            'No nausea/vomiting', 'Mild nausea only', 'Nausea with occasional vomiting',
            'Frequent vomiting', 'Vomiting with blood', 'Projectile vomiting'
          ],
          category: 'nausea_vomiting',
          required: true,
          phase: 1,
          clinicalPriority: 1,
          redFlagIndicator: true,
          questionRationale: 'Vomiting: Bloody vomit or projectile vomiting may indicate serious conditions'
        },
        {
          text: 'When did your symptoms start?',
          type: 'multiple-choice-with-text',
          options: [
            'Less than 6 hours ago', '6-24 hours ago', '1-3 days ago',
            'More than 3 days ago', 'Chronic (weeks/months)'
          ],
          category: 'timing',
          required: true,
          phase: 1,
          clinicalPriority: 1,
          questionRationale: 'Timing: Acute onset may require urgent evaluation'
        }
      ]
    },

    // Neurological Complaints
    {
      chiefComplaintPattern: /headache|dizziness|weakness|numbness|seizure|neuro|confused/i,
      framework: 'Neurological Assessment',
      description: 'Systematic neurological symptom evaluation',
      questions: [
        {
          text: 'Describe the onset of your symptoms',
          type: 'multiple-choice-with-text',
          options: [
            'Sudden onset (seconds to minutes)', 'Rapid onset (minutes to hours)',
            'Gradual onset (hours to days)', 'Chronic/progressive (weeks to months)'
          ],
          category: 'onset',
          required: true,
          phase: 1,
          clinicalPriority: 1,
          redFlagIndicator: true,
          questionRationale: 'Onset: Sudden neurological symptoms may indicate stroke or other emergencies'
        },
        {
          text: 'Are you experiencing any weakness or paralysis?',
          type: 'multiple-choice-with-text',
          options: [
            'No weakness', 'Mild weakness in one limb', 'Severe weakness in one side',
            'Weakness in both legs', 'Generalized weakness', 'Complete paralysis'
          ],
          category: 'motor_symptoms',
          required: true,
          phase: 1,
          clinicalPriority: 1,
          redFlagIndicator: true,
          questionRationale: 'Motor symptoms: Acute weakness may indicate stroke or spinal cord injury'
        },
        {
          text: 'Do you have any changes in sensation or numbness?',
          type: 'multiple-choice-with-text',
          options: [
            'No sensory changes', 'Numbness/tingling in hands/feet', 'One-sided numbness',
            'Loss of sensation', 'Burning/painful sensation', 'Complete numbness in area'
          ],
          category: 'sensory_symptoms',
          required: true,
          phase: 1,
          clinicalPriority: 1,
          redFlagIndicator: true,
          questionRationale: 'Sensory changes: May indicate peripheral neuropathy or central lesions'
        },
        {
          text: 'Are you having any speech or vision problems?',
          type: 'multiple-choice-with-text',
          options: [
            'No speech/vision problems', 'Difficulty speaking/slurred speech', 'Difficulty understanding',
            'Double vision', 'Loss of vision', 'Visual field defects'
          ],
          category: 'cranial_symptoms',
          required: true,
          phase: 1,
          clinicalPriority: 1,
          redFlagIndicator: true,
          questionRationale: 'Cranial symptoms: May indicate stroke, increased ICP, or cranial nerve lesions'
        }
      ]
    }
  ];

  static generatePhase1Questions(chiefComplaint: string): Question[] {
    
    // Find matching template
    const matchingTemplate = this.templates.find(template => 
      template.chiefComplaintPattern.test(chiefComplaint)
    );

    let questions: Question[];
    
    if (matchingTemplate) {
      questions = matchingTemplate.questions.map(q => ({
        ...q,
        id: this.generateUUID(),
        phase: 1 as const
      }));
    } else {
      questions = this.getGeneralPhase1Questions();
    }

    return questions;
  }

  private static getGeneralPhase1Questions(): Question[] {
    return [
      {
        id: this.generateUUID(),
        text: 'When did your symptoms start?',
        type: 'multiple-choice-with-text',
        options: [
          'Less than 1 hour ago', '1-6 hours ago', '6-24 hours ago', 
          '1-3 days ago', 'More than 3 days ago', 'Chronic (weeks/months)'
        ],
        category: 'timing',
        required: true,
        phase: 1,
        clinicalPriority: 1,
        questionRationale: 'Timing helps assess urgency and guide management'
      },
      {
        id: this.generateUUID(),
        text: 'How would you rate the severity of your symptoms?',
        type: 'scale',
        category: 'severity',
        required: true,
        phase: 1,
        clinicalPriority: 1,
        questionRationale: 'Severity assessment guides triage and management decisions'
      },
      {
        id: this.generateUUID(),
        text: 'What makes your symptoms better or worse?',
        type: 'multiple-choice-with-text',
        options: [
          'Nothing helps', 'Rest helps', 'Movement helps', 'Medication helps',
          'Position change helps', 'Eating helps/worsens', 'Stress affects it'
        ],
        category: 'modifying_factors',
        required: true,
        phase: 1,
        clinicalPriority: 2,
        questionRationale: 'Modifying factors provide diagnostic clues and management guidance'
      },
      {
        id: this.generateUUID(),
        text: 'Do you have any other symptoms along with your main complaint?',
        type: 'multiple-choice-with-text',
        options: [
          'No other symptoms', 'Fever/chills', 'Nausea/vomiting', 'Shortness of breath',
          'Dizziness/lightheadedness', 'Fatigue/weakness', 'Changes in appetite'
        ],
        category: 'associated_symptoms',
        required: true,
        phase: 1,
        clinicalPriority: 1,
        redFlagIndicator: true,
        questionRationale: 'Associated symptoms may indicate systemic involvement or serious conditions'
      }
    ];
  }

  private static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  static getAvailableFrameworks(): string[] {
    return this.templates.map(t => t.framework);
  }

  static getTemplateByFramework(framework: string): ClinicalQuestionTemplate | undefined {
    return this.templates.find(t => t.framework === framework);
  }
}