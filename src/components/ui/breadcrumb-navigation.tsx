// ABOUTME: Breadcrumb navigation component for assessment workflow progress
// ABOUTME: Shows current step, completed steps, and allows navigation to previous completed steps

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Check, Circle } from 'lucide-react';

interface BreadcrumbStep {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
  clickable: boolean;
}

interface BreadcrumbNavigationProps {
  steps: BreadcrumbStep[];
  onStepClick: (stepId: string) => void;
}

export function BreadcrumbNavigation({ steps, onStepClick }: BreadcrumbNavigationProps) {
  return (
    <nav aria-label="Assessment Progress" className="mb-6">
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Button
                variant={step.current ? "default" : step.completed ? "secondary" : "ghost"}
                size="sm"
                className={`
                  flex items-center space-x-2 px-3 py-2 rounded-lg transition-all
                  ${step.current ? 'bg-primary text-primary-foreground shadow-sm' : ''}
                  ${step.completed && !step.current ? 'bg-secondary text-secondary-foreground' : ''}
                  ${step.clickable && !step.current ? 'hover:bg-muted cursor-pointer' : ''}
                  ${!step.clickable && !step.current ? 'cursor-not-allowed opacity-60' : ''}
                `}
                onClick={() => step.clickable && !step.current ? onStepClick(step.id) : undefined}
                disabled={!step.clickable || step.current}
              >
                <div className="flex items-center justify-center w-5 h-5">
                  {step.completed && !step.current ? (
                    <Check className="h-3 w-3" />
                  ) : step.current ? (
                    <Circle className="h-3 w-3 fill-current" />
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                </div>
                <span className="text-sm font-medium whitespace-nowrap">{step.label}</span>
              </Button>
              
              {step.current && (
                <Badge variant="secondary" className="text-xs">
                  Current
                </Badge>
              )}
            </div>
            {index < steps.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
}