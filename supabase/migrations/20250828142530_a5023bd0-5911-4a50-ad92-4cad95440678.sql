-- Fix function search path security issues
CREATE OR REPLACE FUNCTION public.user_can_access_template(template_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM report_templates rt
    LEFT JOIN healthcare_provider_profiles hpp_creator ON rt.created_by = hpp_creator.user_id
    LEFT JOIN healthcare_provider_profiles hpp_user ON hpp_user.user_id = auth.uid()
    WHERE rt.id = template_uuid 
    AND (
      -- User created the template
      rt.created_by = auth.uid()
      -- Default template accessible to all
      OR rt.default_template = true
      -- Shared template within same organization
      OR (rt.shared = true AND rt.organization_id = hpp_user.organization_id AND rt.organization_id IS NOT NULL)
      -- Shared template within same specialty
      OR (rt.shared = true AND rt.specialty = hpp_user.specialty AND rt.specialty IS NOT NULL)
      -- User has admin role in organization
      OR (hpp_user.role = 'admin' AND rt.organization_id = hpp_user.organization_id AND rt.organization_id IS NOT NULL)
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.user_can_modify_template(template_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM report_templates rt
    LEFT JOIN healthcare_provider_profiles hpp ON hpp.user_id = auth.uid()
    WHERE rt.id = template_uuid 
    AND (
      -- User created the template (and it's not a default template)
      (rt.created_by = auth.uid() AND rt.default_template = false)
      -- User has admin role in organization and template belongs to organization
      OR (hpp.role = 'admin' AND rt.organization_id = hpp.organization_id AND rt.organization_id IS NOT NULL)
    )
  );
$$;