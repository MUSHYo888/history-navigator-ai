
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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0 animate-fade-in">
      <div className="space-y-1">
        <p className="text-xs sm:text-sm text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </p>
        <p className="font-medium text-sm sm:text-base">{steps[currentStep - 1]}</p>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
        <div className="w-full sm:w-32">
          <Progress value={progressPercent} className="transition-smooth" />
        </div>
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground bg-success/10 px-3 py-1.5 rounded-full">
          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-success" />
          <span className="whitespace-nowrap">{answersCount} answered</span>
        </div>
      </div>
    </div>
  );
}
