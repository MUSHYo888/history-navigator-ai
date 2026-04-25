// ABOUTME: React Query hook for assessment workflow management
// ABOUTME: Handles assessment creation, updates, and data persistence
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AssessmentService } from '@/services/assessmentService';
import { Question, Answer, PastMedicalHistoryData } from '@/types/medical';
import { PhysicalExamData } from '@/types/physical-exam';
import { toast } from 'sonner';

export function useCreateAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ patientId, chiefComplaint }: { patientId: string; chiefComplaint: string }) =>
      AssessmentService.createAssessment(patientId, chiefComplaint),
    onSuccess: () => {
      toast.success('Assessment started');
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
    onError: (error) => {
      console.error('Failed to create assessment:', error);
      toast.error('Failed to start assessment');
    },
  });
}

export function useAssessment(assessmentId: string) {
  return useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => AssessmentService.getAssessment(assessmentId),
    enabled: !!assessmentId,
  });
}

export function useAssessmentQuestions(assessmentId: string) {
  return useQuery({
    queryKey: ['assessment-questions', assessmentId],
    queryFn: () => AssessmentService.getAssessmentQuestions(assessmentId),
    enabled: !!assessmentId,
  });
}

export function useAssessmentAnswers(assessmentId: string) {
  return useQuery({
    queryKey: ['assessment-answers', assessmentId],
    queryFn: () => AssessmentService.getAssessmentAnswers(assessmentId),
    enabled: !!assessmentId,
  });
}

export function useUpdateAssessmentStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assessmentId, step }: { assessmentId: string; step: number }) =>
      AssessmentService.updateAssessmentStep(assessmentId, step),
    onSuccess: (_, { assessmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['assessment', assessmentId] });
    },
    onError: (error) => {
      console.error('Failed to update assessment step:', error);
    },
  });
}

export function useSaveQuestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assessmentId, questions }: { assessmentId: string; questions: Question[] }) =>
      AssessmentService.saveQuestions(assessmentId, questions),
    onSuccess: (_, { assessmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['assessment-questions', assessmentId] });
    },
    onError: (error) => {
      console.error('Failed to save questions:', error);
      toast.error('Failed to save questions');
    },
  });
}

export function useSaveAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assessmentId, questionId, answer }: { assessmentId: string; questionId: string; answer: Answer }) =>
      AssessmentService.saveAnswer(assessmentId, questionId, answer),
    onSuccess: (_, { assessmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['assessment-answers', assessmentId] });
    },
    onError: (error) => {
      console.error('Failed to save answer:', error);
    },
  });
}

export function useSaveROS() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assessmentId, systemName, rosData }: { 
      assessmentId: string; 
      systemName: string; 
      rosData: { positive: string[]; negative: string[]; notes?: string } 
    }) => AssessmentService.saveReviewOfSystems(assessmentId, systemName, rosData),
    onSuccess: (_, { assessmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['assessment', assessmentId] });
    },
    onError: (error) => {
      console.error('Failed to save ROS data:', error);
      toast.error('Failed to save review of systems');
    },
  });
}

export function useCompleteAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assessmentId: string) => AssessmentService.completeAssessment(assessmentId),
    onSuccess: (_, assessmentId) => {
      toast.success('Assessment completed successfully');
      queryClient.invalidateQueries({ queryKey: ['assessment', assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
    onError: (error) => {
      console.error('Failed to complete assessment:', error);
      toast.error('Failed to complete assessment');
    },
  });
}

export function useSavePMH() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assessmentId, pmhData }: { assessmentId: string; pmhData: PastMedicalHistoryData }) => {
      return AssessmentService.savePastMedicalHistory(assessmentId, pmhData);
    },
    onSuccess: (_, { assessmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['assessment', assessmentId] });
    },
    onError: (error) => {
      console.error('Failed to save PMH data:', error);
      toast.error('Failed to save past medical history');
    },
  });
}

export function useSavePE() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assessmentId, peData }: { assessmentId: string; peData: PhysicalExamData }) => {
      return AssessmentService.savePhysicalExamination(assessmentId, peData);
    },
    onSuccess: (_, { assessmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['assessment', assessmentId] });
    },
    onError: (error) => {
      console.error('Failed to save PE data:', error);
      toast.error('Failed to save physical examination');
    },
  });
}
