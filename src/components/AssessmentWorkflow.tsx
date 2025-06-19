
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { AIService } from '@/services/aiService';
import { Question } from '@/types/medical';
import { useMedical } from '@/context/MedicalContext';
import { QuestionComponent } from './QuestionComponent';
import { ReviewOfSystemsComponent } from './ReviewOfSystemsComponent';
import { PastMedicalHistory } from './PastMedicalHistory';
import { PhysicalExamination } from './PhysicalExamination';
import { ClinicalSummary } from './ClinicalSummary';
import { useSaveQuestions, useSaveAnswer, useUpdateAssessmentStep } from '@/hooks/useAssessment';

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
  const updateStepMutation = useUpdateAssessmentStep();

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
      
      // Save questions to database if we have a current assessment
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
      // Fallback questions would be loaded here
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async (questionId: string, answer: any) => {
    // Save to context
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

    // Save to database
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
      // Move to ROS
      setShowROS(true);
      dispatch({ type: 'SET_STEP', payload: 2 });
      
      // Update assessment step in database
      if (state.currentAssessment) {
        await updateStepMutation.mutateAsync({
          assessmentId: state.currentAssessment.id,
          step: 2
        });
      }
    }
  };

  const handleROSComplete = async () => {
    setShowROS(false);
    setShowPMH(true);
    dispatch({ type: 'SET_STEP', payload: 3 });
    
    // Update assessment step in database
    if (state.currentAssessment) {
      await updateStepMutation.mutateAsync({
        assessmentId: state.currentAssessment.id,
        step: 3
      });
    }
  };

  const handlePMHComplete = async (pmhData: any) => {
    // Store PMH data in context
    dispatch({
      type: 'SET_PMH_DATA',
      payload: pmhData
    });
    
    setShowPMH(false);
    setShowPE(true);
    dispatch({ type: 'SET_STEP', payload: 4 });
    
    // Update assessment step in database
    if (state.currentAssessment) {
      await updateStepMutation.mutateAsync({
        assessmentId: state.currentAssessment.id,
        step: 4
      });
    }
  };

  const handlePEComplete = async (peData: any) => {
    // Store PE data in context
    dispatch({
      type: 'SET_PE_DATA',
      payload: peData
    });
    
    setShowPE(false);
    setShowSummary(true);
    dispatch({ type: 'SET_STEP', payload: 5 });
    
    // Update assessment step in database
    if (state.currentAssessment) {
      await updateStepMutation.mutateAsync({
        assessmentId: state.currentAssessment.id,
        step: 5
      });
    }
  };

  const handleSummaryComplete = () => {
    onComplete();
  };

  const progressPercent = showSummary ? 100 : showPE ? 80 : showPMH ? 60 : showROS ? 40 : (currentQuestionIndex / Math.max(questions.length, 1)) * 30;

  if (loading) {
    return (
      <div className="p-6">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600 mb-4" />
            <p className="text-lg">Generating personalized questions...</p>
            <p className="text-sm text-gray-600">AI is analyzing the chief complaint</p>
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-2xl">Clinical Assessment</CardTitle>
              <p className="text-gray-600">Chief Complaint: <span className="font-medium">{chiefComplaint}</span></p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                Step {state.currentStep} of {steps.length}
              </p>
              <p className="font-medium">{steps[state.currentStep - 1]}</p>
            </div>
          </div>
          
          <Progress value={progressPercent} className="w-full" />
          
          {error && (
            <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
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
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>{Object.keys(state.answers).length} questions answered</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
