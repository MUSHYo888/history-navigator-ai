import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { useSaveQuestions, useSaveAnswer } from '@/hooks/useAssessment';
import { toast } from 'sonner';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface AssessmentWorkflowProps {
  chiefComplaint: string;
  onComplete: () => void;
  onBack: () => void;
}

export function AssessmentWorkflow({ chiefComplaint, onComplete, onBack }: AssessmentWorkflowProps) {
  const { state, dispatch } = useMedical();
  
  // Phase 1 questions state
  const [phase1Questions, setPhase1Questions] = useState<Question[]>([]);
  const [phase1Answers, setPhase1Answers] = useState<Record<string, Answer>>({});
  const [currentPhase1Index, setCurrentPhase1Index] = useState(0);
  const [phase1Complete, setPhase1Complete] = useState(false);
  
  // Phase 2 questions state
  const [phase2Questions, setPhase2Questions] = useState<Question[]>([]);
  const [currentPhase2Index, setCurrentPhase2Index] = useState(0);
  const [phase2Complete, setPhase2Complete] = useState(false);
  const [phase2Triggered, setPhase2Triggered] = useState(false);
  
  // Transition data
  const [phaseTransition, setPhaseTransition] = useState<PhaseTransitionData | null>(null);
  
  // General state
  const [currentPhase, setCurrentPhase] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showROS, setShowROS] = useState(false);
  const [showPMH, setShowPMH] = useState(false);
  const [showPE, setShowPE] = useState(false);
  const [showClinicalDecisionSupport, setShowClinicalDecisionSupport] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [cdsRetryKey, setCdsRetryKey] = useState(0);
  const [stepTransitionLoading, setStepTransitionLoading] = useState(false);

  const saveQuestionsMutation = useSaveQuestions();
  const saveAnswerMutation = useSaveAnswer();
  const { updateStep } = useStepManager();

  const steps = [
    'History of Present Illness',
    'Review of Systems', 
    'Past Medical History',
    'Physical Examination',
    'Clinical Decision Support',
    'Patient Summary & Documentation'
  ];

  useEffect(() => {
    loadPhase1Questions();
  }, [chiefComplaint]);

  const loadPhase1Questions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Generate Phase 1 questions using clinical templates
      const questions = EnhancedQuestionGeneratorService.generatePhase1Questions(chiefComplaint);
      
      // Save Phase 1 questions to database BEFORE setting local state
      if (state.currentAssessment && questions.length > 0) {
        try {
          await saveQuestionsMutation.mutateAsync({
            assessmentId: state.currentAssessment.id,
            questions: questions
          });
          
          // Only set local state after successful database save
          setPhase1Questions(questions);
        } catch (saveError) {
          console.error('Failed to save Phase 1 questions:', saveError);
          const errorMessage = saveError?.message || 'Unknown database error';
          
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
      
    } catch (err) {
      console.error('Error loading Phase 1 questions:', err);
      setError(`Failed to load Phase 1 questions: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async (questionId: string, answer: any) => {
    
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
      console.error(`Error saving answer: ${error.message}`);
      toast.error(`Failed to save answer: ${error.message}`);
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
        setPhase1Complete(true);
        
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
      setPhase2Complete(true);
      
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
    setShowROS(true);
    await updateStep(2);
  };

  const handleROSComplete = async () => {
    
    try {
      setStepTransitionLoading(true);
      
      setShowROS(false);
      setShowPMH(true);
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
      
      dispatch({
        type: 'SET_PMH_DATA',
        payload: pmhData
      });
      
      setShowPMH(false);
      setShowPE(true);
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
      
      // Save PE data to context
      dispatch({
        type: 'SET_PE_DATA',
        payload: peData
      });
      
      
      // Update UI state
      setShowPE(false);
      setShowClinicalDecisionSupport(true);
      
      // Update step in database
      await updateStep(5);
      
      toast.success('Physical examination completed');
      
    } catch (error) {
      console.error('Error completing Physical Examination:', error);
      toast.error('Failed to save physical examination. Please try again.');
      
      // Don't proceed if there's an error - stay on PE page
      setShowPE(true);
      setShowClinicalDecisionSupport(false);
      
    } finally {
      setStepTransitionLoading(false);
    }
  };

  const handleClinicalDecisionSupportComplete = async (clinicalPlan: any) => {
    // Store clinical plan in context or database
    
    setShowClinicalDecisionSupport(false);
    setShowSummary(true);
    await updateStep(6);
  };

  const handleSummaryComplete = () => {
    onComplete();
  };

  // Calculate progress based on current phase and completion
  const calculateProgress = () => {
    if (showSummary) return 100;
    if (showClinicalDecisionSupport) return 85;
    if (showPE) return 70;
    if (showPMH) return 55;
    if (showROS) return 40;
    
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

  if (showSummary) {
    return (
      <ClinicalSummary
        chiefComplaint={chiefComplaint}
        onComplete={handleSummaryComplete}
        onBack={() => {
          setShowSummary(false);
          setShowClinicalDecisionSupport(true);
          dispatch({ type: 'SET_STEP', payload: 5 });
        }}
      />
    );
  }

  if (showClinicalDecisionSupport) {
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
                  <Button variant="outline" onClick={() => {
                    setShowClinicalDecisionSupport(false);
                    setShowSummary(true);
                  }}>
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
            setShowClinicalDecisionSupport(false);
            setShowPE(true);
            dispatch({ type: 'SET_STEP', payload: 4 });
          }}
        />
      </ErrorBoundary>
    );
  }

  if (showPE) {
    return (
      <PhysicalExamination
        onComplete={handlePEComplete}
        onBack={() => {
          setShowPE(false);
          setShowPMH(true);
          dispatch({ type: 'SET_STEP', payload: 3 });
        }}
      />
    );
  }

  if (showPMH) {
    return (
      <PastMedicalHistory
        onSubmit={handlePMHComplete}
        onBack={() => {
          setShowPMH(false);
          setShowROS(true);
          dispatch({ type: 'SET_STEP', payload: 2 });
        }}
      />
    );
  }

  if (showROS) {
    return (
      <ReviewOfSystemsComponent
        onComplete={handleROSComplete}
        onBack={() => {
          setShowROS(false);
          dispatch({ type: 'SET_STEP', payload: 1 });
        }}
      />
    );
  }

  // Current question is already defined above as currentQuestion via getCurrentQuestion()

  return (
    <div className="p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <AssessmentHeader chiefComplaint={chiefComplaint} error={error} />
          <AssessmentProgress
            currentStep={state.currentStep}
            totalSteps={steps.length}
            steps={steps}
            progressPercent={progressPercent}
            answersCount={answeredCount}
          />

          {/* Phase Progress Stats */}
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
            <Button 
              variant="outline" 
              onClick={onBack}
            >
              Back to Chief Complaint
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
