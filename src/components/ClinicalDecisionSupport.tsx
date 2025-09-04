// ABOUTME: Unified clinical decision support component integrating investigations and treatment planning
// ABOUTME: Provides seamless workflow between diagnostic testing and therapeutic decisions

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Microscope, 
  Pill, 
  Brain, 
  CheckCircle2, 
  AlertTriangle,
  Save,
  ArrowRight,
  TrendingUp,
  Shield,
  DollarSign,
  Clock,
  Loader2
} from 'lucide-react';
import { useInvestigationRecommendations } from '@/hooks/useInvestigationRecommendations';
import { InvestigationIntelligenceService } from '@/services/investigationIntelligenceService';
import { TreatmentManagementService } from '@/services/treatmentManagementService';
import { useMedical } from '@/context/MedicalContext';
import { useSaveClinicalDecisionSupport } from '@/hooks/useClinicalDecisionSupport';
import { toast } from 'sonner';

interface ClinicalDecisionSupportProps {
  chiefComplaint: string;
  onComplete: (clinicalPlan: ClinicalPlan) => void;
  onBack: () => void;
}

interface ClinicalPlan {
  investigations: {
    selected: string[];
    rationale: string;
    estimatedCost: number;
  };
  treatment: {
    medications: string[];
    nonPharmacological: string[];
    followUp: string;
  };
  clinicalNotes: string;
}

