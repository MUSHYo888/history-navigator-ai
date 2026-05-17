
// ABOUTME: Review of Systems component with 3-state toggles (Positive/Negative/Not Asked)
// ABOUTME: Includes gender-based smart filtering and auto-flagging of positive findings

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useMedical } from '@/hooks/useMedical';
import { 
  Eye, Heart, Zap, Activity, Circle, 
  Brain, Bone, Smile, PersonStanding, 
  Thermometer, Shield, Baby,
  Plus, Minus, CheckSquare
} from 'lucide-react';

interface ROSSystem {
  name: string;
  icon: React.ElementType;
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
  onComplete?: () => void;
  onBack?: () => void;
}

export function ReviewOfSystemsComponent({ onComplete, onBack }: ReviewOfSystemsComponentProps = {}) {
  const { state, dispatch } = useMedical();
  
  const getInitialStates = () => {
    const initial: Record<string, Record<string, SymptomState>> = {};
    if (state.rosData) {
      Object.entries(state.rosData).forEach(([sysName, sysData]: [string, unknown]) => {
        initial[sysName] = {};
        const data = sysData as { positive?: string[], negative?: string[] };
        if (data.positive) {
          data.positive.forEach((sym: string) => { initial[sysName][sym] = 'positive'; });
        }
        if (data.negative) {
          data.negative.forEach((sym: string) => { initial[sysName][sym] = 'negative'; });
        }
      });
    }
    return initial;
  };

  const getInitialNotes = () => {
    const initial: Record<string, string> = {};
    if (state.rosData) {
      Object.entries(state.rosData).forEach(([sysName, sysData]: [string, unknown]) => {
        const data = sysData as { notes?: string };
        if (data.notes) {
          initial[sysName] = data.notes;
        }
      });
    }
    return initial;
  };

  const [symptomStates, setSymptomStates] = useState<Record<string, Record<string, SymptomState>>>(getInitialStates());
  const [systemNotes, setSystemNotes] = useState<Record<string, string>>(getInitialNotes());

  const patientGender = state.currentPatient?.gender;

  const filteredSystems = useMemo(() => {
    return rosSystems.filter(system => {
      if (!system.genderFilter) return true;
      return system.genderFilter === patientGender;
    });
  }, [patientGender]);

  const toggleSymptomState = (systemName: string, symptom: string, targetState: 'positive' | 'negative') => {
    setSymptomStates(prev => {
      const current = prev[systemName]?.[symptom] || null;
      const next = current === targetState ? null : targetState;
      
      return {
        ...prev,
        [systemName]: { ...(prev[systemName] || {}), [symptom]: next }
      };
    });
  };

  const handleSystemNotes = (systemName: string, notes: string) => {
    setSystemNotes(prev => ({ ...prev, [systemName]: notes }));
  };

  const getPositiveSymptoms = useCallback((systemName: string): string[] => {
    const systemSymptoms = symptomStates[systemName] || {};
    return Object.entries(systemSymptoms)
      .filter(([, state]) => state === 'positive')
      .map(([symptom]) => symptom);
  }, [symptomStates]);

  const getNegativeSymptoms = useCallback((systemName: string): string[] => {
    const systemSymptoms = symptomStates[systemName] || {};
    return Object.entries(systemSymptoms)
      .filter(([, state]) => state === 'negative')
      .map(([symptom]) => symptom);
  }, [symptomStates]);

  const markAllNegative = (systemName: string) => {
    setSymptomStates(prev => {
      const system = rosSystems.find(s => s.name === systemName);
      if (!system) return prev;
      
      const newSystemState: Record<string, SymptomState> = { ...prev[systemName] };
      system.symptoms.forEach(symptom => {
        if (newSystemState[symptom] !== 'positive') {
          newSystemState[symptom] = 'negative';
        }
      });

      return {
        ...prev,
        [systemName]: newSystemState
      };
    });
  };

  const markEverythingNormal = () => {
    setSymptomStates(prev => {
      const newState = { ...prev };
      filteredSystems.forEach(system => {
        const newSystemState: Record<string, SymptomState> = { ...newState[system.name] };
        system.symptoms.forEach(symptom => {
          if (newSystemState[symptom] !== 'positive') {
            newSystemState[symptom] = 'negative';
          }
        });
        newState[system.name] = newSystemState;
      });
      return newState;
    });
  };

  useEffect(() => {
    const rosDataForContext: Record<string, { positive: string[]; negative: string[]; notes: string }> = {};

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

    dispatch({ type: 'SET_ROS_DATA', payload: rosDataForContext as unknown as Record<string, { positive: string[]; negative: string[]; notes?: string }> });
  }, [symptomStates, systemNotes, dispatch, filteredSystems, getPositiveSymptoms, getNegativeSymptoms]);

  const totalPositive = filteredSystems.reduce((sum, sys) => sum + getPositiveSymptoms(sys.name).length, 0);
  const totalNegative = filteredSystems.reduce((sum, sys) => sum + getNegativeSymptoms(sys.name).length, 0);

  return (
    <div className="w-full">
      <Card className="bg-transparent border-none shadow-none">
        <CardHeader className="px-0 pt-0 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-xl sm:text-2xl">Review of Systems</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Mark symptoms as Positive (+) or Negative (-).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 px-3 py-1">
                <Plus className="h-3 w-3 mr-1" /> {totalPositive} Positive
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
                <Minus className="h-3 w-3 mr-1" /> {totalNegative} Negative
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={markEverythingNormal} className="bg-green-50/50 hover:bg-green-100 text-green-700 border-green-200 h-8">
              <CheckSquare className="h-4 w-4 mr-2" />
              All Systems Normal
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSystems.map((system) => {
              const positiveCount = getPositiveSymptoms(system.name).length;
              const negativeCount = getNegativeSymptoms(system.name).length;

              return (
                <Card key={system.name} className={`overflow-hidden border-l-4 ${positiveCount > 0 ? 'border-l-red-500' : negativeCount > 0 ? 'border-l-green-500' : 'border-l-border'}`}>
                  <CardHeader className="p-3 pb-2 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center text-sm font-semibold">
                        <system.icon className="h-4 w-4 mr-2 text-primary" />
                        {system.name}
                      </CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-green-600 px-2"
                        onClick={() => markAllNegative(system.name)}
                      >
                        Negative (-)
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 space-y-2">
                    <div className="grid grid-cols-1 gap-1">
                      {system.symptoms.map((symptom) => {
                        const currentState = symptomStates[system.name]?.[symptom] || null;
                        return (
                          <div key={symptom} className="flex items-center justify-between py-1 group">
                            <span className={`text-xs font-medium ${currentState === 'positive' ? 'text-red-700' : currentState === 'negative' ? 'text-green-700' : 'text-foreground'}`}>
                              {symptom}
                            </span>
                            <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => toggleSymptomState(system.name, symptom, 'positive')}
                                className={`h-6 w-6 flex items-center justify-center rounded transition-colors ${
                                  currentState === 'positive'
                                    ? 'bg-red-500 text-white shadow-sm opacity-100'
                                    : 'bg-muted text-muted-foreground hover:bg-red-100 hover:text-red-600'
                                }`}
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleSymptomState(system.name, symptom, 'negative')}
                                className={`h-6 w-6 flex items-center justify-center rounded transition-colors ${
                                  currentState === 'negative'
                                    ? 'bg-green-500 text-white shadow-sm opacity-100'
                                    : 'bg-muted text-muted-foreground hover:bg-green-100 hover:text-green-600'
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
                      <div className="pt-2">
                        <Textarea
                          placeholder="Details..."
                          value={systemNotes[system.name] || ''}
                          onChange={(e) => handleSystemNotes(system.name, e.target.value)}
                          rows={1}
                          className="min-h-[40px] text-xs resize-none"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
      {(onBack || onComplete) && (
        <div className="flex justify-between pt-6 mt-4 border-t">
          {onBack ? (
            <Button variant="outline" onClick={onBack}>Back</Button>
          ) : <span />}
          {onComplete && (
            <Button onClick={() => onComplete()}>Continue</Button>
          )}
        </div>
      )}
    </div>
  );
}
