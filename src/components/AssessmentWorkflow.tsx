
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AIService } from '@/services/aiService';
import { Question } from '@/types/medical';
import { useMedical } from '@/context/MedicalContext';
import { QuestionComponent } from './QuestionComponent';
import { ReviewOfSystemsComponent } from './ReviewOfSystemsComponent';
import { PastMedicalHistory } from './PastMedicalHistory';
import { PhysicalExamination } from './PhysicalExamination';
import { ClinicalSummary } from './ClinicalSummary';
import { AssessmentProgress } from './AssessmentProgress';
import { AssessmentHeader } from './AssessmentHeader';
import { LoadingState } from './LoadingState';
import { useStepManager } from './StepManager';
import { useSaveQuestions, useSaveAnswer } from '@/hooks/useAssessment';
import { toast } from 'sonner';

interface AssessmentWorkflowProps {
  chiefComplaint: string;
  onComplete: () => void;
  onBack: () => void;
}

export function AssessmentWorkflow({ chiefComplaint, onComplete, onBack }: AssessmentWorkflowProps) {
  const { state, dispatch } = useMedical();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showROS, setShowROS] = useState(false);
  const [showPMH, setShowPMH] = useState(false);
  const [showPE, setShowPE] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [questionsGenerated, setQuestionsGenerated] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const saveQuestionsMutation = useSaveQuestions();
  const saveAnswerMutation = useSaveAnswer();
  const { updateStep } = useStepManager();

  const addDebugInfo = (info: string) => {
    const timestamp = new Date().toISOString();
    setDebugInfo(prev => [...prev, `[${timestamp}] ${info}`]);
    console.log(`DEBUG: ${info}`);
  };

  const steps = [
    'History of Present Illness',
    'Review of Systems', 
    'Past Medical History',
    'Physical Examination',
    'Assessment & Plan'
  ];

  useEffect(() => {
    addDebugInfo('AssessmentWorkflow mounted');
    loadQuestions();
  }, [chiefComplaint]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      addDebugInfo(`Loading questions for chief complaint: ${chiefComplaint}`);
      
      const generatedQuestions = await AIService.generateQuestions(chiefComplaint);
      addDebugInfo(`Generated ${generatedQuestions.length} questions`);
      setQuestions(generatedQuestions);
      
      if (state.currentAssessment && !questionsGenerated) {
        addDebugInfo(`Saving questions to database for assessment: ${state.currentAssessment.id}`);
        try {
          await saveQuestionsMutation.mutateAsync({
            assessmentId: state.currentAssessment.id,
            questions: generatedQuestions
          });
          setQuestionsGenerated(true);
          addDebugInfo('Questions saved successfully to database');
        } catch (saveError) {
          addDebugInfo(`Failed to save questions: ${saveError.message}`);
          setError('Questions generated but failed to save. Assessment will continue with temporary data.');
          toast.error('Questions could not be saved to database');
        }
      }
    } catch (err) {
      addDebugInfo(`Error loading questions: ${err.message}`);
      setError(`Failed to load questions: ${err.message || 'Unknown error'}`);
      toast.error('Failed to generate questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async (questionId: string, answer: any) => {
    addDebugInfo(`Submitting answer for question ${questionId}: ${JSON.stringify(answer)}`);
    
    if (!state.currentAssessment) {
      addDebugInfo('ERROR: No current assessment found');
      toast.error('Assessment session lost. Please restart assessment.');
      setError('Assessment session lost. Please restart assessment.');
      return;
    }

    // Validate answer format
    if (!answer || typeof answer.value === 'undefined') {
      addDebugInfo('ERROR: Invalid answer format');
      toast.error('Invalid answer format. Please try again.');
      return;
    }

    try {
      // Update local state first
      dispatch({
        type: 'ADD_ANSWER',
        payload: {
          questionId,
          answer: {
            questionId,
            value: answer.value,
            notes: answer.notes
          }
        }
      });
      addDebugInfo('Answer added to local state');

      // Save to database with comprehensive error handling
      addDebugInfo('Attempting to save answer to database...');
      await saveAnswerMutation.mutateAsync({
        assessmentId: state.currentAssessment.id,
        questionId,
        answer: {
          questionId,
          value: answer.value,
          notes: answer.notes
        }
      });
      
      addDebugInfo('Answer saved successfully to database');
      toast.success('Answer saved successfully');

      // Proceed to next question or next step
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        addDebugInfo(`Moving to question ${currentQuestionIndex + 2}`);
      } else {
        addDebugInfo('All questions answered, proceeding to ROS');
        setShowROS(true);
        await updateStep(2);
      }

    } catch (error) {
      addDebugInfo(`CRITICAL ERROR saving answer: ${error.message}`);
      toast.error(`Failed to save answer: ${error.message}`);
      setError(`Failed to save your answer: ${error.message}. Please try again.`);
      
      // Don't proceed if saving failed - critical for data integrity
      return;
    }
  };

  const handleROSComplete = async () => {
    addDebugInfo('ROS completed, moving to PMH');
    setShowROS(false);
    setShowPMH(true);
    await updateStep(3);
  };

  const handlePMHComplete = async (pmhData: any) => {
    addDebugInfo('PMH completed, saving data');
    dispatch({
      type: 'SET_PMH_DATA',
      payload: pmhData
    });
    
    setShowPMH(false);
    setShowPE(true);
    await updateStep(4);
  };

  const handlePEComplete = async (peData: any) => {
    addDebugInfo('PE completed, saving data');
    dispatch({
      type: 'SET_PE_DATA',
      payload: peData
    });
    
    setShowPE(false);
    setShowSummary(true);
    await updateStep(5);
  };

  const handleSummaryComplete = () => {
    addDebugInfo('Assessment workflow completed');
    onComplete();
  };

  const progressPercent = showSummary ? 100 : showPE ? 80 : showPMH ? 60 : showROS ? 40 : (currentQuestionIndex / Math.max(questions.length, 1)) * 30;

  if (loading) {
    return <LoadingState />;
  }

  if (showSummary) {
    return (
      <ClinicalSummary
        chiefComplaint={chiefComplaint}
        onComplete={handleSummaryComplete}
        onBack={() => {
          setShowSummary(false);
          setShowPE(true);
          dispatch({ type: 'SET_STEP', payload: 4 });
        }}
      />
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

  const currentQuestion = questions[currentQuestionIndex];

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
            answersCount={Object.keys(state.answers).length}
          />
          
          {/* Debug Information Panel (only shown when there are errors) */}
          {(error || debugInfo.length > 0) && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <details>
                <summary className="cursor-pointer text-sm font-medium text-gray-700">
                  Debug Information ({debugInfo.length} events)
                </summary>
                <div className="mt-2 text-xs text-gray-600 space-y-1 max-h-32 overflow-y-auto">
                  {debugInfo.slice(-10).map((info, index) => (
                    <div key={index} className="font-mono">{info}</div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {currentQuestion && (
            <QuestionComponent
              question={currentQuestion}
              onSubmit={handleAnswerSubmit}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
            />
          )}

          <div className="flex justify-between mt-8">
            <Button 
              variant="outline" 
              onClick={currentQuestionIndex > 0 ? () => setCurrentQuestionIndex(prev => prev - 1) : onBack}
            >
              {currentQuestionIndex > 0 ? 'Previous Question' : 'Back to Chief Complaint'}
            </Button>
            
            {error && (
              <Button 
                onClick={loadQuestions}
                variant="outline"
                className="ml-4"
              >
                Retry Questions
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
