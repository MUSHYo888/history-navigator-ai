
// ABOUTME: Review of Systems component with 3-state toggles (Positive/Negative/Not Asked)
// ABOUTME: Includes gender-based smart filtering and auto-flagging of positive findings

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useMedical } from '@/context/MedicalContext';
import { useSaveROS } from '@/hooks/useAssessment';
import { 
  Eye, Heart, Zap, Activity, Circle, 
  Brain, Bone, Smile, PersonStanding, 
  Thermometer, Shield, Baby,
  Plus, Minus
} from 'lucide-react';

interface ROSSystem {
  name: string;
  icon: any;
  symptoms: string[];
  genderFilter?: 'male' | 'female';
}

const rosSystems: ROSSystem[] = [
  {
    name: 'Constitutional',
    icon: Thermometer,
    symptoms: ['Fever', 'Chills', 'Night sweats', 'Weight loss', 'Weight gain', 'Fatigue', 'Malaise']
  },
  {
    name: 'HEENT',
    icon: Eye,
    symptoms: ['Headache', 'Vision changes', 'Hearing loss', 'Tinnitus', 'Nasal congestion', 'Sore throat']
  },
  {
    name: 'Cardiovascular',
    icon: Heart,
    symptoms: ['Chest pain', 'Palpitations', 'Shortness of breath', 'Orthopnea', 'PND', 'Edema']
  },
  {
    name: 'Respiratory',
    icon: Zap,
    symptoms: ['Cough', 'Sputum', 'Shortness of breath', 'Wheezing', 'Chest pain']
  },
  {
    name: 'Gastrointestinal',
    icon: Activity,
    symptoms: ['Nausea', 'Vomiting', 'Diarrhea', 'Constipation', 'Abdominal pain', 'Heartburn']
  },
  {
    name: 'Genitourinary',
    icon: Circle,
    symptoms: ['Dysuria', 'Frequency', 'Urgency', 'Hematuria', 'Incontinence']
  },
  {
    name: 'Genitourinary - Female',
    icon: Baby,
    symptoms: ['Menstrual irregularities', 'Vaginal discharge', 'Pelvic pain', 'Pregnancy status'],
    genderFilter: 'female'
  },
  {
    name: 'Genitourinary - Male',
    icon: Circle,
    symptoms: ['Testicular pain', 'Erectile dysfunction', 'Urethral discharge'],
    genderFilter: 'male'
  },
  {
    name: 'Musculoskeletal',
    icon: Bone,
    symptoms: ['Joint pain', 'Muscle pain', 'Back pain', 'Stiffness', 'Swelling']
  },
  {
    name: 'Neurological',
    icon: Brain,
    symptoms: ['Headache', 'Dizziness', 'Weakness', 'Numbness', 'Seizures', 'Memory problems']
  },
  {
    name: 'Psychiatric',
    icon: Smile,
    symptoms: ['Depression', 'Anxiety', 'Sleep disturbances', 'Mood changes']
  },
  {
    name: 'Skin/Integumentary',
    icon: PersonStanding,
    symptoms: ['Rash', 'Itching', 'Skin changes', 'Hair loss', 'Nail changes']
  },
  {
    name: 'Hematologic/Lymphatic',
    icon: Shield,
    symptoms: ['Easy bruising', 'Bleeding', 'Swollen lymph nodes']
  },
  {
    name: 'Allergic/Immunologic',
    icon: Shield,
    symptoms: ['Allergic reactions', 'Frequent infections', 'Autoimmune symptoms']
  }
];

type SymptomState = 'positive' | 'negative' | null;

interface ReviewOfSystemsComponentProps {
  onComplete: () => void;
  onBack: () => void;
}

// Module-level cache to preserve state across unexpected remounts/background refreshes
let draftSymptomStates: Record<string, Record<string, SymptomState>> = {};
let draftSystemNotes: Record<string, string> = {};