export function ClinicalDecisionSupport({
  chiefComplaint,
  onComplete,
  onBack
}: ClinicalDecisionSupportProps) {
  const [activeTab, setActiveTab] = useState('investigations');
  const [selectedInvestigations, setSelectedInvestigations] = useState<string[]>([]);
  const [selectedMedications, setSelectedMedications] = useState<string[]>([]);
  const [selectedNonPharm, setSelectedNonPharm] = useState<string[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [investigationRationale, setInvestigationRationale] = useState('');
  const [followUpPlan, setFollowUpPlan] = useState('');
  const [investigationIntelligence, setInvestigationIntelligence] = useState<any[]>([]);
  const [treatmentRecommendation, setTreatmentRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { state } = useMedical();
  const saveClinicalPlanMutation = useSaveClinicalDecisionSupport();
  
  const {
    recommendations,
    redFlags,
    guidelines,
    loading: aiLoading,
    error: aiError
  } = useInvestigationRecommendations(
    chiefComplaint, 
    [], // Will be populated with differential diagnoses
    state.answers, 
    state.rosData
  );

  useEffect(() => {
    loadClinicalData();
  }, [recommendations]);

  const loadClinicalData = async () => {
    try {
      setLoading(true);

      // Generate investigation intelligence
      const intelligenceData = await Promise.all(
        recommendations.map(async (rec) => {
          const intelligence = InvestigationIntelligenceService.generateInvestigationIntelligence(
            rec.investigation.id,
            chiefComplaint,
            { answers: state.answers, rosData: state.rosData },
            []
          );
          return { ...rec, intelligence };
        })
      );
      setInvestigationIntelligence(intelligenceData);

      // Generate treatment recommendations
      const treatment = TreatmentManagementService.generateTreatmentRecommendation(
        chiefComplaint,
        'moderate', // Default severity, could be determined by AI
        state.currentPatient,
        []
      );
      setTreatmentRecommendation(treatment);

    } catch (error) {
      console.error('Failed to load clinical data:', error);
      toast.error('Failed to load clinical recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleInvestigationToggle = (investigationId: string) => {
    setSelectedInvestigations(prev => 
      prev.includes(investigationId)
        ? prev.filter(id => id !== investigationId)
        : [...prev, investigationId]
    );
  };

  const handleMedicationToggle = (medicationId: string) => {
    setSelectedMedications(prev => 
      prev.includes(medicationId)
        ? prev.filter(id => id !== medicationId)
        : [...prev, medicationId]
    );
  };

  const handleNonPharmToggle = (treatment: string) => {
    setSelectedNonPharm(prev => 
      prev.includes(treatment)
        ? prev.filter(t => t !== treatment)
        : [...prev, treatment]
    );
  };

  const calculateTotalCost = () => {
    return investigationIntelligence
      .filter(item => selectedInvestigations.includes(item.investigation.id))
      .reduce((total, item) => total + (item.intelligence.costBenefit.estimatedCost || 0), 0);
  };

  const getCompletionStatus = () => {
    const investigationsSelected = selectedInvestigations.length > 0;
    const treatmentSelected = selectedMedications.length > 0 || selectedNonPharm.length > 0;
    return { investigationsSelected, treatmentSelected };
  };

  const handleSaveClinicalPlan = async () => {
    const clinicalPlan: ClinicalPlan = {
      investigations: {
        selected: selectedInvestigations,
        rationale: investigationRationale,
        estimatedCost: calculateTotalCost()
      },
      treatment: {
        medications: selectedMedications,
        nonPharmacological: selectedNonPharm,
        followUp: followUpPlan
      },
      clinicalNotes
    };

    if (state.currentAssessment) {
      try {
        await saveClinicalPlanMutation.mutateAsync({
          assessmentId: state.currentAssessment.id,
          clinicalPlan
        });
        onComplete(clinicalPlan);
      } catch (error) {
        console.error('Failed to save clinical plan:', error);
        toast.error('Failed to save clinical plan. Please try again.');
      }
    } else {
      onComplete(clinicalPlan);
    }
  };

  const { investigationsSelected, treatmentSelected } = getCompletionStatus();
  const canProceed = investigationsSelected && treatmentSelected;

  if (loading || aiLoading) {
    return (
      <div className="p-6">
        <Card className="max-w-6xl mx-auto">
          <CardContent className="flex items-center justify-center py-12">
            <Brain className="h-8 w-8 animate-pulse text-primary mr-4" />
            <div>
              <p className="text-lg">Generating Clinical Decision Support...</p>
              <p className="text-sm text-muted-foreground">
                AI is analyzing patient data and generating intelligent recommendations
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center space-x-2">
            <Brain className="h-6 w-6 text-primary" />
            <span>Clinical Decision Support</span>
          </CardTitle>
          <p className="text-muted-foreground">
            Chief Complaint: <span className="font-medium">{chiefComplaint}</span>
          </p>
          
          {/* Progress Indicators */}
          <div className="flex space-x-4 mt-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${investigationsSelected ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm">Investigations</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${treatmentSelected ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm">Treatment</span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* AI Error Alert */}
          {aiError && (
            <Alert className="mb-6 border-warning bg-warning/10">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription>
                <div className="font-medium text-warning-foreground mb-2">AI Service Unavailable</div>
                <p className="text-sm">{aiError}</p>
                <p className="text-sm mt-1">Using evidence-based fallback recommendations.</p>
              </AlertDescription>
            </Alert>
          )}

          {/* Red Flags Alert */}
          {redFlags.length > 0 && (
            <Alert className="mb-6 border-destructive bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription>
                <div className="font-medium text-destructive mb-2">Clinical Red Flags Detected:</div>
                {redFlags.map((flag, index) => (
                  <div key={index} className="mb-2">
                    <span className="font-medium">{flag.condition}</span>
                    <Badge className="ml-2 bg-destructive text-destructive-foreground">
                      {flag.severity?.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="investigations" className="flex items-center space-x-2">
                <Microscope className="h-4 w-4" />
                <span>Investigations</span>
                {investigationsSelected && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </TabsTrigger>
              <TabsTrigger value="treatment" className="flex items-center space-x-2">
                <Pill className="h-4 w-4" />
                <span>Treatment & Management</span>
                {treatmentSelected && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              </TabsTrigger>
            </TabsList>

            {/* Investigations Tab */}
            <TabsContent value="investigations" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold flex items-center">
                  <TrendingUp className="h-5 w-5 text-primary mr-2" />
                  Investigation Recommendations
                </h3>
                <Badge variant="outline">
                  {selectedInvestigations.length} selected | Est. ${calculateTotalCost()}
                </Badge>
              </div>

              <div className="space-y-4">
                {investigationIntelligence.map((item, index) => (
                  <Card key={item.investigation.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <Checkbox
                          checked={selectedInvestigations.includes(item.investigation.id)}
                          onCheckedChange={() => handleInvestigationToggle(item.investigation.id)}
                          className="mt-1"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h4 className="font-medium text-lg">{item.investigation.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              Priority {item.priority}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {item.intelligence.overallRecommendation.recommendation.replace('-', ' ').toUpperCase()}
                            </Badge>
                          </div>

                          {/* Cost-Benefit Display */}
                          <div className="grid grid-cols-3 gap-4 mb-3 p-3 bg-muted rounded-lg">
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <DollarSign className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">Cost</span>
                              </div>
                              <p className="text-sm">${item.intelligence.costBenefit.estimatedCost}</p>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">Yield</span>
                              </div>
                              <Progress value={item.intelligence.costBenefit.diagnosticYield} className="h-2" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <Clock className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">Timing</span>
                              </div>
                              <p className="text-xs">{item.timing}</p>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground">{item.clinicalRationale}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Investigation Rationale</h3>
                <Textarea
                  value={investigationRationale}
                  onChange={(e) => setInvestigationRationale(e.target.value)}
                  placeholder="Provide clinical reasoning for selected investigations..."
                  className="min-h-[100px]"
                />
              </div>
            </TabsContent>

            {/* Treatment Tab */}
            <TabsContent value="treatment" className="space-y-6">
              {treatmentRecommendation && (
                <>
                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                      <Pill className="h-5 w-5 text-primary mr-2" />
                      Medication Recommendations
                    </h3>
                    
                    <div className="space-y-4">
                      {treatmentRecommendation.medicationSuggestions.map((medSuggestion, index) => (
                        <Card key={index} className="border-l-4 border-l-secondary">
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-4">
                              <Checkbox
                                checked={selectedMedications.includes(medSuggestion.medication.id)}
                                onCheckedChange={() => handleMedicationToggle(medSuggestion.medication.id)}
                                className="mt-1"
                                disabled={medSuggestion.contraindicated}
                              />
                              
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h4 className="font-medium">{medSuggestion.medication.name}</h4>
                                  <Badge variant="outline">
                                    Level {medSuggestion.evidenceLevel}
                                  </Badge>
                                  {medSuggestion.contraindicated && (
                                    <Badge variant="destructive">Contraindicated</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {medSuggestion.medication.dosage} {medSuggestion.medication.frequency}
                                </p>
                                <p className="text-sm">{medSuggestion.rationale}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">Non-Pharmacological Treatment</h3>
                    
                    <div className="space-y-2">
                      {treatmentRecommendation.nonPharmacological.map((treatment, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <Checkbox
                            checked={selectedNonPharm.includes(treatment)}
                            onCheckedChange={() => handleNonPharmToggle(treatment)}
                          />
                          <span>{treatment}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Follow-up Plan</h3>
                    <Textarea
                      value={followUpPlan}
                      onChange={(e) => setFollowUpPlan(e.target.value)}
                      placeholder="Outline follow-up requirements, monitoring, and next steps..."
                      className="min-h-[100px]"
                    />
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          {/* Clinical Notes */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Additional Clinical Notes</h3>
            <Textarea
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Add any additional clinical reasoning, special considerations, or notes about the clinical plan..."
              className="min-h-[100px]"
            />
          </div>

          {/* Summary Card */}
          <Card className="mt-6 bg-primary/5 border-primary">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="font-medium">Clinical Plan Summary</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Investigations ({selectedInvestigations.length})</p>
                  <p className="text-muted-foreground">Est. Cost: ${calculateTotalCost()}</p>
                </div>
                <div>
                  <p className="font-medium">Treatment Plan</p>
                  <p className="text-muted-foreground">
                    {selectedMedications.length} medications, {selectedNonPharm.length} non-pharm
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button variant="outline" onClick={onBack}>
              Back to Physical Examination
            </Button>
            
            <Button 
              onClick={handleSaveClinicalPlan}
              disabled={!canProceed || saveClinicalPlanMutation.isPending}
              className="flex items-center space-x-2"
            >
              {saveClinicalPlanMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Clinical Plan</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}