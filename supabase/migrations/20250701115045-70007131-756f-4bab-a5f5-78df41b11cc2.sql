
-- Create clinical_reports table for storing generated reports
CREATE TABLE public.clinical_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('clinical_summary', 'investigation_summary', 'treatment_plan', 'discharge_summary')),
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  generated_by TEXT,
  format TEXT NOT NULL DEFAULT 'pdf' CHECK (format IN ('pdf', 'html', 'docx')),
  file_path TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create referral_letters table for tracking referral documentation
CREATE TABLE public.referral_letters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  specialty TEXT NOT NULL,
  recipient_name TEXT,
  recipient_facility TEXT,
  urgency TEXT NOT NULL DEFAULT 'routine' CHECK (urgency IN ('routine', 'urgent', 'stat')),
  clinical_question TEXT NOT NULL,
  relevant_history TEXT,
  examination_findings TEXT,
  investigations_completed TEXT,
  letter_content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'acknowledged'))
);

-- Create soap_notes table for SOAP notes storage
CREATE TABLE public.soap_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  subjective TEXT NOT NULL,
  objective TEXT NOT NULL,
  assessment_text TEXT NOT NULL,
  plan_text TEXT NOT NULL,
  additional_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  author TEXT,
  template_used TEXT
);

-- Create progress_notes table for follow-up documentation
CREATE TABLE public.progress_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE SET NULL,
  previous_assessment_id UUID REFERENCES public.assessments(id) ON DELETE SET NULL,
  visit_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  chief_complaint TEXT,
  interval_history TEXT NOT NULL,
  examination_changes TEXT,
  investigation_results TEXT,
  assessment_changes TEXT,
  plan_modifications TEXT,
  follow_up_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create report_templates table for customizable templates
CREATE TABLE public.report_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('clinical_report', 'referral_letter', 'soap_note', 'progress_note')),
  specialty TEXT,
  template_content JSONB NOT NULL,
  default_template BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE public.clinical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soap_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing all operations for now)
CREATE POLICY "Allow all operations on clinical_reports" ON public.clinical_reports FOR ALL USING (true);
CREATE POLICY "Allow all operations on referral_letters" ON public.referral_letters FOR ALL USING (true);
CREATE POLICY "Allow all operations on soap_notes" ON public.soap_notes FOR ALL USING (true);
CREATE POLICY "Allow all operations on progress_notes" ON public.progress_notes FOR ALL USING (true);
CREATE POLICY "Allow all operations on report_templates" ON public.report_templates FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_clinical_reports_assessment_id ON public.clinical_reports(assessment_id);
CREATE INDEX idx_referral_letters_assessment_id ON public.referral_letters(assessment_id);
CREATE INDEX idx_soap_notes_assessment_id ON public.soap_notes(assessment_id);
CREATE INDEX idx_progress_notes_patient_id ON public.progress_notes(patient_id);
CREATE INDEX idx_progress_notes_assessment_id ON public.progress_notes(assessment_id);
CREATE INDEX idx_report_templates_type ON public.report_templates(type);

-- Create update triggers for updated_at timestamps
CREATE TRIGGER update_soap_notes_updated_at BEFORE UPDATE ON public.soap_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_progress_notes_updated_at BEFORE UPDATE ON public.progress_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_templates_updated_at BEFORE UPDATE ON public.report_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default report templates
INSERT INTO public.report_templates (name, type, template_content, default_template) VALUES
('Standard Clinical Report', 'clinical_report', '{
  "sections": ["patient_demographics", "chief_complaint", "history_present_illness", "review_systems", "past_medical_history", "physical_examination", "investigations", "differential_diagnosis", "treatment_plan"],
  "format": {
    "header": true,
    "footer": true,
    "page_numbers": true,
    "letterhead": true
  }
}', true),
('General Referral Letter', 'referral_letter', '{
  "sections": ["recipient_details", "patient_demographics", "clinical_question", "relevant_history", "examination_findings", "investigations", "clinical_impression", "specific_request"],
  "format": {
    "formal_salutation": true,
    "professional_closure": true,
    "contact_details": true
  }
}', true),
('Standard SOAP Note', 'soap_note', '{
  "sections": ["subjective", "objective", "assessment", "plan"],
  "prompts": {
    "subjective": "Patient reports...",
    "objective": "Vital signs, physical examination findings...",
    "assessment": "Clinical impression and differential diagnosis...",
    "plan": "Treatment plan and follow-up..."
  }
}', true);
