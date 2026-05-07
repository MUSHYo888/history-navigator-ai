/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EnhancedQuestionGeneratorService, PhaseTransitionData } from '@/services/clinical/EnhancedQuestionGeneratorService';
import { Question, Answer } from '@/types/medical';
import { useMedical } from '@/context/MedicalContext';
import { QuestionComponent } from './QuestionComponent';
import { ReviewOfSystemsComponent } from './ReviewOfSystemsComponent';
import { PastMedicalHistory } from './PastMedicalHistory';
import { PhysicalExamination } from './PhysicalExamination';
import { ClinicalDecisionSupport } from './ClinicalDecisionSupport';
import { ClinicalSummary } from './ClinicalSummary';
import { AssessmentProgress } from './AssessmentProgress';
import { AssessmentHeader } from './AssessmentHeader';
import { LoadingState } from './LoadingState';
import { ErrorBoundary } from './ErrorBoundary';
import { useStepManager } from './StepManager';
import { useSaveQuestions, useSaveAnswer, useCompleteAssessment } from '@/hooks/useAssessment';
import { toast } from 'sonner';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { AssessmentErrorRecovery } from './AssessmentErrorRecovery';
import { AssessmentService } from '@/services/assessmentService';
import { supabase } from '@/integrations/supabase/client';

interface AssessmentWorkflowProps {
  chiefComplaint: string;
  onComplete: () => void;
  onBack: () => void;
}

