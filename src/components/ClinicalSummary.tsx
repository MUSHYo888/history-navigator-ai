// ABOUTME: Comprehensive patient summary displaying complete assessment data
// ABOUTME: Integrates history, examination, clinical decisions, and AI-generated insights
import { generateClinicalVignette } from '../utils/vignetteExporter';
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, Brain, AlertTriangle, Activity, FileText, Send, NotepadText, User, Stethoscope, ClipboardList, Copy } from 'lucide-react';
import { AIService } from '@/services/aiService';
import { DifferentialDiagnosis } from '@/types/medical';
import { useMedical } from '@/context/MedicalContext';
import { useCompleteAssessment } from '@/hooks/useAssessment';
import { useGetClinicalDecisionSupport } from '@/hooks/useGetClinicalDecisionSupport';
import { toast } from 'sonner';
import { AdvancedClinicalSupport } from './AdvancedClinicalSupport';
import { AssessmentDataSummary } from './clinical/AssessmentDataSummary';
import { DifferentialDiagnosisList } from './clinical/DifferentialDiagnosisList';
import { MedicalHistorySummary } from './clinical/MedicalHistorySummary';
import { ClinicalDecisionSummary } from './clinical/ClinicalDecisionSummary';
import { PDFExportButton } from './reports/PDFExportButton';
import { SOAPNotesEditor } from './documentation/SOAPNotesEditor';
import { ReferralLetterGenerator } from './ReferralLetterGenerator';

interface ClinicalSummaryProps {
  chiefComplaint: string;
  onComplete: () => void;
  onBack: () => void;
}

