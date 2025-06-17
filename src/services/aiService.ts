
import { Question, DifferentialDiagnosis } from '@/types/medical';

// Simulated AI service - would connect to OpenRouter/OpenAI in production
export class AIService {
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
      }
    ]
  };

  static async generateQuestions(chiefComplaint: string): Promise<Question[]> {
    // Simulate AI delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const complaint = chiefComplaint.toLowerCase();
    const questions = this.fallbackQuestions[complaint] || this.fallbackQuestions['headache'];
    
    console.log(`Generated ${questions.length} questions for: ${chiefComplaint}`);
    return questions;
  }

  static async generateDifferentialDiagnosis(
    chiefComplaint: string,
    answers: Record<string, any>
  ): Promise<DifferentialDiagnosis[]> {
    // Simulate AI delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock differential diagnoses based on chief complaint
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
    return mockDiagnoses[complaint] || mockDiagnoses['headache'];
  }
}
