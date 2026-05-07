import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Download, ArrowLeft, Loader2 } from 'lucide-react';
import { useMedical } from '@/context/MedicalContext';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { DifferentialDiagnosis, Answer } from '@/types/medical';
import { useGetClinicalDecisionSupport } from '@/hooks/useGetClinicalDecisionSupport';
import { useNavigate } from 'react-router-dom';

interface ClinicalSummaryProps {
  onBack?: () => void;
  chiefComplaint?: string;
  hpiNote?: string;
  onComplete?: () => void;
}

export function ClinicalSummary({ onBack, chiefComplaint, hpiNote, onComplete }: ClinicalSummaryProps) {
  const { state } = useMedical();
  const patient = state.currentPatient;
  const assessment = state.currentAssessment;
  const navigate = useNavigate();
  
  const [differentials, setDifferentials] = useState<DifferentialDiagnosis[]>([]);
  const [loading, setLoading] = useState(false);

  const { data: cdsData, isLoading: cdsLoading } = useGetClinicalDecisionSupport(assessment?.id || '');

  useEffect(() => {
    async function fetchDifferentials() {
      if (!assessment?.id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('differential_diagnoses')
          .select('*')
          .eq('assessment_id', assessment.id)
          .order('probability', { ascending: false });
          
        if (!error && data) {
          setDifferentials(data.map(d => ({
            condition: d.condition_name,
            probability: d.probability,
            explanation: d.explanation || '',
            keyFeatures: (d.key_features as string[]) || []
          })));
        }
      } catch (err) {
        console.error("Error fetching differentials:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDifferentials();
  }, [assessment?.id]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    console.log('Exporting PDF...');
  };

  const handleBackToProfile = () => {
    navigate('/');
  };

  // Formatting helpers
  const hpi = hpiNote || Object.values(state.answers || {})
    ?.map((a: Answer) => {
      let text = String(a?.value || '');
      if (a?.notes) text += ` (${a.notes})`;
      return text;
    })
    ?.filter(Boolean)
    ?.join('. ') || '';

  const positiveRos = Object.entries(state.rosData || {})
    ?.map(([system, data]: [string, { positive: string[]; negative: string[]; notes?: string }]) => {
      if (data?.positive && Array.isArray(data.positive) && data.positive.length > 0) {
        return `${system}: ${data.positive.join(', ')}`;
      }
      return null;
    })
    ?.filter(Boolean) || [];

  const pmh = state.pmhData;
  const vitals = state.peData?.vitalSigns;
  const peSystems = Object.entries(state.peData?.systems || {})
    ?.map(([system, data]: [string, { normal: boolean; findings: string[]; notes: string }]) => {
      if (data?.normal) return `${system}: Normal`;
      const findings = Array.isArray(data?.findings) ? data.findings.join(', ') : '';
      const notes = data?.notes ? ` - ${data.notes}` : '';
      if (findings || notes) return `${system}: ${findings}${notes}`;
      return null;
    })
    ?.filter(Boolean) || [];

  const investigationPlan = cdsData?.investigation_plan as { selected?: string[]; rationale?: string; estimatedCost?: number; results?: { name: string; value: string | number }[] } | undefined;
  const treatmentPlan = cdsData?.treatment_plan as { medications?: string[]; nonPharmacological?: string[]; followUp?: string } | undefined;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Action Bar */}
      <div className="flex justify-between items-center print:hidden mb-6">
        <Button variant="outline" onClick={handleBackToProfile}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="space-x-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Note
          </Button>
          <Button onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <Card className="bg-white shadow-sm border-gray-200 font-sans">
        <CardHeader className="border-b border-gray-200 bg-gray-50/50 pb-6">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {patient?.name || <span className="text-gray-400 italic">No patient name</span>}
              </CardTitle>
              <div className="text-sm text-gray-600 mt-2 space-y-1">
                <p>ID: {patient?.patientId || <span className="text-gray-400 italic">No ID</span>}</p>
                <p>DOB/Age: {patient?.age ? `${patient.age}y` : <span className="text-gray-400 italic">No age</span>} / <span className="capitalize">{patient?.gender || <span className="text-gray-400 italic">No gender</span>}</span></p>
              </div>
            </div>
            <div className="text-right text-sm text-gray-600 space-y-1">
              <p className="font-semibold text-gray-900">Clinical Encounter Note</p>
              <p>Date: {assessment?.createdAt ? format(new Date(assessment.createdAt), 'MMM dd, yyyy') : <span className="text-gray-400 italic">No date</span>}</p>
              <p>Status: <span className="font-medium text-gray-900">{assessment?.status === 'completed' ? 'Finalized' : 'In Progress'}</span></p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Chief Complaint</h3>
            <p className="text-gray-800 mt-1">{assessment?.chiefComplaint || chiefComplaint || <span className="text-gray-400 italic">No data recorded</span>}</p>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-8 text-sm text-gray-800 leading-relaxed">
          {/* SUBJECTIVE */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">Subjective</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">History of Present Illness</h4>
                <p className="mt-1">{hpi || <span className="text-gray-400 italic">No data recorded</span>}</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900">Review of Systems (Positive Findings)</h4>
                {positiveRos?.length > 0 ? (
                  <ul className="mt-1 list-disc pl-5 space-y-1">
                    {positiveRos.map((sys, idx) => <li key={idx}>{sys}</li>)}
                  </ul>
                ) : (
                  <p className="mt-1 text-gray-400 italic">No data recorded</p>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Past Medical & Social History</h4>
                {pmh ? (
                  <div className="mt-1 space-y-1">
                    <p><span className="font-medium">Conditions:</span> {pmh.conditions?.length ? pmh.conditions.join(', ') : 'None'}</p>
                    <p><span className="font-medium">Surgeries:</span> {pmh.surgeries?.length ? pmh.surgeries.join(', ') : 'None'}</p>
                    <p><span className="font-medium">Medications:</span> {pmh.medications?.length ? pmh.medications.join(', ') : 'None'}</p>
                    <p><span className="font-medium text-red-600">Allergies:</span> {pmh.allergies?.length ? pmh.allergies.join(', ') : 'None'}</p>
                    {pmh.familyHistory && <p><span className="font-medium">Family History:</span> {pmh.familyHistory}</p>}
                    {pmh.socialHistory && <p><span className="font-medium">Social History:</span> {pmh.socialHistory}</p>}
                  </div>
                ) : (
                  <p className="mt-1 text-gray-400 italic">No data recorded</p>
                )}
              </div>
            </div>
          </section>

          {/* OBJECTIVE */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">Objective</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">Vital Signs</h4>
                {vitals && (vitals.bloodPressure || vitals.heartRate || vitals.respiratoryRate || vitals.temperature || vitals.oxygenSaturation) ? (
                  <div className="mt-1 flex flex-wrap gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span><span className="font-medium">BP:</span> {vitals.bloodPressure || '-'}</span>
                    <span><span className="font-medium">HR:</span> {vitals.heartRate || '-'}</span>
                    <span><span className="font-medium">RR:</span> {vitals.respiratoryRate || '-'}</span>
                    <span><span className="font-medium">Temp:</span> {vitals.temperature || '-'}</span>
                    <span><span className="font-medium">SpO2:</span> {vitals.oxygenSaturation || '-'}</span>
                  </div>
                ) : (
                  <p className="mt-1 text-gray-400 italic">No data recorded</p>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Physical Examination</h4>
                {state.peData?.generalAppearance && (
                  <p className="mt-1 mb-2"><span className="font-medium">General:</span> {state.peData.generalAppearance}</p>
                )}
                {peSystems?.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {peSystems.map((sys, idx) => <li key={idx}>{sys}</li>)}
                  </ul>
                ) : (
                  !state.peData?.generalAppearance && <p className="mt-1 text-gray-400 italic">No data recorded</p>
                )}
              </div>
            </div>
          </section>

          {/* ASSESSMENT & PLAN */}
          <section>
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">Assessment & Plan</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">Differential Diagnoses</h4>
                {loading ? (
                  <div className="flex items-center text-gray-500 mt-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading diagnoses...
                  </div>
                ) : differentials.length > 0 ? (
                  <ol className="mt-1 list-decimal pl-5 space-y-2">
                    {differentials.map((ddx, idx) => (
                      <li key={idx}>
                        <span className="font-medium">{ddx?.condition || 'Unknown Condition'}</span> ({ddx?.probability || 0}%)
                        <p className="text-gray-600 text-xs mt-0.5">{ddx?.explanation || 'No explanation provided.'}</p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-1 text-gray-400 italic">No data recorded</p>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Clinical Notes & Plan</h4>
                {cdsLoading ? (
                  <div className="flex items-center text-gray-500 mt-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading clinical plan...
                  </div>
                ) : cdsData?.clinical_notes || investigationPlan?.selected?.length || treatmentPlan?.medications?.length ? (
                  <div className="mt-1 space-y-3">
                    {investigationPlan?.selected?.length > 0 && (
                      <div>
                        <span className="font-medium">Investigations:</span> {investigationPlan.selected.join(', ')}
                      </div>
                    )}
                    {treatmentPlan?.medications?.length > 0 && (
                      <div>
                        <span className="font-medium">Medications:</span> {treatmentPlan.medications.join(', ')}
                      </div>
                    )}
                    {treatmentPlan?.followUp && (
                      <div>
                        <span className="font-medium">Follow up:</span> {treatmentPlan.followUp}
                      </div>
                    )}
                    {cdsData?.clinical_notes && (
                      <p className="bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap">
                        {cdsData.clinical_notes}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-gray-400 italic">No data recorded</p>
                )}
              </div>
            </div>
          </section>

          {/* Final Actions */}
          <div className="flex justify-end pt-6 border-t border-gray-200 mt-8 print:hidden">
            <Button onClick={() => onComplete && onComplete()} className="bg-primary text-primary-foreground shadow-sm">
              Finalize Assessment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}