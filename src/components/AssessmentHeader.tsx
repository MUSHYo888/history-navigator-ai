
// ABOUTME: Header component for assessment workflow
// ABOUTME: Displays assessment title, chief complaint, and error messages
import React from 'react';
import { CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface AssessmentHeaderProps {
  chiefComplaint: string;
  error?: string | null;
}

export function AssessmentHeader({ chiefComplaint, error }: AssessmentHeaderProps) {
  return (
    <div className="space-y-3 animate-fade-in">
      <CardTitle className="text-xl sm:text-2xl">Clinical Assessment</CardTitle>
      <p className="text-sm sm:text-base text-muted-foreground">
        Chief Complaint: <span className="font-medium text-foreground">{chiefComplaint}</span>
      </p>
      
      {error && (
        <div className="flex items-center space-x-2 text-warning bg-warning/10 p-3 rounded-lg animate-slide-in-left border border-warning/20">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
}
