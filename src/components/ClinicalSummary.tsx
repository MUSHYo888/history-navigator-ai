import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Loader2, Brain, AlertTriangle, Activity, FileText, User,
  Stethoscope, Copy, Microscope, TrendingUp, TrendingDown, BookOpen, Check, ShieldAlert
} from 'lucide-react';
import { AIService } from '@/services/aiService';
import { useMedical } from '@/context/MedicalContext';
import { useCompleteAssessment } from '@/hooks/useAssessment';
import { DifferentialDiagnosis } from '@/types/medical';
import { toast } from 'sonner';

interface ExtendedDiagnosis extends DifferentialDiagnosis {
  statOrders?: string[];
  guidelineCitation?: string;
}

export const ClinicalSummary = ({ onComplete, onBack }: { onComplete?: () => void, onBack?: () => void }) => {
  const { state } = useMedical();
  
  // FIXED: Wrapped in String() to satisfy strict typing
  const chiefComplaint = String(state.currentAssessment?.chiefComplaint || state.answers['chief_complaint']?.value || 'Unknown');
  
  const completeAssessmentMutation = useCompleteAssessment();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [differentials, setDifferentials] = useState<ExtendedDiagnosis[]>([]);
  const [pertinentNegatives, setPertinentNegatives] = useState<string[]>([]);
  const [soapNote, setSoapNote] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  const generateClinicalAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const diffs = await AIService.generateDifferentialDiagnosis(
        chiefComplaint,
        state.answers,
        state.rosData
      );
      const responseData = diffs as unknown as {
        differentialDiagnoses?: ExtendedDiagnosis[];
        pertinentNegatives?: string[];
        soapNote?: string;
      };
      setDifferentials(responseData.differentialDiagnoses || (Array.isArray(diffs) ? diffs : []));
      setPertinentNegatives(responseData.pertinentNegatives || []);
      setSoapNote(responseData.soapNote || '');
    } catch (err) {
      console.error('Error generating clinical analysis:', err);
      setError('Failed to generate differential diagnosis. Using clinical reasoning based on available data.');
    } finally {
      setLoading(false);
    }
  }, [chiefComplaint, state.answers, state.rosData]);

  useEffect(() => {
    if (!state.currentAssessment && !state.answers) return;
    generateClinicalAnalysis();
  }, [generateClinicalAnalysis, state.answers, state.currentAssessment]);

  const handleCopyToClipboardNote = async () => {
    try {
      await navigator.clipboard.writeText(soapNote || 'No clinical note generated.');
      setIsCopied(true);
      toast.success('Clinical summary copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleCompleteAssessment = async () => {
    if (state.currentAssessment?.status === 'completed' && onComplete) {
      return onComplete();
    }

    if (state.currentAssessment) {
      try {
        await completeAssessmentMutation.mutateAsync(state.currentAssessment.id);
        toast.success('Assessment saved to patient records!');
        if (onComplete) onComplete();
      } catch (err) {
        console.error('Failed to complete assessment:', err);
        toast.error('Failed to save assessment');
      }
    } else if (onComplete) {
      onComplete();
    }
  };

  const getLikelihoodBadge = (likelihood: string) => {
    switch (likelihood) {
      case 'High': return <Badge variant="destructive">High Likelihood</Badge>;
      case 'Medium': return <Badge variant="warning">Medium Likelihood</Badge>;
      case 'Low': return <Badge variant="secondary">Low Likelihood</Badge>;
      default: return <Badge variant="outline">{likelihood}</Badge>;
    }
  };

  const renderVital = (label: string, vitalValue: string | undefined, isBadUp: boolean, isBadDown: boolean) => {
    if (!vitalValue || vitalValue === '-') return null;
    const vital = { current: vitalValue, trend: "stable" };
    let trendColor = "text-muted-foreground";
    if (vital.trend === 'up' && isBadUp) trendColor = "text-red-500";
    if (vital.trend === 'down' && isBadDown) trendColor = "text-red-500";
    return (
      <div className="flex flex-col">
        <span className="text-muted-foreground text-xs uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="font-semibold text-gray-900">{vital.current}</span>
          {vital.trend === 'up' && <TrendingUp className={`h-3.5 w-3.5 ${trendColor}`} />}
          {vital.trend === 'down' && <TrendingDown className={`h-3.5 w-3.5 ${trendColor}`} />}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Generating Advanced Clinical Analysis...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50/50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">Patient Summary & Assessment</h1>
            <p className="text-muted-foreground">Clinical Workspace & EHR Assessment Plan</p>
          </div>
          <div className="flex gap-3">
             {onBack && (
               <Button onClick={onBack} variant="outline">
                 Back
               </Button>
             )}
             <Button onClick={generateClinicalAnalysis} variant="outline" disabled={loading}>
                <Brain className="h-4 w-4 mr-2" />
                Regenerate AI Analysis
             </Button>
             <Button onClick={handleCompleteAssessment} className="bg-primary" disabled={completeAssessmentMutation.isPending}>
                {completeAssessmentMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                Complete Assessment
             </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Notice</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" /> Patient Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="font-medium text-lg">{state.currentPatient?.name || 'Unknown Patient'}</div>
                    <div className="text-sm text-muted-foreground">{state.currentPatient?.age || '--'} yo {state.currentPatient?.gender || '--'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Chief Complaint</div>
                    <div className="text-sm text-destructive font-medium">{chiefComplaint}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm bg-muted/50 p-3 rounded-lg border">
                     {renderVital('BP', state.peData?.vitalSigns?.bloodPressure || '120/80', true, false)}
                     {renderVital('HR', state.peData?.vitalSigns?.heartRate || '80', true, false)}
                     {renderVital('RR', state.peData?.vitalSigns?.respiratoryRate || '16', true, false)}
                     {renderVital('SpO2', state.peData?.vitalSigns?.oxygenSaturation || '98%', false, true)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Stethoscope className="h-5 w-5 text-primary" /> Subjective
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-semibold mb-1">History of Present Illness</div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {Object.entries(state.answers).length > 0 
                      ? Object.entries(state.answers).map(([, a]) => `${a.value || ''} ${a.notes ? `(${a.notes})` : ''}`).join('. ')
                      : 'No HPI data recorded.'}
                  </p>
                </div>
                {pertinentNegatives.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold mb-2">Pertinent Negatives</div>
                    <div className="flex flex-wrap gap-2">
                      {pertinentNegatives.map((neg, i) => (
                        <Badge key={i} variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200">{neg}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" /> Drafted Clinical Note
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleCopyToClipboardNote} className={isCopied ? "text-green-600 border-green-200 bg-green-50" : ""}>
                  {isCopied ? <><Check className="h-4 w-4 mr-2" /> Copied!</> : <><Copy className="h-4 w-4 mr-2" /> Copy</>}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 p-4 rounded-lg border text-sm font-mono whitespace-pre-wrap text-gray-700 leading-relaxed shadow-inner">
                  {soapNote || 'No clinical note generated yet.'}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6">
            <Card className="border-t-4 border-t-primary shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" /> Differential Diagnoses & Plan
                </CardTitle>
                <CardDescription>AI-generated clinical reasoning and suggested workup.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {differentials.length === 0 && <p className="text-muted-foreground text-sm">No differentials generated.</p>}
                {differentials.map((ddx, index) => {
                  const likelihood = ddx.probability >= 70 ? 'High' : ddx.probability >= 30 ? 'Medium' : 'Low';
                  return (
                    <div key={index} className="p-4 rounded-xl border bg-card transition-all hover:shadow-md">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{ddx.condition}</h3>
                          <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                            Probability: {ddx.probability}%
                          </div>
                        </div>
                        <div className="shrink-0">
                          {getLikelihoodBadge(likelihood)}
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 mb-4 bg-muted/30 p-3 rounded-lg">
                        <span className="font-medium text-gray-900">Clinical Rationale: </span>
                        {ddx.explanation}
                      </div>
                      {ddx.statOrders && ddx.statOrders.length > 0 && (
                        <div>
                          <div className="text-sm font-medium flex items-center gap-1.5 mb-3 text-destructive">
                            <Microscope className="h-4 w-4" /> STAT Orders (CPOE)
                          </div>
                          <div className="space-y-2.5 bg-muted/20 p-3 rounded-lg border shadow-sm">
                            {ddx.statOrders.map((inv: string, idx: number) => (
                              <div key={idx} className="flex items-start space-x-3">
                                <Checkbox id={`ddx-${index}-inv-${idx}`} className="mt-0.5 border-gray-400 data-[state=checked]:bg-destructive data-[state=checked]:border-destructive" />
                                <Label htmlFor={`ddx-${index}-inv-${idx}`} className="text-sm font-medium cursor-pointer leading-tight text-gray-700">
                                  {inv}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {ddx.guidelineCitation && (
                        <div className="mt-4">
                          <Separator className="mb-3" />
                          <div className="flex items-start gap-1.5 text-xs text-muted-foreground italic">
                            <BookOpen className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>Evidence Basis: {ddx.guidelineCitation}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="p-4 bg-muted/40 border rounded-lg flex items-start gap-3 text-sm text-muted-foreground mt-6 shadow-sm">
              <ShieldAlert className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <p>
                <strong className="text-gray-700">DISCLAIMER:</strong> This assessment is generated by AI Clinical Decision Support (or fallback protocols) and is for informational purposes only. It must be independently verified by a qualified healthcare professional.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};