-- Create security definer function to check if user can access assessment data
CREATE OR REPLACE FUNCTION public.user_can_access_assessment(assessment_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.assessments a
    JOIN public.patients p ON a.patient_id = p.id
    WHERE a.id = assessment_uuid 
    AND p.healthcare_provider_id = auth.uid()
  );
$$;

-- Create past_medical_history table
CREATE TABLE public.past_medical_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE UNIQUE,
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  surgeries JSONB NOT NULL DEFAULT '[]'::jsonb,
  medications JSONB NOT NULL DEFAULT '[]'::jsonb,
  allergies JSONB NOT NULL DEFAULT '[]'::jsonb,
  family_history TEXT,
  social_history TEXT,
  social_history_structured JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create physical_examination table
CREATE TABLE public.physical_examination (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE UNIQUE,
  vital_signs JSONB NOT NULL DEFAULT '{}'::jsonb,
  systems JSONB NOT NULL DEFAULT '{}'::jsonb,
  general_appearance TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.past_medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_examination ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies using existing security definer functions
CREATE POLICY "Healthcare providers can view PMH for their patients"
ON public.past_medical_history FOR SELECT USING (public.user_can_access_assessment(assessment_id));

CREATE POLICY "Healthcare providers can modify PMH for their patients"
ON public.past_medical_history FOR ALL USING (public.user_can_access_assessment(assessment_id)) WITH CHECK (public.user_can_access_assessment(assessment_id));

CREATE POLICY "Healthcare providers can view PE for their patients"
ON public.physical_examination FOR SELECT USING (public.user_can_access_assessment(assessment_id));

CREATE POLICY "Healthcare providers can modify PE for their patients"
ON public.physical_examination FOR ALL USING (public.user_can_access_assessment(assessment_id)) WITH CHECK (public.user_can_access_assessment(assessment_id));

-- Add update triggers
CREATE TRIGGER update_pmh_updated_at BEFORE UPDATE ON public.past_medical_history FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pe_updated_at BEFORE UPDATE ON public.physical_examination FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.past_medical_history, public.physical_examination;