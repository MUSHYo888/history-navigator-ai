-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. patients
CREATE TABLE public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  age integer NOT NULL,
  gender text NOT NULL,
  patient_id text NOT NULL,
  location text NOT NULL DEFAULT '',
  healthcare_provider_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  last_assessment timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 2. assessments
CREATE TABLE public.assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  chief_complaint text NOT NULL,
  status text NOT NULL DEFAULT 'in-progress',
  current_step integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. questions
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL,
  question_text text NOT NULL,
  question_type text NOT NULL,
  options jsonb,
  category text NOT NULL DEFAULT '',
  required boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0
);

-- 4. answers
CREATE TABLE public.answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  answer_value jsonb,
  notes text,
  UNIQUE(assessment_id, question_id)
);

-- 5. review_of_systems
CREATE TABLE public.review_of_systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL,
  system_name text NOT NULL,
  positive_symptoms jsonb DEFAULT '[]'::jsonb,
  negative_symptoms jsonb DEFAULT '[]'::jsonb,
  notes text,
  UNIQUE(assessment_id, system_name)
);

-- 6. clinical_decision_support
CREATE TABLE public.clinical_decision_support (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL UNIQUE,
  investigation_plan jsonb,
  treatment_plan jsonb,
  clinical_notes text,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TRIGGER update_clinical_decision_support_updated_at
  BEFORE UPDATE ON public.clinical_decision_support
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. differential_diagnoses
CREATE TABLE public.differential_diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL,
  condition_name text NOT NULL,
  probability double precision NOT NULL DEFAULT 0,
  explanation text,
  key_features jsonb DEFAULT '[]'::jsonb
);

-- 8. phase_answers
CREATE TABLE public.phase_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL,
  phase integer NOT NULL,
  phase_summary jsonb,
  red_flags_identified jsonb DEFAULT '[]'::jsonb
);

-- Enable RLS on all tables
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_of_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_decision_support ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.differential_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase_answers ENABLE ROW LEVEL SECURITY;

-- RLS policies for patients
CREATE POLICY "Users can view own patients" ON public.patients FOR SELECT TO authenticated USING (healthcare_provider_id = auth.uid());
CREATE POLICY "Users can create own patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (healthcare_provider_id = auth.uid());
CREATE POLICY "Users can update own patients" ON public.patients FOR UPDATE TO authenticated USING (healthcare_provider_id = auth.uid());
CREATE POLICY "Users can delete own patients" ON public.patients FOR DELETE TO authenticated USING (healthcare_provider_id = auth.uid());

-- RLS policies for assessments
CREATE POLICY "Users can view own assessments" ON public.assessments FOR SELECT TO authenticated USING (patient_id IN (SELECT id FROM public.patients WHERE healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can create own assessments" ON public.assessments FOR INSERT TO authenticated WITH CHECK (patient_id IN (SELECT id FROM public.patients WHERE healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can update own assessments" ON public.assessments FOR UPDATE TO authenticated USING (patient_id IN (SELECT id FROM public.patients WHERE healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can delete own assessments" ON public.assessments FOR DELETE TO authenticated USING (patient_id IN (SELECT id FROM public.patients WHERE healthcare_provider_id = auth.uid()));

-- RLS policies for questions
CREATE POLICY "Users can view own questions" ON public.questions FOR SELECT TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can create own questions" ON public.questions FOR INSERT TO authenticated WITH CHECK (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can update own questions" ON public.questions FOR UPDATE TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can delete own questions" ON public.questions FOR DELETE TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));

-- RLS policies for answers
CREATE POLICY "Users can view own answers" ON public.answers FOR SELECT TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can create own answers" ON public.answers FOR INSERT TO authenticated WITH CHECK (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can update own answers" ON public.answers FOR UPDATE TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can delete own answers" ON public.answers FOR DELETE TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));

-- RLS policies for review_of_systems
CREATE POLICY "Users can view own ros" ON public.review_of_systems FOR SELECT TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can create own ros" ON public.review_of_systems FOR INSERT TO authenticated WITH CHECK (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can update own ros" ON public.review_of_systems FOR UPDATE TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can delete own ros" ON public.review_of_systems FOR DELETE TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));

-- RLS policies for clinical_decision_support
CREATE POLICY "Users can view own cds" ON public.clinical_decision_support FOR SELECT TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can create own cds" ON public.clinical_decision_support FOR INSERT TO authenticated WITH CHECK (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can update own cds" ON public.clinical_decision_support FOR UPDATE TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can delete own cds" ON public.clinical_decision_support FOR DELETE TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));

-- RLS policies for differential_diagnoses
CREATE POLICY "Users can view own dd" ON public.differential_diagnoses FOR SELECT TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can create own dd" ON public.differential_diagnoses FOR INSERT TO authenticated WITH CHECK (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can update own dd" ON public.differential_diagnoses FOR UPDATE TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can delete own dd" ON public.differential_diagnoses FOR DELETE TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));

-- RLS policies for phase_answers
CREATE POLICY "Users can view own phase_answers" ON public.phase_answers FOR SELECT TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can create own phase_answers" ON public.phase_answers FOR INSERT TO authenticated WITH CHECK (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can update own phase_answers" ON public.phase_answers FOR UPDATE TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));
CREATE POLICY "Users can delete own phase_answers" ON public.phase_answers FOR DELETE TO authenticated USING (assessment_id IN (SELECT a.id FROM public.assessments a JOIN public.patients p ON a.patient_id = p.id WHERE p.healthcare_provider_id = auth.uid()));