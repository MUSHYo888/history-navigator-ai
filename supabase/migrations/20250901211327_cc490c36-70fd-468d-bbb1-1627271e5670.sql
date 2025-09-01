-- Fix the questions_question_type_check constraint to include 'multiple-choice-with-text'
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_question_type_check;

ALTER TABLE public.questions ADD CONSTRAINT questions_question_type_check 
CHECK (question_type IN ('multiple-choice', 'yes-no', 'text', 'scale', 'multiple-choice-with-text'));

-- Clean up any orphaned assessments that might have no questions due to previous failures
DELETE FROM public.assessments 
WHERE id NOT IN (
    SELECT DISTINCT assessment_id 
    FROM public.questions 
    WHERE assessment_id IS NOT NULL
) 
AND created_at < NOW() - INTERVAL '1 hour';