function AssessmentWorkflowContent({ chiefComplaint, onComplete, onBack }: AssessmentWorkflowProps) {
  const { state, dispatch } = useMedical();
  
  // Phase 1 questions state
  const [phase1Questions, setPhase1Questions] = useState<Question[]>([]);
  const [phase1Answers, setPhase1Answers] = useState<Record<string, Answer>>({});
  const [currentPhase1Index, setCurrentPhase1Index] = useState(0);
  
  // Phase 2 questions state
  const [phase2Questions, setPhase2Questions] = useState<Question[]>([]);
  const [currentPhase2Index, setCurrentPhase2Index] = useState(0);
  const [phase2Triggered, setPhase2Triggered] = useState(false);
  
  // Transition data
  const [phaseTransition, setPhaseTransition] = useState<PhaseTransitionData | null>(null);
  
  // General state
  const [currentPhase, setCurrentPhase] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<number | 'summary'>(1);
  const [cdsRetryKey, setCdsRetryKey] = useState(0);
  const [stepTransitionLoading, setStepTransitionLoading] = useState(false);
  const [isHydrating, setIsHydrating] = useState(false);

  const saveQuestionsMutation = useSaveQuestions();
  const saveAnswerMutation = useSaveAnswer();
  const completeAssessmentMutation = useCompleteAssessment();
  const { updateStep } = useStepManager();
  
  const isCompleted = state.currentAssessment?.status === 'completed' || state.currentStep >= 6;

  const steps = [
    'History of Present Illness',
    'Review of Systems', 
    'Past Medical History',
    'Physical Examination',
    'Clinical Decision Support',
    'Patient Summary & Documentation'
  ];

  const loadPhase1Questions = useCallback(async () => {
    if (isCompleted) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Check if questions already exist in the database for this assessment
      if (state.currentAssessment) {
        const { data: existingQuestions, error: fetchError } = await supabase
          .from('questions')
          .select('*')
          .eq('assessment_id', state.currentAssessment.id)
          .order('order_index');

        if (!fetchError && existingQuestions && existingQuestions.length > 0) {
          const mappedQuestions: Question[] = existingQuestions.map(q => ({
            id: q.id,
            text: q.question_text,
            type: q.question_type as any,
            options: q.options as string[] | undefined,
            category: q.category,
            required: q.required,
            phase: (q as any).phase as 1 | 2,
            clinicalPriority: (q as any).clinical_priority as any,
            redFlagIndicator: (q as any).red_flag_indicator,
            questionRationale: (q as any).question_rationale || undefined,
            followUpTrigger: (q as any).follow_up_trigger || undefined
          }));
          
          const p1 = mappedQuestions.filter(q => !q.phase || q.phase === 1);
          const p2 = mappedQuestions.filter(q => q.phase === 2);
          
          setPhase1Questions(p1);
          if (p2.length > 0) {
            setPhase2Questions(p2);
            setPhase2Triggered(true);
          }
          return; // Skip generation and saving since we loaded them
        }
      }

      // Generate Phase 1 questions using clinical templates
      const questions = EnhancedQuestionGeneratorService.generatePhase1Questions(chiefComplaint);
      
      // Save Phase 1 questions to database BEFORE setting local state
      if (state.currentAssessment && questions.length > 0 && !isCompleted) {
        try {
          await saveQuestionsMutation.mutateAsync({
            assessmentId: state.currentAssessment.id,
            questions: questions
          });
          
          // Only set local state after successful database save
          setPhase1Questions(questions);
        } catch (saveError: unknown) {
          console.error('Failed to save Phase 1 questions:', saveError);
          const errorMessage = saveError instanceof Error ? saveError.message : (saveError as { message?: string })?.message || 'Unknown database error';
          
          // Check for specific constraint violations
          if (errorMessage.includes('questions_question_type_check')) {
            setError('Question type not supported. Please contact support.');
          } else if (errorMessage.includes('foreign key')) {
            setError('Assessment validation failed. Please try creating a new assessment.');
          } else {
            setError(`Failed to save questions: ${errorMessage}`);
          }
          
          // Do NOT continue with local questions - this prevents the foreign key error
          return;
        }
      } else if (!state.currentAssessment) {
        setError('No assessment found. Please start a new assessment.');
        return;
      } else {
        setPhase1Questions(questions);
      }
      
    } catch (err: unknown) {
      console.error('Error loading Phase 1 questions:', err);
      setError(`Failed to load Phase 1 questions: ${err instanceof Error ? err.message : (err as { message?: string })?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [chiefComplaint, isCompleted, state.currentAssessment, saveQuestionsMutation]);

  useEffect(() => {
    const initializeWorkflow = async () => {
      setLoading(true);
      setError(null);

      // Hydrate state from database if context is empty but we have an assessment ID
      if (state.currentAssessment && Object.keys(state.answers).length === 0) {
        setIsHydrating(true);
        try {
          const assessmentId = state.currentAssessment.id;
          
          const answers = await AssessmentService.getAssessmentAnswers(assessmentId).catch(() => ({}));
          if (answers && Object.keys(answers).length > 0) {
            dispatch({ type: 'SET_ALL_ANSWERS', payload: answers });
            setPhase1Answers(answers);
          }

          const { data: rosRows } = await supabase
            .from('review_of_systems')
            .select('*')
            .eq('assessment_id', assessmentId);
            
          if (rosRows && rosRows.length > 0) {
            const rosMap: Record<string, any> = {};
            rosRows.forEach(row => {
              rosMap[row.system_name] = {
                positive: row.positive_symptoms || [],
                negative: row.negative_symptoms || [],
                notes: row.notes || ''
              };
            });
            dispatch({ type: 'SET_ROS_DATA', payload: rosMap });
          }

          const { data: assessmentDetails } = await supabase.from('assessments')
            .select('pmh_data, pe_data, patients(*)')
            .eq('id', assessmentId)
            .maybeSingle();
            
          if (assessmentDetails) {
            if (assessmentDetails.pmh_data) dispatch({ type: 'SET_PMH_DATA', payload: assessmentDetails.pmh_data });
            if (assessmentDetails.pe_data) dispatch({ type: 'SET_PE_DATA', payload: assessmentDetails.pe_data });
            
            if (!state.currentPatient && assessmentDetails.patients) {
              const p = assessmentDetails.patients as any;
              dispatch({ 
                type: 'SET_CURRENT_PATIENT', 
                payload: {
                  id: p.id,
                  name: p.name,
                  age: p.age,
                  gender: p.gender,
                  patientId: p.patient_id,
                  location: p.location || '',
                  createdAt: p.created_at,
                  lastAssessment: p.last_assessment
                }
              });
            }
          }
        } catch (err) {
          console.error("Failed to hydrate assessment data:", err);
        } finally {
          setIsHydrating(false);
        }
      }

      if (isCompleted) {
        setCurrentView('summary');
      } else {
        if ((state.currentStep || 1) >= 6) setCurrentView('summary');
        else setCurrentView(state.currentStep || 1);
        
        if ((state.currentStep || 1) <= 2) await loadPhase1Questions();
      }
      setLoading(false);
    };

    initializeWorkflow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chiefComplaint, isCompleted, state.currentStep, state.currentAssessment?.id]);

  const handleAnswerSubmit = async (questionId: string, answer: Omit<Answer, 'questionId'>) => {
    
    if (!state.currentAssessment) {
      console.error('No current assessment found');
      toast.error('Assessment session lost. Please restart assessment.');
      return;
    }

    try {
      // Create answer object
      const answerObj: Answer = {
        questionId,
        value: answer.value,
        notes: answer.notes
      };

      // Update local phase answers
      if (currentPhase === 1) {
        const newPhase1Answers = { ...phase1Answers, [questionId]: answerObj };
        setPhase1Answers(newPhase1Answers);
      }

      // Update global context
      dispatch({
        type: 'ADD_ANSWER',
        payload: {
          questionId,
          answer: answerObj
        }
      });

      // Save to database
      await saveAnswerMutation.mutateAsync({
        assessmentId: state.currentAssessment.id,
        questionId,
        answer: answerObj
      });
      
      toast.success('Answer saved');

      // Handle question progression
      if (currentPhase === 1) {
        await handlePhase1Progression(questionId, answerObj);
      } else if (currentPhase === 2) {
        await handlePhase2Progression();
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error saving answer: ${errorMessage}`);
      toast.error(`Failed to save answer: ${errorMessage}`);
      setError(`Failed to save your answer. Please try again.`);
    }
  };

  const handlePhase1Progression = async (questionId: string, answer: Answer) => {
    const updatedAnswers = { ...phase1Answers, [questionId]: answer };
    
    if (currentPhase1Index < phase1Questions.length - 1) {
      // Move to next Phase 1 question
      setCurrentPhase1Index(prev => prev + 1);
    } else {
      // Phase 1 complete - analyze answers and determine if Phase 2 is needed
      
      try {
        const transitionData = EnhancedQuestionGeneratorService.analyzePhase1Completion(
          chiefComplaint, 
          updatedAnswers
        );
        
        setPhaseTransition(transitionData);
        
        // Save Phase 1 completion
        if (state.currentAssessment) {
          await EnhancedQuestionGeneratorService.savePhaseCompletion(
            state.currentAssessment.id,
            1,
            updatedAnswers,
            transitionData.answerAnalysis
          );
        }
        
        if (transitionData.phase2Triggered && transitionData.answerAnalysis) {
          // Generate Phase 2 questions
          setLoading(true);
          
          try {
            const phase2Qs = await EnhancedQuestionGeneratorService.generatePhase2Questions(
              chiefComplaint,
              updatedAnswers,
              transitionData.answerAnalysis
            );
            
            setPhase2Questions(phase2Qs);
            setPhase2Triggered(true);
            setCurrentPhase(2);
            
            // Save Phase 2 questions to database
            if (state.currentAssessment && phase2Qs.length > 0) {
              await saveQuestionsMutation.mutateAsync({
                assessmentId: state.currentAssessment.id,
                questions: phase2Qs
              });
            }
            
            toast.success(`Phase 2 activated: ${phase2Qs.length} follow-up questions generated`);
            
          } catch (error) {
            console.error('Failed to generate Phase 2 questions:', error);
            toast.error('Failed to generate follow-up questions. Proceeding to next section.');
            // Continue to ROS even if Phase 2 fails
            proceedToROS();
          } finally {
            setLoading(false);
          }
        } else {
          proceedToROS();
        }
        
      } catch (error) {
        console.error('Error analyzing Phase 1 completion:', error);
        toast.error('Error analyzing responses. Proceeding to next section.');
        proceedToROS();
      }
    }
  };

  const handlePhase2Progression = async () => {
    if (currentPhase2Index < phase2Questions.length - 1) {
      // Move to next Phase 2 question
      setCurrentPhase2Index(prev => prev + 1);
    } else {
      // Phase 2 complete
      
      // Save Phase 2 completion
      if (state.currentAssessment) {
        await EnhancedQuestionGeneratorService.savePhaseCompletion(
          state.currentAssessment.id,
          2,
          state.answers // All answers including Phase 2
        );
      }
      
      proceedToROS();
    }
  };

  const proceedToROS = async () => {
    setCurrentView(2);
    await updateStep(2);
  };

  const handleROSComplete = async () => {
    try {
      setStepTransitionLoading(true);
      setCurrentView(3);
      await updateStep(3);
      toast.success('Review of Systems completed');
    } catch (error) {
      console.error('Error completing ROS:', error);
      toast.error('Failed to complete Review of Systems');
    } finally {
      setStepTransitionLoading(false);
    }
  };

  const handlePMHComplete = async (pmhData: any) => {
    try {
      setStepTransitionLoading(true);
      dispatch({ type: 'SET_PMH_DATA', payload: pmhData });
      
      if (state.currentAssessment?.id) {
        await supabase.from('assessments')
          .update({ pmh_data: pmhData })
          .eq('id', state.currentAssessment.id);
      }
      
      setCurrentView(4);
      await updateStep(4);
      toast.success('Past Medical History saved');
    } catch (error) {
      console.error('Error completing PMH:', error);
      toast.error('Failed to save Past Medical History');
    } finally {
      setStepTransitionLoading(false);
    }
  };

  const handlePEComplete = async (peData: any) => {
    try {
      setStepTransitionLoading(true);
      dispatch({ type: 'SET_PE_DATA', payload: peData });
      
      if (state.currentAssessment?.id) {
        await supabase.from('assessments')
          .update({ pe_data: peData })
          .eq('id', state.currentAssessment.id);
      }
      
      setCurrentView(5);
      await updateStep(5);
      toast.success('Physical examination completed');
    } catch (error) {
      console.error('Error completing Physical Examination:', error);
      toast.error('Failed to save physical examination. Please try again.');
    } finally {
      setStepTransitionLoading(false);
    }
  };

  const handleClinicalDecisionSupportComplete = async (clinicalPlan: any) => {
    try {
      setStepTransitionLoading(true);
      setCurrentView('summary');
      await updateStep(6);
    } finally {
      setStepTransitionLoading(false);
    }
  };

  const handleSummaryComplete = async () => {
    try {
      setStepTransitionLoading(true);
      if (state.currentAssessment?.id && state.currentAssessment.status !== 'completed') {
        await completeAssessmentMutation.mutateAsync(state.currentAssessment.id);
        dispatch({ 
          type: 'SET_CURRENT_ASSESSMENT', 
          payload: { ...state.currentAssessment, status: 'completed' } 
        });
      }
      onComplete();
    } catch (error) {
      console.error('Failed to complete assessment:', error);
      toast.error('Failed to finalize assessment');
    } finally {
      setStepTransitionLoading(false);
    }
  };

  // Calculate progress based on current phase and completion
  const calculateProgress = () => {
    if (currentView === 'summary' || currentView === 8) return 100;
    if (currentView === 5) return 85;
    if (currentView === 4) return 70;
    if (currentView === 3) return 55;
    if (currentView === 2) return 40;
    
    if (currentPhase === 1 && phase1Questions.length > 0) {
      return (currentPhase1Index / phase1Questions.length) * 25; // Phase 1 is 25% of total
    } else if (currentPhase === 2 && phase2Questions.length > 0) {
      return 25 + ((currentPhase2Index / phase2Questions.length) * 15); // Phase 2 is additional 15%
    }
    
    return 0;
  };

  const getCurrentQuestion = (): Question | null => {
    if (currentPhase === 1 && phase1Questions.length > 0) {
      return phase1Questions[currentPhase1Index] || null;
    } else if (currentPhase === 2 && phase2Questions.length > 0) {
      return phase2Questions[currentPhase2Index] || null;
    }
    return null;
  };

  const getCurrentQuestionNumber = (): number => {
    if (currentPhase === 1) {
      return currentPhase1Index + 1;
    } else if (currentPhase === 2) {
      return phase1Questions.length + currentPhase2Index + 1;
    }
    return 1;
  };

  const getTotalQuestions = (): number => {
    return phase1Questions.length + (phase2Questions.length || 0);
  };

  const progressPercent = calculateProgress();
  const answeredCount = Object.keys(state.answers).length;
  const currentQuestion = getCurrentQuestion();

  if (isHydrating) {
    return (
      <div className="p-6">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-8">
            <LoadingState message="Loading patient chart..." subMessage="Hydrating clinical data" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || stepTransitionLoading) {
    return (
      <div className="p-6">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-8">
            <LoadingState />
            <div className="mt-4 text-center">
              <p className="text-gray-600">
                {currentPhase === 1 ? 'Loading Phase 1 clinical questions' : 'Generating Phase 2 follow-up questions'} for: {chiefComplaint}
              </p>
              {phaseTransition && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Phase 1 complete. Risk level: {phaseTransition.overallRiskLevel}
                  </p>
                  {phaseTransition.phase2Triggered && (
                    <p className="text-sm text-blue-600">Generating targeted follow-up questions...</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  switch (currentView) {
    case 'summary':
    case 8: // Support strict Step 8 routing param
      return (
        <ClinicalSummary
          chiefComplaint={chiefComplaint}
          onComplete={handleSummaryComplete}
          onBack={() => {
            if (state.currentAssessment?.status === 'completed') {
              onBack();
              return;
            }
            setCurrentView(5);
            dispatch({ type: 'SET_STEP', payload: 5 });
          }}
        />
      );
    case 5:
      return (
        <ErrorBoundary key={cdsRetryKey} 
          fallback={
            <div className="p-6">
              <Card className="max-w-4xl mx-auto">
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Clinical Decision Support Unavailable</h3>
                  <p className="text-muted-foreground mb-4">
                    There was an issue loading the clinical decision support module.
                  </p>
                  <div className="space-x-3">
                    <Button onClick={() => setCdsRetryKey((k) => k + 1)}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                    <Button variant="outline" onClick={() => setCurrentView('summary')}>
                      Skip to Summary
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          }
        >
          <ClinicalDecisionSupport
            chiefComplaint={chiefComplaint}
            onComplete={handleClinicalDecisionSupportComplete}
            onBack={() => {
              setCurrentView(4);
              dispatch({ type: 'SET_STEP', payload: 4 });
            }}
          />
        </ErrorBoundary>
      );
    case 4:
      return (
        <PhysicalExamination
          onComplete={handlePEComplete}
          onBack={() => {
            setCurrentView(3);
            dispatch({ type: 'SET_STEP', payload: 3 });
          }}
        />
      );
    case 3:
      return (
        <PastMedicalHistory
          onSubmit={handlePMHComplete}
          onBack={() => {
            setCurrentView(2);
            dispatch({ type: 'SET_STEP', payload: 2 });
          }}
        />
      );
    case 2:
      return (
        <ReviewOfSystemsComponent
          onComplete={handleROSComplete}
          onBack={() => {
            setCurrentView(1);
            dispatch({ type: 'SET_STEP', payload: 1 });
          }}
        />
      );
    case 1:
    default:
      return (
        <div className="p-6">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              {currentView !== 8 && currentView !== 'summary' && (
                <>
                  <AssessmentHeader chiefComplaint={chiefComplaint} error={error} />
                  <AssessmentProgress
                    currentStep={state.currentStep}
                    totalSteps={steps.length}
                    steps={steps}
                    progressPercent={progressPercent}
                    answersCount={answeredCount}
                  />
                </>
              )}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Phase {currentPhase}: Question {getCurrentQuestionNumber()} of {getTotalQuestions()}</span>
                  <span>Answers saved: {answeredCount}</span>
                  <span>Progress: {Math.round(progressPercent)}%</span>
                </div>
                {phaseTransition && (
                  <div className="text-xs text-gray-500 mt-1">
                    Risk Level: {phaseTransition.overallRiskLevel} | Phase 2: {phase2Triggered ? 'Active' : 'Not triggered'}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {currentQuestion ? (
                <QuestionComponent
                  question={currentQuestion}
                  onSubmit={handleAnswerSubmit}
                  questionNumber={getCurrentQuestionNumber()}
                  totalQuestions={getTotalQuestions()}
                />
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Available</h3>
                  <p className="text-gray-600 mb-4">
                    Unable to load questions for this assessment.
                  </p>
                </div>
              )}
              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={onBack}>
                  Back to Chief Complaint
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
  }
}

export function AssessmentWorkflow(props: AssessmentWorkflowProps) {
  const { state } = useMedical();
  
  return (
    <ErrorBoundary
      fallbackRender={(error, resetErrorBoundary) => (
        <AssessmentErrorRecovery
          error={error.message}
          onRetry={resetErrorBoundary}
          onRestart={props.onBack}
          onReturnHome={() => window.location.href = '/'}
          assessmentId={state.currentAssessment?.id}
        />
      )}
    >
      <AssessmentWorkflowContent {...props} />
    </ErrorBoundary>
  );
}
