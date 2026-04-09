// ABOUTME: Unified clinical decision support component integrating investigations and treatment planning
// ABOUTME: Provides seamless workflow between diagnostic testing and therapeutic decisions

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BreadcrumbNavigation } from '@/components/ui/breadcrumb-navigation';
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
  Loader2,
  Info,
  Zap,
  Target,
  Circle,
  Calculator
} from 'lucide-react';
import { useInvestigationRecommendations } from '@/hooks/useInvestigationRecommendations';
import { InvestigationIntelligenceService } from '@/services/investigationIntelligenceService';
import { TreatmentManagementService } from '@/services/treatmentManagementService';
import { DifferentialDiagnosisEngine } from './DifferentialDiagnosisEngine';
import { ClinicalScoringSystem } from './ClinicalScoringSystem';
import { useMedical } from '@/context/MedicalContext';
import { useSaveClinicalDecisionSupport } from '@/hooks/useClinicalDecisionSupport';
import { toast } from 'sonner';

interface ClinicalDecisionSupportProps {
  chiefComplaint: string;
  onComplete: (clinicalPlan: ClinicalPlan) => void;
  onBack: () => void;
  onNavigateToStep?: (step: string) => void;
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
  onBack,
  onNavigateToStep
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
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showContinue, setShowContinue] = useState(false);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Show "continue anyway" after 15 seconds of loading
  useEffect(() => {
    if (loading || aiLoading) {
      const timer = setTimeout(() => setShowContinue(true), 15000);
      return () => clearTimeout(timer);
    } else {
      setShowContinue(false);
    }
  }, [loading, aiLoading]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (selectedInvestigations.length > 0 || selectedMedications.length > 0 || clinicalNotes.trim()) {
        handleAutoSave();
      }
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [selectedInvestigations, selectedMedications, selectedNonPharm, clinicalNotes, investigationRationale, followUpPlan]);

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
    const hasRationale = investigationRationale.trim() !== '';
    const hasFollowUp = followUpPlan.trim() !== '';
    return { investigationsSelected, treatmentSelected, hasRationale, hasFollowUp };
  };

  const validateClinicalPlan = () => {
    const errors: string[] = [];
    
    if (selectedInvestigations.length === 0) {
      errors.push('At least one investigation must be selected');
    }
    
    if (selectedMedications.length === 0 && selectedNonPharm.length === 0) {
      errors.push('At least one treatment option must be selected');
    }
    
    if (!investigationRationale.trim()) {
      errors.push('Investigation rationale is required');
    }
    
    if (!followUpPlan.trim()) {
      errors.push('Follow-up plan is required');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleAutoSave = async () => {
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
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  };

  const handleSaveClinicalPlan = async () => {
    if (!validateClinicalPlan()) {
      toast.error('Please complete all required fields before proceeding');
      return;
    }

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

  const { investigationsSelected, treatmentSelected, hasRationale, hasFollowUp } = getCompletionStatus();
  const canProceed = investigationsSelected && treatmentSelected && hasRationale && hasFollowUp;

  // Breadcrumb steps
  const breadcrumbSteps = [
    { id: 'history', label: 'History', completed: true, current: false, clickable: true },
    { id: 'ros', label: 'Review of Systems', completed: true, current: false, clickable: true },
    { id: 'pmh', label: 'Past Medical History', completed: true, current: false, clickable: true },
    { id: 'physical', label: 'Physical Exam', completed: true, current: false, clickable: true },
    { id: 'clinical-support', label: 'Clinical Decision Support', completed: false, current: true, clickable: false },
    { id: 'summary', label: 'Patient Summary', completed: false, current: false, clickable: false }
  ];

  const handleBreadcrumbClick = (stepId: string) => {
    if (onNavigateToStep) {
      onNavigateToStep(stepId);
    }
  };

  if (loading || aiLoading) {
    return (
      <div className="p-6">
        <Card className="max-w-6xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="h-8 w-8 animate-pulse text-primary mb-4" />
            <p className="text-lg font-medium mb-2">Generating Clinical Decision Support...</p>
            <p className="text-sm text-muted-foreground mb-4">
              AI is analyzing patient data and generating intelligent recommendations
            </p>
            <p className="text-xs text-muted-foreground">This usually takes 10-20 seconds</p>
            
            {showContinue && (
              <div className="mt-6 text-center">
                <Alert className="border-yellow-500 bg-yellow-50 mb-4">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    AI service is taking longer than expected
                  </AlertDescription>
                </Alert>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setLoading(false);
                    toast.info('Using evidence-based clinical protocols');
                  }}
                >
                  Continue with Clinical Protocols
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <BreadcrumbNavigation steps={breadcrumbSteps} onStepClick={handleBreadcrumbClick} />
          
          <CardTitle className="text-2xl flex items-center space-x-2">
            <Brain className="h-6 w-6 text-primary" />
            <span>Clinical Decision Support</span>
          </CardTitle>
          <p className="text-muted-foreground">
            Chief Complaint: <span className="font-medium">{chiefComplaint}</span>
          </p>
          
          {/* Enhanced Progress Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="flex items-center space-x-2 p-2 rounded-lg bg-muted/50">
              <div className={`w-3 h-3 rounded-full ${investigationsSelected ? 'bg-success' : 'bg-muted-foreground/40'}`} />
              <span className="text-sm font-medium">Investigations</span>
              {investigationsSelected && <CheckCircle2 className="h-4 w-4 text-success" />}
            </div>
            <div className="flex items-center space-x-2 p-2 rounded-lg bg-muted/50">
              <div className={`w-3 h-3 rounded-full ${treatmentSelected ? 'bg-success' : 'bg-muted-foreground/40'}`} />
              <span className="text-sm font-medium">Treatment</span>
              {treatmentSelected && <CheckCircle2 className="h-4 w-4 text-success" />}
            </div>
            <div className="flex items-center space-x-2 p-2 rounded-lg bg-muted/50">
              <div className={`w-3 h-3 rounded-full ${hasRationale ? 'bg-success' : 'bg-muted-foreground/40'}`} />
              <span className="text-sm font-medium">Rationale</span>
              {hasRationale && <CheckCircle2 className="h-4 w-4 text-success" />}
            </div>
            <div className="flex items-center space-x-2 p-2 rounded-lg bg-muted/50">
              <div className={`w-3 h-3 rounded-full ${hasFollowUp ? 'bg-success' : 'bg-muted-foreground/40'}`} />
              <span className="text-sm font-medium">Follow-up</span>
              {hasFollowUp && <CheckCircle2 className="h-4 w-4 text-success" />}
            </div>
          </div>
          
          {/* Auto-save indicator */}
          {saveClinicalPlanMutation.isPending && (
            <Alert className="mt-4">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <AlertDescription>Auto-saving clinical plan...</AlertDescription>
            </Alert>
          )}
        </CardHeader>

        <CardContent>
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert className="mb-6 border-destructive">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription>
                <div className="font-medium text-destructive mb-2">Please complete the following:</div>
                <ul className="text-sm space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Circle className="h-2 w-2 fill-current" />
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="diagnosis" className="flex items-center space-x-2">
                <Brain className="h-4 w-4" />
                <span>AI Diagnosis</span>
              </TabsTrigger>
              <TabsTrigger value="scoring" className="flex items-center space-x-2">
                <Calculator className="h-4 w-4" />
                <span>Clinical Scores</span>
              </TabsTrigger>
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

            {/* AI Differential Diagnosis Tab */}
            <TabsContent value="diagnosis" className="space-y-6">
              <DifferentialDiagnosisEngine
                chiefComplaint={chiefComplaint}
                assessmentId={state.currentAssessment?.id}
                onDiagnosisGenerated={(diagnoses) => {
                  toast.success(`Generated ${diagnoses.length} differential diagnoses`);
                }}
              />
            </TabsContent>

            {/* Clinical Scoring Systems Tab */}
            <TabsContent value="scoring" className="space-y-6">
              <ClinicalScoringSystem
                chiefComplaint={chiefComplaint}
                patientData={state.currentPatient}
              />
            </TabsContent>

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

                          {/* Enhanced Cost-Benefit Display */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3 p-4 bg-muted/50 rounded-lg border">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <DollarSign className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">Cost Analysis</span>
                              </div>
                              <p className="text-lg font-semibold">${item.intelligence.costBenefit.estimatedCost}</p>
                              <Badge variant="outline" className="text-xs">
                                {item.intelligence.costBenefit.costCategory.replace('-', ' ')}
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <Target className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">Diagnostic Yield</span>
                              </div>
                              <div className="space-y-1">
                                <Progress value={item.intelligence.costBenefit.diagnosticYield} className="h-3" />
                                <p className="text-sm font-semibold">{item.intelligence.costBenefit.diagnosticYield}%</p>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <Zap className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">Clinical Benefit</span>
                              </div>
                              <div className="space-y-1">
                                <Progress value={item.intelligence.costBenefit.clinicalBenefit * 10} className="h-3" />
                                <p className="text-sm font-semibold">{item.intelligence.costBenefit.clinicalBenefit}/10</p>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">Timing</span>
                              </div>
                              <p className="text-sm font-semibold">{item.timing}</p>
                              <p className="text-xs text-muted-foreground">Priority {item.priority}</p>
                            </div>
                          </div>

                          {/* Enhanced Contraindications & Safety */}
                          {item.intelligence.contraindications.riskAssessment !== 'low' && (
                            <Alert className="mb-3 border-warning bg-warning/10">
                              <Shield className="h-4 w-4 text-warning" />
                              <AlertDescription>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-warning-foreground">Safety Assessment</span>
                                  <Badge variant="outline" className="bg-warning/20 text-warning-foreground">
                                    {item.intelligence.contraindications.riskAssessment} risk
                                  </Badge>
                                </div>
                                
                                {item.intelligence.contraindications.contraindications.length > 0 && (
                                  <div className="mb-2">
                                    <p className="text-sm font-medium mb-1">Contraindications:</p>
                                    {item.intelligence.contraindications.contraindications.map((contraindication, idx) => (
                                      <p key={idx} className="text-sm flex items-center space-x-2">
                                        <Badge variant={contraindication.type === 'absolute' ? 'destructive' : 'secondary'} className="text-xs">
                                          {contraindication.type}
                                        </Badge>
                                        <span>{contraindication.condition}</span>
                                      </p>
                                    ))}
                                  </div>
                                )}

                                {item.intelligence.contraindications.warnings.length > 0 && (
                                  <div className="mb-2">
                                    <p className="text-sm font-medium mb-1">Warnings:</p>
                                    {item.intelligence.contraindications.warnings.map((warning, idx) => (
                                      <p key={idx} className="text-sm">• {warning.description}</p>
                                    ))}
                                  </div>
                                )}

                                {item.intelligence.contraindications.alternativeRecommendations.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium mb-1">Alternative Investigations:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {item.intelligence.contraindications.alternativeRecommendations.map((alt, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-xs">
                                          {alt}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </AlertDescription>
                            </Alert>
                          )}

                          <p className="text-sm text-muted-foreground">{item.clinicalRationale}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Info className="h-5 w-5 text-primary mr-2" />
                  Investigation Rationale
                  <span className="text-destructive ml-1">*</span>
                </h3>
                <Textarea
                  value={investigationRationale}
                  onChange={(e) => setInvestigationRationale(e.target.value)}
                  placeholder="Provide detailed clinical reasoning for selected investigations, considering cost-benefit analysis and patient-specific factors..."
                  className={`min-h-[120px] ${!hasRationale && validationErrors.length > 0 ? 'border-destructive' : ''}`}
                />
                {!hasRationale && validationErrors.length > 0 && (
                  <p className="text-sm text-destructive mt-1">Clinical rationale is required</p>
                )}
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
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Clock className="h-5 w-5 text-primary mr-2" />
                      Follow-up Plan
                      <span className="text-destructive ml-1">*</span>
                    </h3>
                    <Textarea
                      value={followUpPlan}
                      onChange={(e) => setFollowUpPlan(e.target.value)}
                      placeholder="Outline specific follow-up requirements, monitoring plans, timeframes, and next steps for patient care..."
                      className={`min-h-[120px] ${!hasFollowUp && validationErrors.length > 0 ? 'border-destructive' : ''}`}
                    />
                    {!hasFollowUp && validationErrors.length > 0 && (
                      <p className="text-sm text-destructive mt-1">Follow-up plan is required</p>
                    )}
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