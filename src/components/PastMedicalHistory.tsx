
// ABOUTME: Component for collecting patient's past medical history with structured social history
// ABOUTME: Handles medical conditions, surgeries, medications, allergies, family history, and structured social fields
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus } from 'lucide-react';

interface PastMedicalHistoryProps {
  onSubmit: (data: PastMedicalHistoryData) => void;
  onBack: () => void;
}

interface SocialHistoryData {
  smokingStatus: string;
  packYears: string;
  alcoholUse: string;
  alcoholDetails: string;
  occupation: string;
  livingSituation: string;
  otherNotes: string;
}

interface PastMedicalHistoryData {
  conditions: string[];
  surgeries: string[];
  medications: string[];
  allergies: string[];
  familyHistory: string;
  socialHistory: string;
  socialHistoryStructured?: SocialHistoryData;
}

const commonConditions = [
  'Hypertension', 'Diabetes', 'Asthma', 'Heart Disease', 'Stroke',
  'Cancer', 'Kidney Disease', 'Liver Disease', 'Depression', 'Anxiety'
];

export function PastMedicalHistory({ onSubmit, onBack }: PastMedicalHistoryProps) {
  const [data, setData] = useState<PastMedicalHistoryData>({
    conditions: [],
    surgeries: [],
    medications: [],
    allergies: [],
    familyHistory: '',
    socialHistory: ''
  });

  const [socialData, setSocialData] = useState<SocialHistoryData>({
    smokingStatus: '',
    packYears: '',
    alcoholUse: '',
    alcoholDetails: '',
    occupation: '',
    livingSituation: '',
    otherNotes: ''
  });

  const [newItems, setNewItems] = useState({
    condition: '',
    surgery: '',
    medication: '',
    allergy: ''
  });

  const addItem = (category: keyof Pick<PastMedicalHistoryData, 'conditions' | 'surgeries' | 'medications' | 'allergies'>, item: string) => {
    if (item.trim() && !data[category].includes(item.trim())) {
      setData(prev => ({
        ...prev,
        [category]: [...prev[category], item.trim()]
      }));
    }
  };

  const removeItem = (category: keyof Pick<PastMedicalHistoryData, 'conditions' | 'surgeries' | 'medications' | 'allergies'>, item: string) => {
    setData(prev => ({
      ...prev,
      [category]: prev[category].filter(i => i !== item)
    }));
  };

  const toggleCondition = (condition: string) => {
    if (data.conditions.includes(condition)) {
      removeItem('conditions', condition);
    } else {
      addItem('conditions', condition);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Compile social history into a readable string for backward compatibility
    const socialSummary = [
      socialData.smokingStatus && `Smoking: ${socialData.smokingStatus}${socialData.packYears ? ` (${socialData.packYears} pack-years)` : ''}`,
      socialData.alcoholUse && `Alcohol: ${socialData.alcoholUse}${socialData.alcoholDetails ? ` - ${socialData.alcoholDetails}` : ''}`,
      socialData.occupation && `Occupation: ${socialData.occupation}`,
      socialData.livingSituation && `Living situation: ${socialData.livingSituation}`,
      socialData.otherNotes && socialData.otherNotes,
    ].filter(Boolean).join('. ');

    onSubmit({
      ...data,
      socialHistory: socialSummary || data.socialHistory,
      socialHistoryStructured: socialData,
    });
  };

  return (
    <div className="p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Past Medical History</CardTitle>
          <p className="text-center text-muted-foreground">
            Review and document patient's medical background
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Medical Conditions */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Medical Conditions</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {commonConditions.map((condition) => (
                  <div key={condition} className="flex items-center space-x-2">
                    <Checkbox
                      id={condition}
                      checked={data.conditions.includes(condition)}
                      onCheckedChange={() => toggleCondition(condition)}
                    />
                    <Label htmlFor={condition} className="text-sm">{condition}</Label>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2">
                <Input
                  placeholder="Add other condition..."
                  value={newItems.condition}
                  onChange={(e) => setNewItems(prev => ({ ...prev, condition: e.target.value }))}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem('conditions', newItems.condition);
                      setNewItems(prev => ({ ...prev, condition: '' }));
                    }
                  }}
                />
                <Button type="button" size="sm" onClick={() => { addItem('conditions', newItems.condition); setNewItems(prev => ({ ...prev, condition: '' })); }}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.conditions.map((condition) => (
                  <Badge key={condition} variant="secondary" className="flex items-center gap-1">
                    {condition}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeItem('conditions', condition)} />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Surgeries */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Previous Surgeries</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Add surgery/procedure..."
                  value={newItems.surgery}
                  onChange={(e) => setNewItems(prev => ({ ...prev, surgery: e.target.value }))}
                  onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem('surgeries', newItems.surgery); setNewItems(prev => ({ ...prev, surgery: '' })); } }}
                />
                <Button type="button" size="sm" onClick={() => { addItem('surgeries', newItems.surgery); setNewItems(prev => ({ ...prev, surgery: '' })); }}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.surgeries.map((surgery) => (
                  <Badge key={surgery} variant="secondary" className="flex items-center gap-1">
                    {surgery}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeItem('surgeries', surgery)} />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Current Medications */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Current Medications</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Add medication..."
                  value={newItems.medication}
                  onChange={(e) => setNewItems(prev => ({ ...prev, medication: e.target.value }))}
                  onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem('medications', newItems.medication); setNewItems(prev => ({ ...prev, medication: '' })); } }}
                />
                <Button type="button" size="sm" onClick={() => { addItem('medications', newItems.medication); setNewItems(prev => ({ ...prev, medication: '' })); }}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.medications.map((medication) => (
                  <Badge key={medication} variant="secondary" className="flex items-center gap-1">
                    {medication}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeItem('medications', medication)} />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Allergies */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Allergies</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Add allergy..."
                  value={newItems.allergy}
                  onChange={(e) => setNewItems(prev => ({ ...prev, allergy: e.target.value }))}
                  onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem('allergies', newItems.allergy); setNewItems(prev => ({ ...prev, allergy: '' })); } }}
                />
                <Button type="button" size="sm" onClick={() => { addItem('allergies', newItems.allergy); setNewItems(prev => ({ ...prev, allergy: '' })); }}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.allergies.map((allergy) => (
                  <Badge key={allergy} variant="destructive" className="flex items-center gap-1">
                    {allergy}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeItem('allergies', allergy)} />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Family History */}
            <div className="space-y-2">
              <Label htmlFor="familyHistory" className="text-lg font-medium">Family History</Label>
              <Textarea
                id="familyHistory"
                placeholder="Document relevant family medical history (first-degree relatives)..."
                value={data.familyHistory}
                onChange={(e) => setData(prev => ({ ...prev, familyHistory: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Structured Social History */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Social History</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Smoking */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Smoking Status</Label>
                  <Select value={socialData.smokingStatus} onValueChange={(v) => setSocialData(prev => ({ ...prev, smokingStatus: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Never smoker</SelectItem>
                      <SelectItem value="former">Former smoker</SelectItem>
                      <SelectItem value="current">Current smoker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(socialData.smokingStatus === 'current' || socialData.smokingStatus === 'former') && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Pack-Years</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 10"
                      value={socialData.packYears}
                      onChange={(e) => setSocialData(prev => ({ ...prev, packYears: e.target.value }))}
                    />
                  </div>
                )}

                {/* Alcohol */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Alcohol Use</Label>
                  <Select value={socialData.alcoholUse} onValueChange={(v) => setSocialData(prev => ({ ...prev, alcoholUse: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select usage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="occasional">Occasional (social)</SelectItem>
                      <SelectItem value="moderate">Moderate (1-2/day)</SelectItem>
                      <SelectItem value="heavy">Heavy (3+/day)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {socialData.alcoholUse && socialData.alcoholUse !== 'none' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Alcohol Details</Label>
                    <Input
                      placeholder="Type and quantity..."
                      value={socialData.alcoholDetails}
                      onChange={(e) => setSocialData(prev => ({ ...prev, alcoholDetails: e.target.value }))}
                    />
                  </div>
                )}

                {/* Occupation */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Occupation</Label>
                  <Input
                    placeholder="Current occupation..."
                    value={socialData.occupation}
                    onChange={(e) => setSocialData(prev => ({ ...prev, occupation: e.target.value }))}
                  />
                </div>

                {/* Living Situation */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Living Situation</Label>
                  <Select value={socialData.livingSituation} onValueChange={(v) => setSocialData(prev => ({ ...prev, livingSituation: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alone">Lives alone</SelectItem>
                      <SelectItem value="spouse">Lives with spouse/partner</SelectItem>
                      <SelectItem value="family">Lives with family</SelectItem>
                      <SelectItem value="care-facility">Care facility</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Other Social Notes</Label>
                <Textarea
                  placeholder="Additional social history (recreational drugs, exercise, diet, travel)..."
                  value={socialData.otherNotes}
                  onChange={(e) => setSocialData(prev => ({ ...prev, otherNotes: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={onBack}>
                Back
              </Button>
              <Button type="submit">
                Continue to Physical Exam
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
