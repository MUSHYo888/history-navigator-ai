
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Question } from '@/types/medical';

interface QuestionComponentProps {
  question: Question;
  onSubmit: (questionId: string, answer: any) => void;
  questionNumber: number;
  totalQuestions: number;
}

export function QuestionComponent({ question, onSubmit, questionNumber, totalQuestions }: QuestionComponentProps) {
  const [answer, setAnswer] = useState<string | number>('');
  const [notes, setNotes] = useState('');
  const [scaleValue, setScaleValue] = useState([5]);
  const [additionalText, setAdditionalText] = useState('');

  const handleSubmit = () => {
    let finalAnswer = answer;
    let combinedNotes = notes.trim();
    
    if (question.type === 'scale') {
      finalAnswer = scaleValue[0];
    } else if (question.type === 'multiple-choice-with-text') {
      // For multiple choice with text, combine the selection and additional text
      if (additionalText.trim()) {
        combinedNotes = combinedNotes ? `${combinedNotes}. Additional details: ${additionalText.trim()}` : additionalText.trim();
      }
    }
    
    // More lenient validation - allow empty answers for non-required questions
    // Fix: Handle falsy values properly (0, false, etc should be valid)
    if (question.required && (finalAnswer === '' || finalAnswer === null || finalAnswer === undefined)) {
      return;
    }


    onSubmit(question.id, {
      value: finalAnswer,
      notes: combinedNotes || undefined
    });

    // Reset for next question
    setAnswer('');
    setNotes('');
    setScaleValue([5]);
    setAdditionalText('');
  };

  const canSubmit = () => {
    // Always allow non-required questions
    if (!question.required) return true;
    
    // For required questions, check based on type
    if (question.type === 'scale') return true; // Scale always has a value
    if (question.type === 'yes-no') return answer !== '' && answer !== null && answer !== undefined;
    if (question.type === 'multiple-choice') return answer !== '' && answer !== null && answer !== undefined;
    if (question.type === 'text') return answer.toString().trim() !== '';
    
    return true; // Default to allowing submission
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-medium">
          Question {questionNumber} of {totalQuestions}
        </h3>
        {question.required && (
          <span className="text-xs sm:text-sm text-destructive">* Required</span>
        )}
      </div>

      <div className="bg-muted/50 p-4 sm:p-6 rounded-lg border transition-smooth">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-medium mb-2">{question.text}</h2>
          {question.phase && (
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-2 py-1 text-xs rounded-full ${
                question.phase === 1 ? 'bg-info/10 text-info border border-info/20' : 'bg-primary/10 text-primary border border-primary/20'
              }`}>
                Phase {question.phase} {question.phase === 1 ? 'Clinical Assessment' : 'Follow-up Questions'}
              </span>
              {question.redFlagIndicator && (
                <span className="px-2 py-1 text-xs rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                  Red Flag Screening
                </span>
              )}
            </div>
          )}
          {question.questionRationale && (
            <p className="text-xs sm:text-sm text-muted-foreground italic mt-2">
              Clinical Note: {question.questionRationale}
            </p>
          )}
        </div>

        {/* Multiple Choice */}
        {question.type === 'multiple-choice' && question.options && (
          <RadioGroup value={answer.toString()} onValueChange={setAnswer}>
            <div className="grid grid-cols-1 gap-3">
              {question.options.map((option, index) => (
                <label 
                  key={index} 
                  htmlFor={`option-${index}`}
                  className="flex items-start space-x-3 p-3 sm:p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-smooth has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <RadioGroupItem value={option} id={`option-${index}`} className="mt-0.5" />
                  <span className="text-sm sm:text-base flex-1">{option}</span>
                </label>
              ))}
            </div>
          </RadioGroup>
        )}

        {/* Multiple Choice with Text Input */}
        {question.type === 'multiple-choice-with-text' && question.options && (
          <div className="space-y-4">
            <RadioGroup value={answer.toString()} onValueChange={setAnswer}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {question.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
            
            <div className="mt-4">
              <Label htmlFor="additional-text" className="text-sm font-medium">
                Additional details or "Other" explanation:
              </Label>
              <Textarea
                id="additional-text"
                value={additionalText}
                onChange={(e) => setAdditionalText(e.target.value)}
                placeholder="Please provide any additional details about your selection or describe if 'Other'..."
                rows={2}
                className="mt-2"
              />
            </div>
          </div>
        )}

        {/* Yes/No */}
        {question.type === 'yes-no' && (
          <RadioGroup value={answer.toString()} onValueChange={setAnswer}>
            <div className="grid grid-cols-2 gap-3">
              <label 
                htmlFor="yes"
                className="flex items-center justify-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-smooth has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <RadioGroupItem value="yes" id="yes" />
                <span className="font-medium">Yes</span>
              </label>
              <label 
                htmlFor="no"
                className="flex items-center justify-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-smooth has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <RadioGroupItem value="no" id="no" />
                <span className="font-medium">No</span>
              </label>
            </div>
          </RadioGroup>
        )}

        {/* Text Input */}
        {question.type === 'text' && (
          <Textarea
            value={answer.toString()}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Please describe in detail..."
            rows={4}
            className="resize-none min-h-[120px]"
          />
        )}

        {/* Scale */}
        {question.type === 'scale' && (
          <div className="space-y-4 p-4 bg-background rounded-lg border">
            <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
              <span>1 (Mild)</span>
              <span className="font-bold text-2xl sm:text-3xl text-primary">{scaleValue[0]}</span>
              <span>10 (Severe)</span>
            </div>
            <Slider
              value={scaleValue}
              onValueChange={setScaleValue}
              max={10}
              min={1}
              step={1}
              className="w-full touch-none"
            />
          </div>
        )}

        {/* Additional Notes */}
        <div className="mt-4 sm:mt-6">
          <Label htmlFor="notes" className="text-xs sm:text-sm text-muted-foreground font-medium">Additional Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional details or clarifications..."
            rows={2}
            className="mt-2 resize-none min-h-[80px]"
          />
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3 pt-2">
        <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
          {question.required ? 'Required field' : 'Optional - click Next to skip'}
        </div>
        <Button 
          onClick={handleSubmit}
          disabled={!canSubmit()}
          className="bg-primary hover:bg-primary/90 h-11 sm:h-10 w-full sm:w-auto hover-lift"
          size="lg"
        >
          {questionNumber === totalQuestions ? 'Continue to Review of Systems' : 'Next Question'}
        </Button>
      </div>
    </div>
  );
}
