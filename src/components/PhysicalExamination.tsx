
// ABOUTME: Component for systematic physical examination documentation
// ABOUTME: Collects examination findings organized by body systems
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface PhysicalExaminationProps {
  onComplete: (data: PhysicalExamData) => void;
  onBack: () => void;
}

interface PhysicalExamData {
  vitalSigns: {
    bloodPressure: string;
    heartRate: string;
    respiratoryRate: string;
    temperature: string;
    oxygenSaturation: string;
  };
  systems: {
    [systemName: string]: {
      normal: boolean;
      findings: string[];
      notes: string;
    };
  };
  generalAppearance: string;
}

const examSystems = [
  {
    name: 'cardiovascular',
    label: 'Cardiovascular',
    findings: [
      'Regular rate and rhythm',
      'Murmur present',
      'Gallop present',
      'Peripheral edema',
      'JVD present',
      'Carotid bruit'
    ]
  },
  {
    name: 'pulmonary',
    label: 'Pulmonary',
    findings: [
      'Clear to auscultation',
      'Wheezes',
      'Crackles/rales',
      'Rhonchi',
      'Decreased breath sounds',
      'Use of accessory muscles'
    ]
  },
  {
    name: 'abdomen',
    label: 'Abdomen',
    findings: [
      'Soft, non-tender',
      'Tenderness present',
      'Distended',
      'Bowel sounds present',
      'Bowel sounds absent',
      'Masses palpated',
      'Organomegaly'
    ]
  },
  {
    name: 'neurological',
    label: 'Neurological',
    findings: [
      'Alert and oriented x3',
      'Cranial nerves intact',
      'Motor strength 5/5',
      'Reflexes 2+ symmetric',
      'Sensation intact',
      'Gait normal',
      'Focal deficits present'
    ]
  },
  {
    name: 'musculoskeletal',
    label: 'Musculoskeletal',
    findings: [
      'Full range of motion',
      'No deformities',
      'Joint swelling',
      'Tenderness',
      'Limited range of motion',
      'Muscle weakness'
    ]
  },
  {
    name: 'skin',
    label: 'Skin',
    findings: [
      'Normal color and texture',
      'Rash present',
      'Lesions present',
      'Bruising',
      'Poor skin turgor',
      'Jaundice'
    ]
  }
];

