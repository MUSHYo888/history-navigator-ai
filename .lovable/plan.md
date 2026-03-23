

## Fix Build Errors — Database Tables Missing

### Problem
Lovable Cloud was just enabled, but the database has **no tables**. The `types.ts` shows empty `Tables: { [_ in never]: never }`, so every `supabase.from('table_name')` call resolves to type `never`, causing all the TypeScript errors.

### Root Cause
The codebase was written against tables that existed in a previous backend but were never migrated to the new Lovable Cloud database.

### Plan

**Step 1: Create all required database tables via migration**

The following tables need to be created based on code usage:

1. **patients** — `id (uuid PK)`, `name (text)`, `age (int)`, `gender (text)`, `patient_id (text)`, `location (text)`, `healthcare_provider_id (uuid, references auth.users)`, `last_assessment (timestamptz)`, `created_at (timestamptz)`

2. **assessments** — `id (uuid PK)`, `patient_id (uuid FK→patients)`, `chief_complaint (text)`, `status (text, default 'in-progress')`, `current_step (int, default 1)`, `created_at (timestamptz)`, `updated_at (timestamptz)`

3. **questions** — `id (uuid PK)`, `assessment_id (uuid FK→assessments)`, `question_text (text)`, `question_type (text)`, `options (jsonb)`, `category (text)`, `required (boolean)`, `order_index (int)`

4. **answers** — `id (uuid PK)`, `assessment_id (uuid FK→assessments)`, `question_id (uuid FK→questions)`, `answer_value (jsonb)`, `notes (text)`, unique on `(assessment_id, question_id)`

5. **review_of_systems** — `id (uuid PK)`, `assessment_id (uuid FK→assessments)`, `system_name (text)`, `positive_symptoms (jsonb)`, `negative_symptoms (jsonb)`, `notes (text)`, unique on `(assessment_id, system_name)`

6. **clinical_decision_support** — `id (uuid PK)`, `assessment_id (uuid FK→assessments)`, `investigation_plan (jsonb)`, `treatment_plan (jsonb)`, `clinical_notes (text)`, `updated_at (timestamptz)`, unique on `assessment_id`

7. **differential_diagnoses** — `id (uuid PK)`, `assessment_id (uuid FK→assessments)`, `condition_name (text)`, `probability (float)`, `explanation (text)`, `key_features (jsonb)`

8. **phase_answers** — `id (uuid PK)`, `assessment_id (uuid FK→assessments)`, `phase (int)`, `phase_summary (jsonb)`, `red_flags_identified (jsonb)`

**Step 2: Add RLS policies**

Enable RLS on all tables. Policies will allow authenticated users to CRUD their own data, linking through `patients.healthcare_provider_id = auth.uid()`.

**Step 3: Fix non-database TypeScript errors**

- **`ClinicalDecisionSupport.tsx`** line 81: Replace `NodeJS.Timeout` with `ReturnType<typeof setTimeout>`
- **`ErrorBoundary.tsx`** line 105: Replace `process.env.NODE_ENV` with `import.meta.env.DEV`

### Technical Details

- Single database migration containing all 8 tables, RLS enable statements, and RLS policies
- All foreign keys use `ON DELETE CASCADE` for clean data removal
- `updated_at` columns get default `now()` and a trigger for auto-update
- The `types.ts` file will auto-regenerate after migration, resolving all `'never'` type errors

