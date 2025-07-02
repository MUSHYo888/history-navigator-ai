
// ABOUTME: Clinical actions panel component for assessment workflow controls
// ABOUTME: Provides navigation and action buttons for clinical assessment flow

import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, TestTube, Pill } from 'lucide-react';

interface ClinicalActionsPanelProps {
  onBack: () => void;
  onRegenerate: () => void;
  onProceedToInvestigations: () => void;
  onProceedToTreatment: () => void;
  onCompleteAssessment: () => void;
  loading: boolean;
  completing: boolean;
}

export function ClinicalActionsPanel({
  onBack,
  onRegenerate,
  onProceedToInvestigations,
  onProceedToTreatment,
  onCompleteAssessment,
  loading,
  completing
}: ClinicalActionsPanelProps) {
  return (
    <div className="flex justify-between pt-6 border-t">
      <Button variant="outline" onClick={onBack}>
        Back to Physical Exam
      </Button>
      
      <div className="space-x-3">
        <Button 
          variant="outline" 
          onClick={onRegenerate}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Regenerate Assessment
        </Button>
        <Button 
          onClick={onProceedToInvestigations}
          className="bg-blue-600 hover:bg-blue-700"
          disabled={loading}
        >
          <TestTube className="h-4 w-4 mr-2" />
          Order Investigations
        </Button>
        <Button 
          onClick={onProceedToTreatment}
          className="bg-green-600 hover:bg-green-700"
          disabled={loading}
        >
          <Pill className="h-4 w-4 mr-2" />
          Treatment Plan
        </Button>
        <Button 
          onClick={onCompleteAssessment}
          className="bg-teal-600 hover:bg-teal-700"
          disabled={completing}
        >
          {completing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Complete Assessment
        </Button>
      </div>
    </div>
  );
}
