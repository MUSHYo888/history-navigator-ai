
// ABOUTME: Progress display component for assessment workflow
// ABOUTME: Shows current step, progress bar, and navigation information
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle } from 'lucide-react';

interface AssessmentProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
  progressPercent: number;
  answersCount: number;
}

export function AssessmentProgress({ 
  currentStep, 
  totalSteps, 
  steps, 
  progressPercent, 
  answersCount 
}: AssessmentProgressProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="text-sm text-gray-600">
          Step {currentStep} of {totalSteps}
        </p>
        <p className="font-medium">{steps[currentStep - 1]}</p>
      </div>
      <div className="flex items-center space-x-4">
        <Progress value={progressPercent} className="w-32" />
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span>{answersCount} questions answered</span>
        </div>
      </div>
    </div>
  );
}
