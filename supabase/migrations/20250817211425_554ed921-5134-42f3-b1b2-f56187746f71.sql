-- Create a trigger to automatically assign new patients to the authenticated user
-- This ensures all future patient creation goes through proper assignment
CREATE OR REPLACE FUNCTION public.ensure_healthcare_provider_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If healthcare_provider_id is not set, assign to the current authenticated user
  IF NEW.healthcare_provider_id IS NULL THEN
    NEW.healthcare_provider_id = auth.uid();
  END IF;
  
  -- Ensure we have a valid healthcare provider
  IF NEW.healthcare_provider_id IS NULL THEN
    RAISE EXCEPTION 'Healthcare provider must be assigned to patient';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for patient creation
DROP TRIGGER IF EXISTS ensure_patient_provider ON public.patients;
CREATE TRIGGER ensure_patient_provider
  BEFORE INSERT ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_healthcare_provider_assignment();