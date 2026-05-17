// ABOUTME: Component for collecting patient's past medical history with structured social history
// ABOUTME: Component for collecting patient's past medical history with minimalist, high-efficiency clinical workflow
// ABOUTME: Handles medical conditions, surgeries, medications, allergies, family history, and structured social fields
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Separator } from '@/components/ui/separator';
import { X, Plus } from 'lucide-react';
import { useMedical } from '@/hooks/useMedical';

interface SocialHistoryData {
  smokingStatus: string;
  packYears: string;
  alcoholUse: string;
  alcoholDetails: string;
  occupation: string;
  livingSituation: string;
  otherNotes: string;
}

const commonConditions = [
  'Hypertension', 'Diabetes', 'Asthma', 'Heart Disease', 'Stroke',
  'Cancer', 'Kidney Disease', 'Liver Disease', 'Depression', 'Anxiety'
];

interface PastMedicalHistoryProps {
  onSubmit?: (pmhData: ReturnType<PastMedicalHistoryCompiler>) => void;
  onBack?: () => void;
}
type PastMedicalHistoryCompiler = () => {
  conditions: string[];
  surgeries: string[];
  medications: string[];
  allergies: string[];
  familyHistory: string;
  socialHistory: string;
  socialHistoryStructured: SocialHistoryData;
};