export function ReviewOfSystemsComponent({ onComplete, onBack }: ReviewOfSystemsComponentProps) {
  const { state, dispatch } = useMedical();
  const [symptomStates, setSymptomStates] = useState<Record<string, Record<string, SymptomState>>>(draftSymptomStates);
  const [systemNotes, setSystemNotes] = useState<Record<string, string>>(draftSystemNotes);
  const [isSaving, setIsSaving] = useState(false);
  const saveROSMutation = useSaveROS();

  const patientGender = state.currentPatient?.gender;

  const filteredSystems = rosSystems.filter(system => {
    if (!system.genderFilter) return true;
    return system.genderFilter === patientGender;
  });

  const toggleSymptomState = (systemName: string, symptom: string, targetState: 'positive' | 'negative') => {
    setSymptomStates(prev => {
      const current = prev[systemName]?.[symptom] || null;
      const next = current === targetState ? null : targetState;
      
      const nextState = {
        ...prev,
        [systemName]: { ...(prev[systemName] || {}), [symptom]: next }
      };
      draftSymptomStates = nextState; // Synchronous cache update
      return nextState;
    });
  };

  const handleSystemNotes = (systemName: string, notes: string) => {
    setSystemNotes(prev => {
      const nextState = { ...prev, [systemName]: notes };
      draftSystemNotes = nextState; // Synchronous cache update
      return nextState;
    });
  };

  const getPositiveSymptoms = (systemName: string): string[] => {
    const systemSymptoms = symptomStates[systemName] || {};
    return Object.entries(systemSymptoms)
      .filter(([, state]) => state === 'positive')
      .map(([symptom]) => symptom);
  };

  const getNegativeSymptoms = (systemName: string): string[] => {
    const systemSymptoms = symptomStates[systemName] || {};
    return Object.entries(systemSymptoms)
      .filter(([, state]) => state === 'negative')
      .map(([symptom]) => symptom);
  };

  const handleComplete = async () => {
    const rosDataForContext: Record<string, any> = {};
    
    filteredSystems.forEach(system => {
      const positive = getPositiveSymptoms(system.name);
      const negative = getNegativeSymptoms(system.name);
      if (positive.length > 0 || negative.length > 0 || systemNotes[system.name]) {
        rosDataForContext[system.name] = {
          positive,
          negative,
          notes: systemNotes[system.name] || ''
        };
      }
    });

    dispatch({ type: 'SET_ROS_DATA', payload: rosDataForContext });

    if (state.currentAssessment) {
      setIsSaving(true);
      try {
        const savePromises = Object.keys(rosDataForContext).map(systemName =>
          saveROSMutation.mutateAsync({
            assessmentId: state.currentAssessment!.id,
            systemName,
            rosData: rosDataForContext[systemName]
          })
        );
        await Promise.all(savePromises);

        // Clear the module cache for the next assessment
        draftSymptomStates = {};
        draftSystemNotes = {};

        onComplete();
      } catch (error) {
        console.error('Failed to save ROS data:', error);
      } finally {
        setIsSaving(false);
      }
    } else {
      // Clear the module cache for the next assessment
      draftSymptomStates = {};
      draftSystemNotes = {};

      onComplete();
    }
  };

  const totalPositive = filteredSystems.reduce((sum, sys) => sum + getPositiveSymptoms(sys.name).length, 0);
  const totalNegative = filteredSystems.reduce((sum, sys) => sum + getNegativeSymptoms(sys.name).length, 0);

  return (
    <div className="p-6">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Review of Systems</CardTitle>
          <p className="text-center text-muted-foreground">
            Mark each symptom as Positive (+) or Negative (-). Click once for positive, twice for negative.
          </p>
          <div className="flex gap-4 justify-center">
            <div className="bg-red-50 border border-red-200 px-4 py-2 rounded-lg">
              <span className="text-sm text-red-800 font-medium">
                <Plus className="h-3 w-3 inline mr-1" />
                {totalPositive} Positive
              </span>
            </div>
            <div className="bg-green-50 border border-green-200 px-4 py-2 rounded-lg">
              <span className="text-sm text-green-800 font-medium">
                <Minus className="h-3 w-3 inline mr-1" />
                {totalNegative} Negative
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredSystems.map((system) => {
              const positiveCount = getPositiveSymptoms(system.name).length;
              const negativeCount = getNegativeSymptoms(system.name).length;

              return (
                <Card key={system.name} className="border-l-4 border-l-primary/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-lg">
                      <div className="flex items-center space-x-2">
                        <system.icon className="h-5 w-5 text-primary" />
                        <span>{system.name}</span>
                      </div>
                      <div className="flex gap-1">
                        {positiveCount > 0 && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                            +{positiveCount}
                          </span>
                        )}
                        {negativeCount > 0 && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            -{negativeCount}
                          </span>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 gap-2">
                      {system.symptoms.map((symptom) => {
                        const currentState = symptomStates[system.name]?.[symptom] || null;
                        return (
                          <div key={symptom} className="flex items-center justify-between py-1">
                            <span className="text-sm">{symptom}</span>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => toggleSymptomState(system.name, symptom, 'positive')}
                                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                  currentState === 'positive'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-muted text-muted-foreground hover:bg-red-100'
                                }`}
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleSymptomState(system.name, symptom, 'negative')}
                                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                  currentState === 'negative'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-muted text-muted-foreground hover:bg-green-100'
                                }`}
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {positiveCount > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Additional details</Label>
                        <Textarea
                          placeholder={`Details about ${system.name.toLowerCase()} symptoms...`}
                          value={systemNotes[system.name] || ''}
                          onChange={(e) => handleSystemNotes(system.name, e.target.value)}
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={onBack}>
              Back to History
            </Button>
            <Button onClick={handleComplete} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Continue to Assessment Summary'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
