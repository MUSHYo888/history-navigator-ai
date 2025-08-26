import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

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
  const [aiServiceHealthy, setAiServiceHealthy] = useState<boolean | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const saveQuestionsMutation = useSaveQuestions();
  const saveAnswerMutation = useSaveAnswer();
  const { updateStep } = useStepManager();

  const steps = [
    'History of Present Illness',
    'Review of Systems', 
    'Past Medical History',
    'Physical Examination',
    'Assessment & Plan'
  ];

  useEffect(() => {
    console.log('AssessmentWorkflow mounted for chief complaint:', chiefComplaint);
    loadQuestions();
  }, [chiefComplaint]);

  const testAIService = async (): Promise<boolean> => {
    try {
      console.log('Testing AI service health...');
      const testQuestions = await AIService.generateQuestions('test headache for system check');
      const isHealthy = testQuestions && testQuestions.length > 0;
      setAiServiceHealthy(isHealthy);
      console.log('AI service health check result:', isHealthy);
      return isHealthy;
    } catch (error) {
      console.error('AI service health check failed:', error);
      setAiServiceHealthy(false);
      return false;
    }
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Loading questions for chief complaint: ${chiefComplaint} (attempt ${retryCount + 1})`);
      
      // Test AI service first
      const aiHealthy = await testAIService();
      
      if (!aiHealthy && retryCount === 0) {
        console.warn('AI service appears unhealthy on first attempt, trying anyway...');
      }
      
      const generatedQuestions = await AIService.generateQuestions(chiefComplaint);
      console.log(`Generated ${generatedQuestions.length} questions:`, generatedQuestions.map(q => ({ id: q.id, text: q.text.substring(0, 50) + '...' })));
      
      // Validate all questions have proper UUIDs
      const invalidQuestions = generatedQuestions.filter(q => !q.id || typeof q.id !== 'string' || q.id.length < 36);
      if (invalidQuestions.length > 0) {
        console.error(`${invalidQuestions.length} questions have invalid IDs:`, invalidQuestions);
        throw new Error(`Generated questions have invalid UUID format`);
      }
      
      setAiServiceHealthy(true);
      
      // Save questions to database BEFORE showing them to user
      if (state.currentAssessment && !questionsGenerated) {
        console.log(`Saving ${generatedQuestions.length} questions to database for assessment: ${state.currentAssessment.id}`);
        try {
          await saveQuestionsMutation.mutateAsync({
            assessmentId: state.currentAssessment.id,
            questions: generatedQuestions
          });
          setQuestionsGenerated(true);
          console.log('Questions saved successfully to database');
          
          // Only set questions in state AFTER successful database save
          setQuestions(generatedQuestions);
          toast.success(`${generatedQuestions.length} questions loaded and saved`);
        } catch (saveError) {
          console.error(`Failed to save questions: ${saveError.message}`);
          toast.error('Failed to save questions to database. Please try again.');
          throw new Error(`Failed to save questions: ${saveError.message}`);
        }
      } else {
        // If questions already generated, just set them
        setQuestions(generatedQuestions);
      }
      
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error(`Error loading questions (attempt ${retryCount + 1}):`, err);
      setError(`Failed to load questions: ${err.message || 'Unknown error'}`);
      setAiServiceHealthy(false);
      
      if (retryCount < 2) {
        console.log(`Will retry loading questions (attempt ${retryCount + 2}/3)`);
        toast.error(`Failed to load questions (attempt ${retryCount + 1}/3). Retrying...`);
      } else {
        toast.error('Failed to generate questions after 3 attempts. Please check system health.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetryQuestions = async () => {
    setRetryCount(prev => prev + 1);
    await loadQuestions();
  };

  const handleAnswerSubmit = async (questionId: string, answer: any) => {
    console.log(`Submitting answer for question ${questionId}:`, answer);
    
    if (!state.currentAssessment) {
      console.error('No current assessment found');
      toast.error('Assessment session lost. Please restart assessment.');
      setError('Assessment session lost. Please restart assessment.');
      return;
    }

    // Validate question ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(questionId)) {
      console.error(`Invalid question ID format: ${questionId}`);
      toast.error('Invalid question ID format. Please try again.');
      setError(`Invalid question ID format: ${questionId}`);
      return;
    }

    // Validate answer format - be more lenient with validation
    if (!answer || (typeof answer.value === 'undefined' && typeof answer.value !== 'number' && typeof answer.value !== 'boolean')) {
      console.error('Invalid answer format:', answer);
      toast.error('Invalid answer format. Please provide a valid answer.');
      return;
    }

    // Log detailed answer submission info for debugging
    console.log('Answer submission details:', {
      questionId,
      answerValue: answer.value,
      answerType: typeof answer.value,
      notes: answer.notes,
      assessmentId: state.currentAssessment.id
    });

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
      console.log('Answer added to local state');

      // Save to database
      console.log('Attempting to save answer to database...');
      await saveAnswerMutation.mutateAsync({
        assessmentId: state.currentAssessment.id,
        questionId,
        answer: {
          questionId,
          value: answer.value,
          notes: answer.notes
        }
      });
      
      console.log('Answer saved successfully to database');
      toast.success('Answer saved successfully');

      // Proceed to next question or next step
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        console.log(`Moving to question ${currentQuestionIndex + 2} of ${questions.length}`);
      } else {
        console.log('All questions answered, proceeding to Review of Systems');
        setShowROS(true);
        await updateStep(2);
      }

    } catch (error) {
      console.error(`Error saving answer: ${error.message}`);
      toast.error(`Failed to save answer: ${error.message}`);
      setError(`Failed to save your answer: ${error.message}. Please try again.`);
    }
  };

  const handleROSComplete = async () => {
    console.log('ROS completed, moving to PMH');
    setShowROS(false);
    setShowPMH(true);
    await updateStep(3);
  };

  const handlePMHComplete = async (pmhData: any) => {
    console.log('PMH completed, saving data');
    dispatch({
      type: 'SET_PMH_DATA',
      payload: pmhData
    });
    
    setShowPMH(false);
    setShowPE(true);
    await updateStep(4);
  };

  const handlePEComplete = async (peData: any) => {
    console.log('PE completed, saving data');
    dispatch({
      type: 'SET_PE_DATA',
      payload: peData
    });
    
    setShowPE(false);
    setShowSummary(true);
    await updateStep(5);
  };

  const handleSummaryComplete = () => {
    console.log('Assessment workflow completed');
    onComplete();
  };

  const progressPercent = showSummary ? 100 : 
    showPE ? 80 : 
    showPMH ? 60 : 
    showROS ? 40 : 
    (currentQuestionIndex / Math.max(questions.length, 1)) * 30;

  const answeredCount = Object.keys(state.answers).length;

  if (loading) {
    return (
      <div className="p-6">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-8">
            <LoadingState />
            <div className="mt-4 text-center">
              <p className="text-gray-600">Loading questions for: {chiefComplaint}</p>
              {aiServiceHealthy === false && (
                <p className="text-orange-600 text-sm mt-2">
                  AI service may be experiencing issues. Using fallback questions if needed.
                </p>
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
            answersCount={answeredCount}
          />

          {/* AI Service Status */}
          {aiServiceHealthy !== null && (
            <div className="mt-4">
              {aiServiceHealthy ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    AI service is operational. Generated {questions.length} questions.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    AI service is experiencing issues. Using fallback questions to continue assessment.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Progress Stats */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Questions: {currentQuestionIndex + 1} of {questions.length}</span>
              <span>Answers saved: {answeredCount}</span>
              <span>Progress: {Math.round(progressPercent)}%</span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {currentQuestion ? (
            <QuestionComponent
              question={currentQuestion}
              onSubmit={handleAnswerSubmit}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
            />
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Available</h3>
              <p className="text-gray-600 mb-4">
                Unable to load questions for this assessment. This may be due to AI service issues.
              </p>
              <Button onClick={handleRetryQuestions} className="mr-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Loading Questions
              </Button>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <Button 
              variant="outline" 
              onClick={currentQuestionIndex > 0 ? () => setCurrentQuestionIndex(prev => prev - 1) : onBack}
            >
              {currentQuestionIndex > 0 ? 'Previous Question' : 'Back to Chief Complaint'}
            </Button>
            
            {error && questions.length === 0 && (
              <Button 
                onClick={handleRetryQuestions}
                variant="outline"
                className="ml-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Questions ({retryCount + 1}/3)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
