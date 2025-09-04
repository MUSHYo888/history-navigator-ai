-- Create clinical decision support tables to store integrated investigation and treatment plans

-- Table for storing clinical decision support data
CREATE TABLE public.clinical_decision_support (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL,
  investigation_plan JSONB NOT NULL DEFAULT '{"selected": [], "rationale": "", "estimatedCost": 0}',
  treatment_plan JSONB NOT NULL DEFAULT '{"medications": [], "nonPharmacological": [], "followUp": ""}',
  clinical_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clinical_decision_support ENABLE ROW LEVEL SECURITY;

-- Create policies for clinical decision support
CREATE POLICY "Healthcare providers can view clinical_decision_support for their patients"
ON public.clinical_decision_support 
FOR SELECT 
USING (user_can_access_assessment(assessment_id));

CREATE POLICY "Healthcare providers can create clinical_decision_support for their patients"
ON public.clinical_decision_support 
FOR INSERT 
WITH CHECK (user_can_access_assessment(assessment_id));

CREATE POLICY "Healthcare providers can update clinical_decision_support for their patients"
ON public.clinical_decision_support 
FOR UPDATE 
USING (user_can_access_assessment(assessment_id))
WITH CHECK (user_can_access_assessment(assessment_id));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_clinical_decision_support_updated_at
BEFORE UPDATE ON public.clinical_decision_support
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();