export function PhysicalExamination({ onComplete, onBack }: PhysicalExaminationProps) {
  const [data, setData] = useState<PhysicalExamData>({
    vitalSigns: {
      bloodPressure: '',
      heartRate: '',
      respiratoryRate: '',
      temperature: '',
      oxygenSaturation: ''
    },
    systems: {},
    generalAppearance: ''
  });

  const [activeTab, setActiveTab] = useState('vitals');

  const handleVitalSignChange = (field: string, value: string) => {
    setData(prev => ({
      ...prev,
      vitalSigns: {
        ...prev.vitalSigns,
        [field]: value
      }
    }));
  };

  const toggleSystemNormal = (systemName: string) => {
    setData(prev => ({
      ...prev,
      systems: {
        ...prev.systems,
        [systemName]: {
          ...prev.systems[systemName],
          normal: !prev.systems[systemName]?.normal,
          findings: prev.systems[systemName]?.normal ? [] : prev.systems[systemName]?.findings || []
        }
      }
    }));
  };

  const toggleFinding = (systemName: string, finding: string) => {
    setData(prev => {
      const currentFindings = prev.systems[systemName]?.findings || [];
      const newFindings = currentFindings.includes(finding)
        ? currentFindings.filter(f => f !== finding)
        : [...currentFindings, finding];

      return {
        ...prev,
        systems: {
          ...prev.systems,
          [systemName]: {
            ...prev.systems[systemName],
            normal: false,
            findings: newFindings,
            notes: prev.systems[systemName]?.notes || ''
          }
        }
      };
    });
  };

  const handleSystemNotes = (systemName: string, notes: string) => {
    setData(prev => ({
      ...prev,
      systems: {
        ...prev.systems,
        [systemName]: {
          ...prev.systems[systemName],
          notes,
          normal: prev.systems[systemName]?.normal || false,
          findings: prev.systems[systemName]?.findings || []
        }
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(data);
  };

  const isSystemComplete = (systemName: string) => {
    const system = data.systems[systemName];
    return system && (system.normal || system.findings.length > 0);
  };

  const completedSystems = examSystems.filter(s => isSystemComplete(s.name)).length;

  return (
    <div className="p-6">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Physical Examination</CardTitle>
          <p className="text-center text-gray-600">
            Document systematic physical examination findings
          </p>
          <div className="text-center">
            <Badge variant="outline">
              {completedSystems}/{examSystems.length} systems examined
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="vitals">Vital Signs</TabsTrigger>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="systems">Systems</TabsTrigger>
                <TabsTrigger value="review">Review</TabsTrigger>
              </TabsList>

              <TabsContent value="vitals" className="space-y-4">
                <h3 className="text-lg font-medium">Vital Signs</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="bp">Blood Pressure</Label>
                    <input
                      id="bp"
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="120/80"
                      value={data.vitalSigns.bloodPressure}
                      onChange={(e) => handleVitalSignChange('bloodPressure', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hr">Heart Rate</Label>
                    <input
                      id="hr"
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="72 bpm"
                      value={data.vitalSigns.heartRate}
                      onChange={(e) => handleVitalSignChange('heartRate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rr">Respiratory Rate</Label>
                    <input
                      id="rr"
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="16/min"
                      value={data.vitalSigns.respiratoryRate}
                      onChange={(e) => handleVitalSignChange('respiratoryRate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="temp">Temperature</Label>
                    <input
                      id="temp"
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="98.6°F"
                      value={data.vitalSigns.temperature}
                      onChange={(e) => handleVitalSignChange('temperature', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="o2sat">Oxygen Saturation</Label>
                    <input
                      id="o2sat"
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="98%"
                      value={data.vitalSigns.oxygenSaturation}
                      onChange={(e) => handleVitalSignChange('oxygenSaturation', e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="general" className="space-y-4">
                <h3 className="text-lg font-medium">General Appearance</h3>
                <Textarea
                  placeholder="Describe patient's general appearance, affect, distress level..."
                  value={data.generalAppearance}
                  onChange={(e) => setData(prev => ({ ...prev, generalAppearance: e.target.value }))}
                  rows={4}
                />
              </TabsContent>

              <TabsContent value="systems" className="space-y-6">
                <h3 className="text-lg font-medium">System Examination</h3>
                {examSystems.map((system) => (
                  <Card key={system.name} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{system.label}</h4>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${system.name}-normal`}
                          checked={data.systems[system.name]?.normal || false}
                          onCheckedChange={() => toggleSystemNormal(system.name)}
                        />
                        <Label htmlFor={`${system.name}-normal`} className="text-sm">
                          Normal examination
                        </Label>
                      </div>
                    </div>

                    {!data.systems[system.name]?.normal && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                          {system.findings.map((finding) => (
                            <div key={finding} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${system.name}-${finding}`}
                                checked={data.systems[system.name]?.findings?.includes(finding) || false}
                                onCheckedChange={() => toggleFinding(system.name, finding)}
                              />
                              <Label htmlFor={`${system.name}-${finding}`} className="text-sm">
                                {finding}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <Textarea
                          placeholder="Additional notes for this system..."
                          value={data.systems[system.name]?.notes || ''}
                          onChange={(e) => handleSystemNotes(system.name, e.target.value)}
                          rows={2}
                        />
                      </>
                    )}
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="review" className="space-y-4">
                <h3 className="text-lg font-medium">Examination Summary</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">Vital Signs</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                      <div>BP: {data.vitalSigns.bloodPressure || 'Not recorded'}</div>
                      <div>HR: {data.vitalSigns.heartRate || 'Not recorded'}</div>
                      <div>RR: {data.vitalSigns.respiratoryRate || 'Not recorded'}</div>
                      <div>Temp: {data.vitalSigns.temperature || 'Not recorded'}</div>
                      <div>O2 Sat: {data.vitalSigns.oxygenSaturation || 'Not recorded'}</div>
                    </div>
                  </div>

                  {data.generalAppearance && (
                    <div>
                      <h4 className="font-medium mb-2">General Appearance</h4>
                      <p className="text-sm text-gray-700">{data.generalAppearance}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium mb-2">System Examinations</h4>
                    <div className="space-y-2">
                      {examSystems.map((system) => {
                        const systemData = data.systems[system.name];
                        if (!systemData) return null;

                        return (
                          <div key={system.name} className="text-sm">
                            <span className="font-medium">{system.label}: </span>
                            {systemData.normal ? (
                              <span className="text-green-600">Normal examination</span>
                            ) : (
                              <span>
                                {systemData.findings.join(', ')}
                                {systemData.notes && ` - ${systemData.notes}`}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={onBack}>
                Back to Past Medical History
              </Button>
              <Button 
                type="submit" 
                className="bg-teal-600 hover:bg-teal-700"
                disabled={completedSystems === 0}
              >
                Continue to Assessment & Plan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
