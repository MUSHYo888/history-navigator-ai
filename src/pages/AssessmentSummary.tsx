// ABOUTME: Read-only patient assessment summary page that fetches every related
// ABOUTME: record (HPI, ROS, PMH, PE, DDx, CDS, SOAP, referrals, progress) directly from the database.

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ClinicalUtils } from '@/utils/clinicalUtils';
import { toast } from 'sonner';

const Empty = () => <span className="text-gray-400 italic">No data recorded</span>;

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section>
    <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">{title}</h3>
    <div className="space-y-4">{children}</div>
  </section>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <h4 className="font-semibold text-gray-900">{label}</h4>
    <div className="mt-1">{children}</div>
  </div>
);

export default function AssessmentSummary() {
  const { patientId, assessmentId } = useParams<{ patientId: string; assessmentId: string }>();
  const navigate = useNavigate();

  const validIds =
    patientId && assessmentId &&
    ClinicalUtils.isValidUUID(patientId) &&
    ClinicalUtils.isValidUUID(assessmentId);

  const { data, isLoading, error } = useQuery({
    queryKey: ['assessment-summary', assessmentId],
    enabled: !!validIds,
    queryFn: async () => {
      const aid = assessmentId!;
      const pid = patientId!;

      const [
        patientRes,
        assessmentRes,
        answersRes,
        questionsRes,
        rosRes,
        pmhRes,
        peRes,
        ddxRes,
        cdsRes,
        soapRes,
        reportsRes,
        referralsRes,
        progressRes,
      ] = await Promise.all([
        supabase.from('patients').select('*').eq('id', pid).maybeSingle(),
        supabase.from('assessments').select('*').eq('id', aid).maybeSingle(),
        supabase.from('answers').select('*').eq('assessment_id', aid),
        supabase.from('questions').select('*').eq('assessment_id', aid).order('order_index', { ascending: true }),
        supabase.from('review_of_systems').select('*').eq('assessment_id', aid),
        supabase.from('past_medical_history').select('*').eq('assessment_id', aid).maybeSingle(),
        supabase.from('physical_examination').select('*').eq('assessment_id', aid).maybeSingle(),
        supabase.from('differential_diagnoses').select('*').eq('assessment_id', aid).order('probability', { ascending: false }),
        supabase.from('clinical_decision_support').select('*').eq('assessment_id', aid).maybeSingle(),
        supabase.from('soap_notes').select('*').eq('assessment_id', aid).order('created_at', { ascending: false }),
        supabase.from('clinical_reports').select('*').eq('assessment_id', aid).order('generated_at', { ascending: false }),
        supabase.from('referral_letters').select('*').eq('assessment_id', aid).order('created_at', { ascending: false }),
        supabase.from('progress_notes').select('*').eq('assessment_id', aid).order('visit_date', { ascending: false }),
      ]);

      const firstError =
        patientRes.error || assessmentRes.error || answersRes.error || questionsRes.error ||
        rosRes.error || pmhRes.error || peRes.error || ddxRes.error || cdsRes.error ||
        soapRes.error || reportsRes.error || referralsRes.error || progressRes.error;
      if (firstError) throw firstError;

      return {
        patient: patientRes.data,
        assessment: assessmentRes.data,
        answers: answersRes.data || [],
        questions: questionsRes.data || [],
        ros: rosRes.data || [],
        pmh: pmhRes.data,
        pe: peRes.data,
        ddx: ddxRes.data || [],
        cds: cdsRes.data,
        soap: soapRes.data || [],
        reports: reportsRes.data || [],
        referrals: referralsRes.data || [],
        progress: progressRes.data || [],
      };
    },
  });

  if (!validIds) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Invalid link</h2>
        <p className="text-muted-foreground mb-4">The patient or assessment ID is malformed.</p>
        <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <span className="text-muted-foreground">Loading assessment summary...</span>
      </div>
    );
  }

  if (error) {
    console.error('AssessmentSummary load error:', error);
    toast.error('Failed to load assessment summary');
  }

  if (!data?.patient || !data?.assessment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Summary Not Found</h2>
        <p className="text-muted-foreground mb-4">This assessment could not be loaded.</p>
        <Button onClick={() => navigate(`/patient/${patientId}`)}>Back to Patient</Button>
      </div>
    );
  }

  const { patient, assessment, answers, questions, ros, pmh, pe, ddx, cds, soap, reports, referrals, progress } = data;

  const questionMap = new Map(questions.map((q: any) => [q.id, q]));
  const hpiItems = answers
    .map((a: any) => {
      const q = questionMap.get(a.question_id);
      const text = q?.question_text || 'Question';
      const raw = a.answer_value;
      const value =
        raw == null ? '' :
        typeof raw === 'object' ? JSON.stringify(raw) :
        String(raw);
      return { text, value, notes: a.notes };
    })
    .filter((i) => i.value || i.notes);

  const vitals = (pe?.vital_signs || {}) as Record<string, any>;
  const peSystems = pe?.systems ? Object.entries(pe.systems as Record<string, any>) : [];

  const investigationPlan = (cds?.investigation_plan || {}) as {
    selected?: string[]; rationale?: string; results?: { name: string; value: string | number }[];
  };
  const treatmentPlan = (cds?.treatment_plan || {}) as {
    medications?: string[]; nonPharmacological?: string[]; followUp?: string;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-center print:hidden">
        <Button variant="outline" onClick={() => navigate(`/patient/${patientId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Patient
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> Print
        </Button>
      </div>

      <Card className="bg-white shadow-sm border-gray-200 font-sans">
        <CardHeader className="border-b border-gray-200 bg-gray-50/50 pb-6">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">{patient.name || <Empty />}</CardTitle>
              <div className="text-sm text-gray-600 mt-2 space-y-1">
                <p>ID: {patient.patient_id || <Empty />}</p>
                <p>
                  Age/Sex: {patient.age ?? <Empty />}{patient.age ? 'y' : ''} /{' '}
                  <span className="capitalize">{patient.gender || <Empty />}</span>
                </p>
                {patient.location && <p>Location: {patient.location}</p>}
              </div>
            </div>
            <div className="text-right text-sm text-gray-600 space-y-1">
              <p className="font-semibold text-gray-900">Clinical Encounter Summary</p>
              <p>Date: {assessment.created_at ? format(new Date(assessment.created_at), 'MMM dd, yyyy') : <Empty />}</p>
              <p>
                Status:{' '}
                <Badge variant={assessment.status === 'completed' ? 'default' : 'outline'} className="ml-1">
                  {assessment.status}
                </Badge>
              </p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Chief Complaint</h3>
            <p className="text-gray-800 mt-1">{assessment.chief_complaint || <Empty />}</p>
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 space-y-8 text-sm text-gray-800 leading-relaxed">
          {/* Subjective */}
          <Section title="Subjective">
            <Field label="History of Present Illness">
              {hpiItems.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {hpiItems.map((i, idx) => (
                    <li key={idx}>
                      <span className="font-medium">{i.text}:</span> {i.value}
                      {i.notes && <span className="text-gray-600"> — {i.notes}</span>}
                    </li>
                  ))}
                </ul>
              ) : <Empty />}
            </Field>

            <Field label="Review of Systems">
              {ros.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {ros.map((r: any) => {
                    const pos = (r.positive_symptoms as string[]) || [];
                    const neg = (r.negative_symptoms as string[]) || [];
                    return (
                      <li key={r.id}>
                        <span className="font-medium capitalize">{r.system_name}:</span>{' '}
                        {pos.length > 0 && <span>(+) {pos.join(', ')}. </span>}
                        {neg.length > 0 && <span className="text-gray-600">(-) {neg.join(', ')}.</span>}
                        {r.notes && <span className="text-gray-600"> {r.notes}</span>}
                      </li>
                    );
                  })}
                </ul>
              ) : <Empty />}
            </Field>

            <Field label="Past Medical & Social History">
              {pmh ? (
                <div className="space-y-1">
                  <p><span className="font-medium">Conditions:</span> {(pmh.conditions as string[])?.length ? (pmh.conditions as string[]).join(', ') : 'None'}</p>
                  <p><span className="font-medium">Surgeries:</span> {(pmh.surgeries as string[])?.length ? (pmh.surgeries as string[]).join(', ') : 'None'}</p>
                  <p><span className="font-medium">Medications:</span> {(pmh.medications as string[])?.length ? (pmh.medications as string[]).join(', ') : 'None'}</p>
                  <p><span className="font-medium text-red-600">Allergies:</span> {(pmh.allergies as string[])?.length ? (pmh.allergies as string[]).join(', ') : 'None'}</p>
                  {pmh.family_history && <p><span className="font-medium">Family History:</span> {pmh.family_history}</p>}
                  {pmh.social_history && <p><span className="font-medium">Social History:</span> {pmh.social_history}</p>}
                </div>
              ) : <Empty />}
            </Field>
          </Section>

          {/* Objective */}
          <Section title="Objective">
            <Field label="Vital Signs">
              {Object.values(vitals).some(Boolean) ? (
                <div className="flex flex-wrap gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span><span className="font-medium">BP:</span> {vitals.bloodPressure || '-'}</span>
                  <span><span className="font-medium">HR:</span> {vitals.heartRate || '-'}</span>
                  <span><span className="font-medium">RR:</span> {vitals.respiratoryRate || '-'}</span>
                  <span><span className="font-medium">Temp:</span> {vitals.temperature || '-'}</span>
                  <span><span className="font-medium">SpO2:</span> {vitals.oxygenSaturation || '-'}</span>
                </div>
              ) : <Empty />}
            </Field>

            <Field label="Physical Examination">
              {pe?.general_appearance && <p className="mb-2"><span className="font-medium">General:</span> {pe.general_appearance}</p>}
              {peSystems.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {peSystems.map(([sys, raw]) => {
                    const d = (raw || {}) as { normal?: boolean; findings?: string[]; notes?: string };
                    if (d.normal) return <li key={sys}><span className="capitalize">{sys}:</span> Normal</li>;
                    const findings = Array.isArray(d.findings) ? d.findings.join(', ') : '';
                    const notes = d.notes ? ` — ${d.notes}` : '';
                    if (!findings && !notes) return null;
                    return <li key={sys}><span className="capitalize">{sys}:</span> {findings}{notes}</li>;
                  })}
                </ul>
              ) : (!pe?.general_appearance && <Empty />)}
            </Field>

            {reports.length > 0 && (
              <Field label="Investigations & Lab Results">
                <ul className="space-y-2">
                  {reports.map((r: any) => (
                    <li key={r.id} className="border border-gray-100 rounded p-2 bg-gray-50">
                      <div className="flex justify-between gap-2">
                        <span className="font-medium">{r.title}</span>
                        <span className="text-xs text-gray-500">{r.generated_at ? format(new Date(r.generated_at), 'MMM dd, yyyy') : ''}</span>
                      </div>
                      <p className="text-xs text-gray-600">{r.report_type}{r.format ? ` · ${r.format}` : ''}</p>
                    </li>
                  ))}
                </ul>
              </Field>
            )}
          </Section>

          {/* Assessment & Plan */}
          <Section title="Assessment & Plan">
            <Field label="Differential Diagnoses">
              {ddx.length > 0 ? (
                <ol className="list-decimal pl-5 space-y-2">
                  {ddx.map((d: any) => (
                    <li key={d.id}>
                      <span className="font-medium">{d.condition_name}</span>{' '}
                      ({Math.round((d.probability || 0) * (d.probability <= 1 ? 100 : 1))}%)
                      {d.explanation && <p className="text-gray-600 text-xs mt-0.5">{d.explanation}</p>}
                    </li>
                  ))}
                </ol>
              ) : <Empty />}
            </Field>

            <Field label="Investigations Ordered">
              {investigationPlan.selected?.length ? (
                <p>{investigationPlan.selected.join(', ')}</p>
              ) : <Empty />}
            </Field>

            <Field label="Treatment Plan">
              {treatmentPlan.medications?.length || treatmentPlan.nonPharmacological?.length || treatmentPlan.followUp ? (
                <div className="space-y-1">
                  {treatmentPlan.medications?.length ? <p><span className="font-medium">Medications:</span> {treatmentPlan.medications.join(', ')}</p> : null}
                  {treatmentPlan.nonPharmacological?.length ? <p><span className="font-medium">Non-pharmacological:</span> {treatmentPlan.nonPharmacological.join(', ')}</p> : null}
                  {treatmentPlan.followUp ? <p><span className="font-medium">Follow up:</span> {treatmentPlan.followUp}</p> : null}
                </div>
              ) : <Empty />}
            </Field>

            {cds?.clinical_notes && (
              <Field label="Clinical Notes">
                <p className="bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap">{cds.clinical_notes}</p>
              </Field>
            )}
          </Section>

          {/* SOAP Notes */}
          {soap.length > 0 && (
            <Section title="SOAP Notes">
              {soap.map((n: any) => (
                <div key={n.id} className="border border-gray-100 rounded-lg p-4 space-y-2 bg-gray-50/40">
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{n.author || 'Author n/a'}</span>
                    <span>{n.created_at ? format(new Date(n.created_at), 'MMM dd, yyyy HH:mm') : ''}</span>
                  </div>
                  {n.subjective && <p><span className="font-semibold">S:</span> {n.subjective}</p>}
                  {n.objective && <p><span className="font-semibold">O:</span> {n.objective}</p>}
                  {(n.assessment_text) && <p><span className="font-semibold">A:</span> {n.assessment_text}</p>}
                  {n.plan_text && <p><span className="font-semibold">P:</span> {n.plan_text}</p>}
                  {n.additional_notes && <p className="text-gray-600 text-xs">{n.additional_notes}</p>}
                </div>
              ))}
            </Section>
          )}

          {/* Referrals */}
          {referrals.length > 0 && (
            <Section title="Referral Letters">
              {referrals.map((r: any) => (
                <div key={r.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50/40">
                  <div className="flex justify-between items-center">
                    <p className="font-medium capitalize">{r.specialty}{r.recipient_name ? ` — ${r.recipient_name}` : ''}</p>
                    <Badge variant="outline" className="capitalize">{r.urgency}</Badge>
                  </div>
                  {r.recipient_facility && <p className="text-xs text-gray-600">{r.recipient_facility}</p>}
                  {r.clinical_question && <p className="mt-2"><span className="font-medium">Question:</span> {r.clinical_question}</p>}
                  <p className="text-xs text-gray-500 mt-2">Status: {r.status}{r.created_at ? ` · ${format(new Date(r.created_at), 'MMM dd, yyyy')}` : ''}</p>
                </div>
              ))}
            </Section>
          )}

          {/* Progress notes */}
          {progress.length > 0 && (
            <Section title="Progress Notes">
              {progress.map((p: any) => (
                <div key={p.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50/40 space-y-1">
                  <p className="text-xs text-gray-500">{p.visit_date ? format(new Date(p.visit_date), 'MMM dd, yyyy') : ''}</p>
                  {p.chief_complaint && <p><span className="font-medium">CC:</span> {p.chief_complaint}</p>}
                  {p.interval_history && <p><span className="font-medium">Interval Hx:</span> {p.interval_history}</p>}
                  {p.examination_changes && <p><span className="font-medium">Exam changes:</span> {p.examination_changes}</p>}
                  {p.investigation_results && <p><span className="font-medium">Results:</span> {p.investigation_results}</p>}
                  {p.assessment_changes && <p><span className="font-medium">Assessment:</span> {p.assessment_changes}</p>}
                  {p.plan_modifications && <p><span className="font-medium">Plan:</span> {p.plan_modifications}</p>}
                  {p.follow_up_instructions && <p><span className="font-medium">Follow-up:</span> {p.follow_up_instructions}</p>}
                </div>
              ))}
            </Section>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
