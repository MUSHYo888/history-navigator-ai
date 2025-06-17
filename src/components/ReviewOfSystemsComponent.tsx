
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useMedical } from '@/context/MedicalContext';
import { 
  Eye, Heart, Zap, Stomach, Kidney, 
  Brain, Bone, Smile, PersonStanding, 
  Thermometer, Shield, Baby 
} from 'lucide-react';

interface ROSSystem {
  name: string;
  icon: any;
  symptoms: string[];
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
    icon: Stomach,
    symptoms: ['Nausea', 'Vomiting', 'Diarrhea', 'Constipation', 'Abdominal pain', 'Heartburn']
  },
  {
    name: 'Genitourinary',
    icon: Kidney,
    symptoms: ['Dysuria', 'Frequency', 'Urgency', 'Hematuria', 'Incontinence']
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

interface ReviewOfSystemsComponentProps {
  onComplete: () => void;
  onBack: () => void;
}

export function ReviewOfSystemsComponent({ onComplete, onBack }: ReviewOfSystemsComponentProps) {
  const { state, dispatch } = useMedical();
  const [selectedSymptoms, setSelectedSymptoms] = useState<Record<string, string[]>>({});
  const [systemNotes, setSystemNotes] = useState<Record<string, string>>({});

  const toggleSymptom = (systemName: string, symptom: string) => {
    setSelectedSymptoms(prev => {
      const systemSymptoms = prev[systemName] || [];
      const updatedSymptoms = systemSymptoms.includes(symptom)
        ? systemSymptoms.filter(s => s !== symptom)
        : [...systemSymptoms, symptom];
      
      return { ...prev, [systemName]: updatedSymptoms };
    });
  };

  const handleSystemNotes = (systemName: string, notes: string) => {
    setSystemNotes(prev => ({ ...prev, [systemName]: notes }));
  };

  const handleComplete = () => {
    // Update context with ROS data
    Object.keys(selectedSymptoms).forEach(systemName => {
      dispatch({
        type: 'UPDATE_ROS',
        payload: {
          system: systemName,
          data: {
            positive: selectedSymptoms[systemName] || [],
            negative: [], // Could track explicitly denied symptoms
            notes: systemNotes[systemName]
          }
        }
      });
    });

    onComplete();
  };

  const totalPositiveSymptoms = Object.values(selectedSymptoms).flat().length;

  return (
    <div className="p-6">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Review of Systems</CardTitle>
          <p className="text-center text-gray-600">
            Check any symptoms the patient is currently experiencing
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{totalPositiveSymptoms}</strong> positive symptoms selected
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {rosSystems.map((system) => (
              <Card key={system.name} className="border-l-4 border-l-teal-500">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 text-lg">
                    <system.icon className="h-5 w-5 text-teal-600" />
                    <span>{system.name}</span>
                    {selectedSymptoms[system.name]?.length > 0 && (
                      <span className="bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded-full">
                        {selectedSymptoms[system.name].length}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    {system.symptoms.map((symptom) => (
                      <div key={symptom} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${system.name}-${symptom}`}
                          checked={selectedSymptoms[system.name]?.includes(symptom) || false}
                          onCheckedChange={() => toggleSymptom(system.name, symptom)}
                        />
                        <Label 
                          htmlFor={`${system.name}-${symptom}`}
                          className="text-sm cursor-pointer"
                        >
                          {symptom}
                        </Label>
                      </div>
                    ))}
                  </div>
                  
                  {selectedSymptoms[system.name]?.length > 0 && (
                    <div>
                      <Label className="text-xs text-gray-600">Additional details</Label>
                      <Textarea
                        placeholder={`Additional details about ${system.name.toLowerCase()} symptoms...`}
                        value={systemNotes[system.name] || ''}
                        onChange={(e) => handleSystemNotes(system.name, e.target.value)}
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={onBack}>
              Back to History
            </Button>
            <Button 
              onClick={handleComplete}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Continue to Assessment Summary
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