// Circuit Breaker helper to retry critical AI calls with exponential backoff and fallback
const withCircuitBreaker = async <T,>(fn: () => Promise<T>, fallback: T, retries = 3, delay = 1000, signal?: AbortSignal): Promise<T> => {
  try {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    return await fn();
  } catch (error: any) {
    if (error.name === 'AbortError' || signal?.aborted) throw error;
    if (retries === 0) {
      console.warn('Circuit breaker triggered. Using fallback data.');
      return fallback;
    }
    console.warn(`AI Call failed, retrying in ${delay}ms... (${retries} retries left)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return withCircuitBreaker(fn, fallback, retries - 1, delay * 2, signal);
  }
};

export function ClinicalSummary({ chiefComplaint, onComplete, onBack }: ClinicalSummaryProps) {
  const { state } = useMedical();
  const [differentials, setDifferentials] = useState<DifferentialDiagnosis[]>([]);
  const [advancedSupport, setAdvancedSupport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSOAPEditor, setShowSOAPEditor] = useState(false);
  const [showReferralGenerator, setShowReferralGenerator] = useState(false);
  
  const isCompleted = state.currentAssessment?.status === 'completed';
  
  // Guard to prevent duplicate AI calls in React Strict Mode
  const isGeneratingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const completeAssessmentMutation = useCompleteAssessment();
  const { data: clinicalDecisionData, isLoading: clinicalDecisionLoading } = useGetClinicalDecisionSupport(
    state.currentAssessment?.id || ''
  );

  useEffect(() => {
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;

    generateClinicalAnalysis();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const generateClinicalAnalysis = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const signal = abortController.signal;

    setLoading(true);
    setError(null);

    try {
      const fallbackDifferentials: DifferentialDiagnosis[] = [
        {
          condition: 'Clinical Assessment Needed',
          probability: 0,
          explanation: 'AI service unavailable. Proceed with standard clinical evaluation protocols.',
          keyFeatures: [],
          urgency: 'moderate',
          category: 'General',
          redFlags: []
        }
      ];

      const fallbackSupport = {
        clinicalAlerts: [],
        triageRecommendation: {
          priority: 'routine',
          timeframe: 'Standard evaluation',
          location: 'clinic',
          reasoning: 'Standard protocol evaluation required',
          immediateActions: []
        },
        severityScores: [],
        riskAssessment: {
          overallRisk: 'moderate',
          riskScore: 0,
          maxRiskScore: 10,
          riskFactors: [],
          recommendations: ['Follow standard clinical protocols']
        }
      };

      const [diffs, support] = await Promise.all([
        withCircuitBreaker(() => AIService.generateDifferentialDiagnosis(
          chiefComplaint,
          state.answers,
          state.rosData
        ), fallbackDifferentials, 3, 1000, signal),
        withCircuitBreaker(() => AIService.generateAdvancedClinicalSupport(
          chiefComplaint,
          state.answers,
          state.rosData,
          state.peData?.vitalSigns,
          { age: state.currentPatient?.age ?? 45 }
        ), fallbackSupport, 3, 1000, signal)
      ]);

      if (signal.aborted) return;

      setDifferentials(diffs);
      setAdvancedSupport(support);
    } catch (err: any) {
      if (signal.aborted || err.name === 'AbortError') return;
      console.error('Error generating AI analysis:', err);
      setError('Failed to generate clinical analysis. Using clinical reasoning based on available data.');
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  };

  const handleCompleteAssessment = async () => {
    if (isCompleted) {
      return onComplete();
    }
    if (state.currentAssessment) {
      try {
        await completeAssessmentMutation.mutateAsync(state.currentAssessment.id);
        toast.success('Assessment completed successfully');
        onComplete();
      } catch (error) {
        console.error('Failed to complete assessment:', error);
        toast.error('Failed to complete assessment');
      }
    } else {
      onComplete();
    }
  };

  const handleSOAPNoteSaved = () => {
    setShowSOAPEditor(false);
    toast.success('SOAP note documentation completed');
  };

  const handleReferralSaved = () => {
    setShowReferralGenerator(false);
    toast.success('Referral letter saved successfully');
  };

  const handleCopyVignette = async () => {
    const vignetteText = generateClinicalVignette(chiefComplaint, state.answers, state.rosData);
    
    try {
      await navigator.clipboard.writeText(vignetteText);
      alert('✅ Clinical vignette copied to clipboard! Ready to paste into Telegram.');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert('❌ Failed to copy. Please try again.');
    }
  }; 
  
  const handleCopyToClipboard = async () => {
    const sections = [
      `PATIENT SUMMARY`,
      `Chief Complaint: ${chiefComplaint}`,
      state.currentPatient ? `Patient: ${state.currentPatient.name}, ${state.currentPatient.age}y, ${state.currentPatient.gender}` : '',
      '',
      `HISTORY OF PRESENTING ILLNESS`,
      ...Object.entries(state.answers).map(([, a]) => `- ${a.value || ''} ${a.notes ? `(${a.notes})` : ''}`),
      '',
      `REVIEW OF SYSTEMS`,
      ...Object.entries(state.rosData).map(([system, data]: [string, any]) => {
        const pos = data.positive?.length ? `+: ${data.positive.join(', ')}` : '';
        const neg = data.negative?.length ? `-: ${data.negative.join(', ')}` : '';
        return `${system}: ${[pos, neg].filter(Boolean).join(' | ')}`;
      }),
      '',
      `PAST MEDICAL HISTORY`,
      state.pmhData?.conditions?.length ? `Conditions: ${state.pmhData.conditions.join(', ')}` : undefined,
      state.pmhData?.surgeries?.length ? `Surgeries: ${state.pmhData.surgeries.join(', ')}` : undefined,
      state.pmhData?.medications?.length ? `Medications: ${state.pmhData.medications.join(', ')}` : undefined,
      state.pmhData?.allergies?.length ? `Allergies: ${state.pmhData.allergies.join(', ')}` : undefined,
      state.pmhData?.familyHistory ? `Family History: ${state.pmhData.familyHistory}` : undefined,
      state.pmhData?.socialHistory ? `Social History: ${state.pmhData.socialHistory}` : undefined,
      '',
      `PHYSICAL EXAMINATION`,
      state.peData?.vitalSigns ? `Vitals: BP ${state.peData.vitalSigns.bloodPressure || '-'}, HR ${state.peData.vitalSigns.heartRate || '-'}, RR ${state.peData.vitalSigns.respiratoryRate || '-'}, Temp ${state.peData.vitalSigns.temperature || '-'}, SpO2 ${state.peData.vitalSigns.oxygenSaturation || '-'}` : undefined,
      state.peData?.generalAppearance ? `General: ${state.peData.generalAppearance}` : undefined,
      ...(state.peData?.systems ? Object.entries(state.peData.systems).map(([sys, data]: [string, any]) => `${sys}: ${data.normal ? 'Normal' : data.findings?.join(', ')}${data.notes ? ` - ${data.notes}` : ''}`) : []),
      '',
      `DIFFERENTIAL DIAGNOSES`,
      ...differentials.map((d, i) => `${i + 1}. ${d.condition} (${d.probability}%) - ${d.explanation}`),
      '',
      `CLINICAL PLAN`,
      clinicalDecisionData?.investigation_plan?.selected?.length ? `Investigations: ${clinicalDecisionData.investigation_plan.selected.join(', ')}` : undefined,
      clinicalDecisionData?.investigation_plan?.results?.length ? `Lab Results: ${clinicalDecisionData.investigation_plan.results.map((r: any) => `${r.name}: ${r.value}`).join(', ')}` : undefined,
      clinicalDecisionData?.treatment_plan?.medications?.length ? `Treatment Medications: ${clinicalDecisionData.treatment_plan.medications.join(', ')}` : undefined,
      clinicalDecisionData?.treatment_plan?.nonPharmacological?.length ? `Non-Pharm: ${clinicalDecisionData.treatment_plan.nonPharmacological.join(', ')}` : undefined,
      clinicalDecisionData?.treatment_plan?.followUp ? `Follow-up: ${clinicalDecisionData.treatment_plan.followUp}` : undefined,
      clinicalDecisionData?.clinical_notes ? `Clinical Notes: ${clinicalDecisionData.clinical_notes}` : undefined,
    ].filter(line => line !== undefined).join('\n');

    try {
      await navigator.clipboard.writeText(sections);
      toast.success('Clinical summary copied to clipboard');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const generateSOAPInitialData = () => {
    const subjective = [
      `Chief Complaint: ${chiefComplaint}`,
      '',
      `HISTORY OF PRESENTING ILLNESS:`,
      ...Object.entries(state.answers).map(([, a]) => `- ${a.value || ''} ${a.notes ? `(${a.notes})` : ''}`),
      '',
      `REVIEW OF SYSTEMS:`,
      ...Object.entries(state.rosData).map(([system, data]: [string, any]) => {
        const pos = data.positive?.length ? `+: ${data.positive.join(', ')}` : '';
        const neg = data.negative?.length ? `-: ${data.negative.join(', ')}` : '';
        return (pos || neg) ? `${system}: ${[pos, neg].filter(Boolean).join(' | ')}` : null;
      }).filter(Boolean),
      '',
      `PAST MEDICAL HISTORY:`,
      state.pmhData?.conditions?.length ? `Conditions: ${state.pmhData.conditions.join(', ')}` : undefined,
      state.pmhData?.surgeries?.length ? `Surgeries: ${state.pmhData.surgeries.join(', ')}` : undefined,
      state.pmhData?.medications?.length ? `Medications: ${state.pmhData.medications.join(', ')}` : undefined,
      state.pmhData?.allergies?.length ? `Allergies: ${state.pmhData.allergies.join(', ')}` : undefined,
      state.pmhData?.familyHistory ? `Family History: ${state.pmhData.familyHistory}` : undefined,
      state.pmhData?.socialHistory ? `Social History: ${state.pmhData.socialHistory}` : undefined,
    ].filter(line => line !== undefined).join('\n');

    const objective = [
      `PHYSICAL EXAMINATION:`,
      state.peData?.vitalSigns ? `Vitals: BP ${state.peData.vitalSigns.bloodPressure || '-'}, HR ${state.peData.vitalSigns.heartRate || '-'}, RR ${state.peData.vitalSigns.respiratoryRate || '-'}, Temp ${state.peData.vitalSigns.temperature || '-'}, SpO2 ${state.peData.vitalSigns.oxygenSaturation || '-'}` : undefined,
      state.peData?.generalAppearance ? `General: ${state.peData.generalAppearance}` : undefined,
      ...(state.peData?.systems ? Object.entries(state.peData.systems).map(([sys, data]: [string, any]) => {
        const findings = data.normal ? 'Normal' : data.findings?.join(', ');
        return findings || data.notes ? `${sys}: ${findings}${data.notes ? ` - ${data.notes}` : ''}` : null;
      }).filter(Boolean) : []),
    ].filter(line => line !== undefined).join('\n');

    const assessment = [
      `DIFFERENTIAL DIAGNOSES:`,
      ...differentials.map((d, i) => `${i + 1}. ${d.condition} (${d.probability}%) - ${d.explanation}`),
    ].join('\n');

    const plan = [
      `CLINICAL PLAN:`,
      clinicalDecisionData?.investigation_plan?.selected?.length ? `Investigations: ${clinicalDecisionData.investigation_plan.selected.join(', ')}` : undefined,
      clinicalDecisionData?.investigation_plan?.results?.length ? `Lab Results: ${clinicalDecisionData.investigation_plan.results.map((r: any) => `${r.name}: ${r.value}`).join(', ')}` : undefined,
      clinicalDecisionData?.treatment_plan?.medications?.length ? `Treatment Medications: ${clinicalDecisionData.treatment_plan.medications.join(', ')}` : undefined,
      clinicalDecisionData?.treatment_plan?.nonPharmacological?.length ? `Non-Pharm: ${clinicalDecisionData.treatment_plan.nonPharmacological.join(', ')}` : undefined,
      clinicalDecisionData?.treatment_plan?.followUp ? `Follow-up: ${clinicalDecisionData.treatment_plan.followUp}` : undefined,
    ].filter(line => line !== undefined).join('\n');

    return {
      subjective: subjective.trim(),
      objective: objective.trim(),
      assessment: assessment.trim(),
      plan: plan.trim(),
      additionalNotes: clinicalDecisionData?.clinical_notes || ''
    };
  };

  if (loading || clinicalDecisionLoading) {
    return (
      <div className="p-6">
        <Card className="max-w-6xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-lg">Generating Patient Summary...</p>
            <p className="text-sm text-muted-foreground">
              Compiling comprehensive assessment data and clinical decisions
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showSOAPEditor) {
    return (
      <SOAPNotesEditor
        assessmentId={state.currentAssessment?.id || ''}
        initialData={generateSOAPInitialData()}
        onSave={handleSOAPNoteSaved}
        onCancel={() => setShowSOAPEditor(false)}
      />
    );
  }

  if (showReferralGenerator && state.currentAssessment && state.currentPatient) {
    return (
      <ReferralLetterGenerator
        assessmentId={state.currentAssessment.id}
        patient={state.currentPatient}
        chiefComplaint={chiefComplaint}
        differentials={differentials}
        answers={state.answers}
        rosData={state.rosData}
        onSave={handleReferralSaved}
        onCancel={() => setShowReferralGenerator(false)}
      />
    );
  }

  return (
    <div className="p-6">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center space-x-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            <span>Patient Summary & Assessment</span>
          </CardTitle>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              Chief Complaint: <span className="font-medium">{chiefComplaint}</span>
            </p>
            {state.currentPatient && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>{state.currentPatient.name} • {state.currentPatient.age}y • {state.currentPatient.gender}</span>
              </Badge>
            )}
          </div>
          
          {error && (
            <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Clinical Documentation Actions */}
          <div className="flex flex-wrap gap-3 p-4 bg-muted/50 rounded-lg">
            <h3 className="w-full text-lg font-semibold mb-2">
              📋 Clinical Documentation & Actions
            </h3>
            
            {state.currentPatient && state.currentAssessment && (
              <PDFExportButton
                assessmentId={state.currentAssessment.id}
                patient={state.currentPatient}
                chiefComplaint={chiefComplaint}
                answers={state.answers}
                rosData={state.rosData}
                differentials={differentials}
                pmhData={state.pmhData}
                peData={state.peData}
                variant="default"
              />
            )}
            
            <Button
              onClick={() => setShowSOAPEditor(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <NotepadText className="h-4 w-4" />
              Create SOAP Note
            </Button>
            
            <Button
              onClick={() => setShowReferralGenerator(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Generate Referral Letter
            </Button>
            
            <Button
              onClick={handleCopyVignette}
              variant="outline"
              className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200"
            >
              <Copy className="h-4 w-4" />
              Copy as Clinical Vignette
            </Button>

            <Button
              onClick={handleCopyToClipboard}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy to Clipboard
            </Button>
          </div>

          {/* Assessment Data Overview */}
          <AssessmentDataSummary
            answersCount={Object.keys(state.answers).length}
            rosCount={Object.keys(state.rosData).length}
            pmhComplete={Boolean(state.pmhData)}
            differentialsCount={differentials.length}
          />

          <Separator />

          {/* Medical History & Examination Summary */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">History & Physical Examination</h3>
            </div>
            
            <MedicalHistorySummary
              pmhData={state.pmhData}
              peData={state.peData}
            />
          </div>

          <Separator />

          {/* Clinical Decision Support Summary */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-semibold">Clinical Decision Support</h3>
            </div>
            
            <ClinicalDecisionSummary clinicalDecisionData={clinicalDecisionData} />
          </div>

          <Separator />

          {/* AI-Generated Differential Diagnoses */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-secondary" />
                <h3 className="text-xl font-semibold">Differential Diagnosis</h3>
              </div>
              {!isCompleted && (
              <Button
              onClick={() => {
                if (loading) return;
                generateClinicalAnalysis();
              }}
                variant="outline"
                size="sm"
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Brain className="h-3 w-3" />
                )}
                Regenerate AI Analysis
              </Button>
              )}
            </div>
            
            <DifferentialDiagnosisList differentials={differentials} />
          </div>

          {/* Advanced Clinical Decision Support */}
          {advancedSupport && (
            <>
              <Separator />
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-accent" />
                  <h3 className="text-xl font-semibold">Advanced Clinical Insights</h3>
                </div>
                <AdvancedClinicalSupport clinicalSupport={advancedSupport} />
              </div>
            </>
          )}

          <Separator />

          {/* Final Actions */}
          <div className="flex justify-between items-center pt-6">
            {!isCompleted && (<Button variant="outline" onClick={onBack}>
              Back to Clinical Decision Support
            </Button>)}
            
            {!isCompleted ? (
            <Button 
              onClick={handleCompleteAssessment}
              disabled={completeAssessmentMutation.isPending}
              className="flex items-center space-x-2"
            >
              {completeAssessmentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Completing...</span>
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  <span>Complete Assessment</span>
                </>
              )}
            </Button>
            ) : (
            <Button onClick={onComplete} className="ml-auto">
              Return to Dashboard
            </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}