
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

  const handleSubmit = () => {
    let finalAnswer = answer;
    
    if (question.type === 'scale') {
      finalAnswer = scaleValue[0];
    }
    
    if (!finalAnswer && question.required) return;

    onSubmit(question.id, {
      value: finalAnswer,
      notes: notes.trim() || undefined
    });

    // Reset for next question
    setAnswer('');
    setNotes('');
    setScaleValue([5]);
  };

  const canSubmit = () => {
    if (!question.required) return true;
    
    if (question.type === 'scale') return true;
    if (question.type === 'yes-no') return answer !== '';
    if (question.type === 'multiple-choice') return answer !== '';
    if (question.type === 'text') return answer.toString().trim() !== '';
    
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          Question {questionNumber} of {totalQuestions}
        </h3>
        {question.required && (
          <span className="text-sm text-red-500">* Required</span>
        )}
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-medium mb-6">{question.text}</h2>

        {/* Multiple Choice */}
        {question.type === 'multiple-choice' && question.options && (
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
        )}

        {/* Yes/No */}
        {question.type === 'yes-no' && (
          <RadioGroup value={answer.toString()} onValueChange={setAnswer}>
            <div className="flex space-x-6">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="yes" />
                <Label htmlFor="yes" className="cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="no" />
                <Label htmlFor="no" className="cursor-pointer">No</Label>
              </div>
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
          />
        )}

        {/* Scale */}
        {question.type === 'scale' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>1 (Mild)</span>
              <span className="font-medium text-lg text-gray-900">{scaleValue[0]}</span>
              <span>10 (Severe)</span>
            </div>
            <Slider
              value={scaleValue}
              onValueChange={setScaleValue}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
          </div>
        )}

        {/* Additional Notes */}
        <div className="mt-6">
          <Label htmlFor="notes" className="text-sm text-gray-600">Additional Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional details or clarifications..."
            rows={2}
            className="mt-2"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit}
          disabled={!canSubmit()}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {questionNumber === totalQuestions ? 'Continue to Review of Systems' : 'Next Question'}
        </Button>
      </div>
    </div>
  );
}
