-- Create past_medical_history table
CREATE TABLE public.past_medical_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  conditions JSONB DEFAULT '[]'::jsonb,
  surgeries JSONB DEFAULT '[]'::jsonb,
  medications JSONB DEFAULT '[]'::jsonb,
  allergies JSONB DEFAULT '[]'::jsonb,
  family_history TEXT,
  social_history TEXT,
  social_history_structured JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assessment_id)
);

-- Create physical_examinations table
CREATE TABLE public.physical_examinations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  vital_signs JSONB NOT NULL DEFAULT '{}'::jsonb,
  systems JSONB NOT NULL DEFAULT '{}'::jsonb,
  general_appearance TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assessment_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.past_medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_examinations ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for PMH
CREATE POLICY "Users can view own pmh" ON public.past_medical_history FOR SELECT TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can create own pmh" ON public.past_medical_history FOR INSERT TO authenticated WITH CHECK (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can update own pmh" ON public.past_medical_history FOR UPDATE TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can delete own pmh" ON public.past_medical_history FOR DELETE TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));

-- Create RLS Policies for PE
CREATE POLICY "Users can view own pe" ON public.physical_examinations FOR SELECT TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can create own pe" ON public.physical_examinations FOR INSERT TO authenticated WITH CHECK (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can update own pe" ON public.physical_examinations FOR UPDATE TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can delete own pe" ON public.physical_examinations FOR DELETE TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));

-- Attach standard update triggers
CREATE TRIGGER update_pmh_updated_at BEFORE UPDATE ON public.past_medical_history FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pe_updated_at BEFORE UPDATE ON public.physical_examinations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();