export function PastMedicalHistory({ onSubmit, onBack }: PastMedicalHistoryProps = {}) {
  const { state, dispatch } = useMedical();

  const [activeConditions, setActiveConditions] = useState<string[]>(state.pmhData?.conditions || []);
  const [conditionNotes, setConditionNotes] = useState<Record<string, string>>({});
  const [surgeries, setSurgeries] = useState<string[]>(state.pmhData?.surgeries || []);
  const [medications, setMedications] = useState<string[]>(state.pmhData?.medications || []);
  const [allergies, setAllergies] = useState<string[]>(state.pmhData?.allergies || []);
  const [familyMembers, setFamilyMembers] = useState<{relative: string, condition: string}[]>([]);
  const [newFam, setNewFam] = useState({ relative: '', condition: '' });
  const [familyNotes, setFamilyNotes] = useState(state.pmhData?.familyHistory || '');

  const [socialData, setSocialData] = useState<SocialHistoryData>(state.pmhData?.socialHistoryStructured || {
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

  const addCondition = (item: string) => {
    if (item.trim() && !activeConditions.includes(item.trim())) {
      setActiveConditions(prev => [...prev, item.trim()]);
    }
  };

  const removeCondition = (item: string) => {
    setActiveConditions(prev => prev.filter(i => i !== item));
    setConditionNotes(prev => {
      const newNotes = { ...prev };
      delete newNotes[item];
      return newNotes;
    });
  };

  const toggleCondition = (condition: string) => {
    if (activeConditions.includes(condition)) {
      removeCondition(condition);
    } else {
      addCondition(condition);
    }
  };

  const addList = (setter: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (item.trim()) {
      setter(prev => prev.includes(item.trim()) ? prev : [...prev, item.trim()]);
    }
  };

  const removeList = (setter: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setter(prev => prev.filter(i => i !== item));
  };

  const addFam = () => {
    if (newFam.relative.trim() && newFam.condition.trim()) {
      setFamilyMembers(prev => [...prev, { relative: newFam.relative.trim(), condition: newFam.condition.trim() }]);
      setNewFam({ relative: '', condition: '' });
    }
  };

  const removeFam = (index: number) => {
    setFamilyMembers(prev => prev.filter((_, i) => i !== index));
  };

  const compileData = useCallback(() => {
    const socialSummary = [
      socialData.smokingStatus && `Smoking: ${socialData.smokingStatus}${socialData.packYears ? ` (${socialData.packYears} pack-years)` : ''}`,
      socialData.alcoholUse && `Alcohol: ${socialData.alcoholUse}${socialData.alcoholDetails ? ` - ${socialData.alcoholDetails}` : ''}`,
      socialData.occupation && `Occupation: ${socialData.occupation}`,
      socialData.livingSituation && `Living situation: ${socialData.livingSituation}`,
      socialData.otherNotes && socialData.otherNotes,
    ].filter(Boolean).join('. ');

    const compiledConditions = activeConditions.map(c => conditionNotes[c] ? `${c} - ${conditionNotes[c]}` : c);
    const compiledFamily = familyMembers.map(f => `${f.relative}: ${f.condition}`).join('\n');
    const finalFamilyHistory = [compiledFamily, familyNotes].filter(Boolean).join('\n\n');

    return {
      conditions: compiledConditions.length > 0 ? compiledConditions : activeConditions,
      surgeries,
      medications,
      allergies,
      familyHistory: finalFamilyHistory,
      socialHistory: socialSummary,
      socialHistoryStructured: socialData,
    };
  }, [socialData, activeConditions, conditionNotes, familyMembers, familyNotes, surgeries, medications, allergies]);

  // Auto-sync with global medical context
  useEffect(() => {
    const timer = setTimeout(() => {
      const compiledData = compileData();
      dispatch({ type: 'SET_PMH_DATA', payload: compiledData });
    }, 500);
    
    return () => clearTimeout(timer);
  }, [compileData, dispatch]);

  return (
    <div className="w-full">
      <Card className="bg-transparent border-none shadow-none">
        <CardContent className="px-0 pb-0">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* COLUMN 1: Medical Conditions */}
              <div className="space-y-5">
                {/* Medical Conditions */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-primary">Medical Conditions</Label>
                  <div className="flex flex-wrap gap-2">
                    {commonConditions.map((condition) => {
                      const isActive = activeConditions.includes(condition);
                      return (
                        <Badge
                          key={condition}
                          variant={isActive ? 'default' : 'outline'}
                          className={`cursor-pointer px-2.5 py-1 text-xs transition-colors ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted'}`}
                          onClick={() => toggleCondition(condition)}
                        >
                          {condition}
                        </Badge>
                      );
                    })}
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-2">
                    <Input
                      placeholder="Add custom condition..."
                      value={newItems.condition}
                      onChange={(e) => setNewItems(prev => ({ ...prev, condition: e.target.value }))}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCondition(newItems.condition);
                          setNewItems(prev => ({ ...prev, condition: '' }));
                        }
                      }}
                      className="h-8 text-sm"
                    />
                    <Button type="button" size="sm" className="h-8 shrink-0" onClick={() => { addCondition(newItems.condition); setNewItems(prev => ({ ...prev, condition: '' })); }}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

                  {activeConditions.length > 0 && (
                    <div className="space-y-2 mt-2 bg-muted/30 p-2.5 rounded-lg border border-border/50">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Status / Notes</Label>
                      {activeConditions.map(c => (
                        <div key={c} className="flex items-center gap-2">
                          <span className="text-xs font-medium w-1/3 truncate" title={c}>{c}</span>
                          <Input
                            className="h-8 text-xs flex-1 bg-background"
                            placeholder="e.g., Controlled, Year diagnosed..."
                            value={conditionNotes[c] || ''}
                            onChange={(e) => setConditionNotes(prev => ({...prev, [c]: e.target.value}))}
                          />
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeCondition(c)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* COLUMN 2: Surgeries & Medications */}
              <div className="space-y-5">
                {/* Surgeries */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-primary">Previous Surgeries</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Add surgery/procedure..."
                      value={newItems.surgery}
                      onChange={(e) => setNewItems(prev => ({ ...prev, surgery: e.target.value }))}
                      onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addList(setSurgeries, newItems.surgery); setNewItems(prev => ({ ...prev, surgery: '' })); } }}
                      className="h-8 text-sm"
                    />
                    <Button type="button" size="sm" className="h-8 shrink-0" onClick={() => { addList(setSurgeries, newItems.surgery); setNewItems(prev => ({ ...prev, surgery: '' })); }}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {surgeries.map((surgery) => (
                      <Badge key={surgery} variant="secondary" className="flex items-center gap-1 px-2 py-1 bg-muted/50 border-border/50 text-xs">
                        {surgery}
                        <X className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors" onClick={() => removeList(setSurgeries, surgery)} />
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Medications */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-primary">Current Medications</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Add medication (name & dose)..."
                      value={newItems.medication}
                      onChange={(e) => setNewItems(prev => ({ ...prev, medication: e.target.value }))}
                      onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addList(setMedications, newItems.medication); setNewItems(prev => ({ ...prev, medication: '' })); } }}
                      className="h-8 text-sm"
                    />
                    <Button type="button" size="sm" className="h-8 shrink-0" onClick={() => { addList(setMedications, newItems.medication); setNewItems(prev => ({ ...prev, medication: '' })); }}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {medications.map((medication) => (
                      <Badge key={medication} variant="outline" className="flex items-center gap-1 px-2 py-1 bg-blue-50/50 text-blue-700 border-blue-200 text-xs">
                        {medication}
                        <X className="h-3 w-3 cursor-pointer hover:text-blue-900 transition-colors" onClick={() => removeList(setMedications, medication)} />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* COLUMN 3: Allergies & Social History */}
              <div className="space-y-5">
                {/* Allergies */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-destructive">Allergies</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Add allergy & reaction..."
                      value={newItems.allergy}
                      onChange={(e) => setNewItems(prev => ({ ...prev, allergy: e.target.value }))}
                      onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addList(setAllergies, newItems.allergy); setNewItems(prev => ({ ...prev, allergy: '' })); } }}
                      className="h-8 text-sm border-destructive focus-visible:ring-destructive"
                    />
                    <Button type="button" size="sm" className="h-8 shrink-0" variant="destructive" onClick={() => { addList(setAllergies, newItems.allergy); setNewItems(prev => ({ ...prev, allergy: '' })); }}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allergies.map((allergy) => (
                      <Badge key={allergy} variant="destructive" className="flex items-center gap-1 px-2 py-1 text-xs">
                        {allergy}
                        <X className="h-3 w-3 cursor-pointer hover:text-white/70 transition-colors" onClick={() => removeList(setAllergies, allergy)} />
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Structured Social History */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-primary">Social History</Label>
                  
                  <div className="space-y-2">
                    {/* Smoking */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Smoking Status</Label>
                      <ToggleGroup 
                        type="single" 
                        value={socialData.smokingStatus} 
                        onValueChange={(v) => v && setSocialData(prev => ({ ...prev, smokingStatus: v }))} 
                        className="justify-start flex-wrap"
                      >
                        <ToggleGroupItem value="never" className="px-3 py-1 h-7 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground border">Never</ToggleGroupItem>
                        <ToggleGroupItem value="former" className="px-3 py-1 h-7 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground border">Former</ToggleGroupItem>
                        <ToggleGroupItem value="current" className="px-3 py-1 h-7 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground border">Current</ToggleGroupItem>
                      </ToggleGroup>
                      
                      {(socialData.smokingStatus === 'current' || socialData.smokingStatus === 'former') && (
                        <div className="pt-1 animate-fade-in-up">
                          <Input
                            type="number"
                            placeholder="Pack-Years (e.g., 10)"
                            value={socialData.packYears}
                            onChange={(e) => setSocialData(prev => ({ ...prev, packYears: e.target.value }))}
                            className="h-8 text-sm w-full"
                          />
                        </div>
                      )}
                    </div>

                    {/* Alcohol */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Alcohol Use</Label>
                      <ToggleGroup 
                        type="single" 
                        value={socialData.alcoholUse} 
                        onValueChange={(v) => v && setSocialData(prev => ({ ...prev, alcoholUse: v }))} 
                        className="justify-start flex-wrap"
                      >
                        <ToggleGroupItem value="none" className="px-3 py-1 h-7 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground border">None</ToggleGroupItem>
                        <ToggleGroupItem value="occasional" className="px-3 py-1 h-7 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground border">Occasional</ToggleGroupItem>
                        <ToggleGroupItem value="moderate" className="px-3 py-1 h-7 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground border">Moderate</ToggleGroupItem>
                        <ToggleGroupItem value="heavy" className="px-3 py-1 h-7 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground border">Heavy</ToggleGroupItem>
                      </ToggleGroup>

                      {socialData.alcoholUse && socialData.alcoholUse !== 'none' && (
                        <div className="pt-1 animate-fade-in-up">
                          <Input
                            placeholder="Type and quantity..."
                            value={socialData.alcoholDetails}
                            onChange={(e) => setSocialData(prev => ({ ...prev, alcoholDetails: e.target.value }))}
                            className="h-8 text-sm"
                          />
                        </div>
                      )}
                    </div>

                    {/* Occupation */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Occupation</Label>
                      <Input
                        placeholder="Current occupation..."
                        value={socialData.occupation}
                        onChange={(e) => setSocialData(prev => ({ ...prev, occupation: e.target.value }))}
                        className="h-8 text-sm"
                      />
                    </div>

                    {/* Living Situation */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Living Situation</Label>
                      <ToggleGroup 
                        type="single" 
                        value={socialData.livingSituation} 
                        onValueChange={(v) => v && setSocialData(prev => ({ ...prev, livingSituation: v }))} 
                        className="justify-start flex-wrap"
                      >
                        <ToggleGroupItem value="alone" className="px-2 py-1 h-7 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground border">Alone</ToggleGroupItem>
                        <ToggleGroupItem value="spouse" className="px-2 py-1 h-7 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground border">Spouse/Partner</ToggleGroupItem>
                        <ToggleGroupItem value="family" className="px-2 py-1 h-7 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground border">Family</ToggleGroupItem>
                        <ToggleGroupItem value="care-facility" className="px-2 py-1 h-7 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground border">Facility</ToggleGroupItem>
                        <ToggleGroupItem value="other" className="px-2 py-1 h-7 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground border">Other</ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                  </div>

                  <div className="space-y-1.5 mt-1">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Other Social Notes</Label>
                    <Textarea
                      placeholder="Additional social history..."
                      value={socialData.otherNotes}
                      onChange={(e) => setSocialData(prev => ({ ...prev, otherNotes: e.target.value }))}
                      rows={2}
                      className="resize-none min-h-[50px] text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-3" />

            {/* Family Tree Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-primary">Family Tree Notes</Label>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <Input 
                  placeholder="Relative (e.g., Father)" 
                  value={newFam.relative} 
                  onChange={(e) => setNewFam(p => ({...p, relative: e.target.value}))} 
                  className="w-full sm:w-1/3 h-8 text-sm"
                />
                <div className="flex flex-1 items-center gap-2 w-full">
                  <Input 
                    placeholder="Condition (e.g., Hypertension)" 
                    value={newFam.condition} 
                    onChange={(e) => setNewFam(p => ({...p, condition: e.target.value}))}
                    onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFam(); } }}
                    className="flex-1 h-8 text-sm"
                  />
                  <Button onClick={addFam} type="button" size="sm" className="h-8 px-3 shrink-0">Add</Button>
                </div>
              </div>
              {familyMembers.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                  {familyMembers.map((f, i) => (
                    <div key={i} className="flex justify-between items-start bg-muted/30 border border-border/50 p-2 rounded-lg text-xs transition-smooth hover:bg-muted/50">
                      <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                        <span className="font-semibold text-foreground truncate">{f.relative}</span>
                        <span className="text-muted-foreground truncate">{f.condition}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive shrink-0 -mt-0.5 -mr-0.5" onClick={() => removeFam(i)}>
                        <X className="h-3 w-3"/>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="space-y-1.5 mt-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Additional Family Notes</Label>
                <Textarea
                  placeholder="Document any other relevant family medical history..."
                  value={familyNotes}
                  onChange={(e) => setFamilyNotes(e.target.value)}
                  rows={2}
                  className="min-h-[50px] text-sm resize-none"
                />
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
