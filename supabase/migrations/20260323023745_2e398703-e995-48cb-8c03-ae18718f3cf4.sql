-- Fix security warning: set search_path on function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public;

-- 9. clinical_reports
CREATE TABLE public.clinical_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL,
  report_type text NOT NULL,
  title text NOT NULL,
  content jsonb,
  generated_at timestamptz DEFAULT now() NOT NULL,
  generated_by text,
  format text DEFAULT 'pdf',
  file_path text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 10. referral_letters
CREATE TABLE public.referral_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL,
  specialty text NOT NULL,
  recipient_name text,
  recipient_facility text,
  urgency text DEFAULT 'routine',
  clinical_question text,
  relevant_history text,
  examination_findings text,
  investigations_completed text,
  letter_content jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  sent_at timestamptz,
  status text DEFAULT 'draft'
);

-- 11. soap_notes
CREATE TABLE public.soap_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL,
  subjective text,
  objective text,
  assessment_text text,
  plan_text text,
  additional_notes text,
  author text,
  template_used text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TRIGGER update_soap_notes_updated_at
  BEFORE UPDATE ON public.soap_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. progress_notes
CREATE TABLE public.progress_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE,
  previous_assessment_id uuid REFERENCES public.assessments(id) ON DELETE SET NULL,
  visit_date timestamptz DEFAULT now() NOT NULL,
  chief_complaint text,
  interval_history text,
  examination_changes text,
  investigation_results text,
  assessment_changes text,
  plan_modifications text,
  follow_up_instructions text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TRIGGER update_progress_notes_updated_at
  BEFORE UPDATE ON public.progress_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 13. report_templates
CREATE TABLE public.report_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  specialty text,
  template_content jsonb,
  default_template boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TRIGGER update_report_templates_updated_at
  BEFORE UPDATE ON public.report_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.clinical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soap_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

-- RLS for clinical_reports
CREATE POLICY "Users can view own clinical_reports" ON public.clinical_reports FOR SELECT TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can create own clinical_reports" ON public.clinical_reports FOR INSERT TO authenticated WITH CHECK (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can update own clinical_reports" ON public.clinical_reports FOR UPDATE TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can delete own clinical_reports" ON public.clinical_reports FOR DELETE TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));

-- RLS for referral_letters
CREATE POLICY "Users can view own referral_letters" ON public.referral_letters FOR SELECT TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can create own referral_letters" ON public.referral_letters FOR INSERT TO authenticated WITH CHECK (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can update own referral_letters" ON public.referral_letters FOR UPDATE TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can delete own referral_letters" ON public.referral_letters FOR DELETE TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));

-- RLS for soap_notes
CREATE POLICY "Users can view own soap_notes" ON public.soap_notes FOR SELECT TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can create own soap_notes" ON public.soap_notes FOR INSERT TO authenticated WITH CHECK (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can update own soap_notes" ON public.soap_notes FOR UPDATE TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can delete own soap_notes" ON public.soap_notes FOR DELETE TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));

-- RLS for progress_notes (linked via patient_id)
CREATE POLICY "Users can view own progress_notes" ON public.progress_notes FOR SELECT TO authenticated USING (patient_id IN (SELECT id FROM public.patients WHERE healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can create own progress_notes" ON public.progress_notes FOR INSERT TO authenticated WITH CHECK (patient_id IN (SELECT id FROM public.patients WHERE healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can update own progress_notes" ON public.progress_notes FOR UPDATE TO authenticated USING (patient_id IN (SELECT id FROM public.patients WHERE healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can delete own progress_notes" ON public.progress_notes FOR DELETE TO authenticated USING (patient_id IN (SELECT id FROM public.patients WHERE healthcare_provider_id = auth.uid()));

-- RLS for report_templates (readable by all authenticated users)
CREATE POLICY "Users can view report_templates" ON public.report_templates FOR SELECT TO authenticated USING (true);