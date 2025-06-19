
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
    <>
      <CardTitle className="text-2xl">Clinical Assessment</CardTitle>
      <p className="text-gray-600">
        Chief Complaint: <span className="font-medium">{chiefComplaint}</span>
      </p>
      
      {error && (
        <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </>
  );
}
