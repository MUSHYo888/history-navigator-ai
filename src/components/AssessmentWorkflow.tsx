
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
    loadQuestions();
  }, [chiefComplaint]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const generatedQuestions = await AIService.generateQuestions(chiefComplaint);
      setQuestions(generatedQuestions);
      
      if (state.currentAssessment && !questionsGenerated) {
        console.log('Saving questions to database for assessment:', state.currentAssessment.id);
        await saveQuestionsMutation.mutateAsync({
          assessmentId: state.currentAssessment.id,
          questions: generatedQuestions
        });
        setQuestionsGenerated(true);
      }
    } catch (err) {
      console.error('Error loading questions:', err);
      setError('Failed to load AI-generated questions. Using fallback questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async (questionId: string, answer: any) => {
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

    if (state.currentAssessment) {
      try {
        await saveAnswerMutation.mutateAsync({
          assessmentId: state.currentAssessment.id,
          questionId,
          answer: {
            questionId,
            value: answer.value,
            notes: answer.notes
          }
        });
        console.log('Answer saved to database');
      } catch (error) {
        console.error('Failed to save answer to database:', error);
      }
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setShowROS(true);
      await updateStep(2);
    }
  };

  const handleROSComplete = async () => {
    setShowROS(false);
    setShowPMH(true);
    await updateStep(3);
  };

  const handlePMHComplete = async (pmhData: any) => {
    dispatch({
      type: 'SET_PMH_DATA',
      payload: pmhData
    });
    
    setShowPMH(false);
    setShowPE(true);
    await updateStep(4);
  };

  const handlePEComplete = async (peData: any) => {
    dispatch({
      type: 'SET_PE_DATA',
      payload: peData
    });
    
    setShowPE(false);
    setShowSummary(true);
    await updateStep(5);
  };

  const handleSummaryComplete = () => {
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
