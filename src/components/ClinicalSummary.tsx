
// ABOUTME: Comprehensive patient summary displaying complete assessment data
// ABOUTME: Integrates history, examination, clinical decisions, and AI-generated insights
import React, { useState, useEffect } from 'react';
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

export function ClinicalSummary({ chiefComplaint, onComplete, onBack }: ClinicalSummaryProps) {
  const { state } = useMedical();
  const [differentials, setDifferentials] = useState<DifferentialDiagnosis[]>([]);
  const [advancedSupport, setAdvancedSupport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSOAPEditor, setShowSOAPEditor] = useState(false);
  const [showReferralGenerator, setShowReferralGenerator] = useState(false);
  
  const completeAssessmentMutation = useCompleteAssessment();
  const { data: clinicalDecisionData, isLoading: clinicalDecisionLoading } = useGetClinicalDecisionSupport(
    state.currentAssessment?.id || ''
  );

  useEffect(() => {
    generateDifferentials();
    generateAdvancedSupport();
  }, []);

  const generateDifferentials = async () => {
    try {
      setLoading(true);
      setError(null);
      
        chiefComplaint,
        answers: state.answers,
        rosData: state.rosData
      });

      const differentialDiagnoses = await AIService.generateDifferentialDiagnosis(
        chiefComplaint,
        state.answers,
        state.rosData
      );

      setDifferentials(differentialDiagnoses);
    } catch (err) {
      console.error('Error generating differentials:', err);
      setError('Failed to generate differential diagnosis. Using clinical reasoning based on available data.');
    } finally {
      setLoading(false);
    }
  };

  const generateAdvancedSupport = async () => {
    try {
      
      const support = await AIService.generateAdvancedClinicalSupport(
        chiefComplaint,
        state.answers,
        state.rosData,
        state.peData?.vitalSigns,
        { age: 45 }
      );
      
      setAdvancedSupport(support);
    } catch (error) {
      console.error('Error generating advanced support:', error);
    }
  };

  const handleCompleteAssessment = async () => {
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
      `DIFFERENTIAL DIAGNOSES`,
      ...differentials.map((d, i) => `${i + 1}. ${d.condition} (${d.probability}%) - ${d.explanation}`),
    ].filter(line => line !== undefined).join('\n');

    try {
      await navigator.clipboard.writeText(sections);
      toast.success('Clinical summary copied to clipboard');
    } catch {
      toast.error('Failed to copy to clipboard');
    }
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
              <Button
                onClick={generateDifferentials}
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
            <Button variant="outline" onClick={onBack}>
              Back to Clinical Decision Support
            </Button>
            
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
