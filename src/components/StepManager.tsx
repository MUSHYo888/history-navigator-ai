
// ABOUTME: Step management utilities for assessment workflow
// ABOUTME: Handles step transitions and workflow state management
import { useMedical } from '@/context/MedicalContext';
import { useUpdateAssessmentStep } from '@/hooks/useAssessment';

export function useStepManager() {
  const { state, dispatch } = useMedical();
  const updateStepMutation = useUpdateAssessmentStep();

  const updateStep = async (step: number) => {
    dispatch({ type: 'SET_STEP', payload: step });
    
    if (state.currentAssessment) {
      await updateStepMutation.mutateAsync({
        assessmentId: state.currentAssessment.id,
        step
      });
    }
  };

  return { updateStep };
}
