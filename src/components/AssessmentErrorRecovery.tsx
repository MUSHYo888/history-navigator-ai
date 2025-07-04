
// ABOUTME: Error recovery component for assessment workflow interruptions
// ABOUTME: Provides graceful error handling and recovery options for users

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, RotateCcw, Download } from 'lucide-react';
import { useMedical } from '@/context/MedicalContext';
import { useAssessment } from '@/hooks/useAssessment';

interface AssessmentErrorRecoveryProps {
  error: string;
  onRetry: () => void;
  onRestart: () => void;
  onReturnHome: () => void;
  assessmentId?: string;
  patientId?: string;
}

export function AssessmentErrorRecovery({
  error,
  onRetry,
  onRestart,
  onReturnHome,
  assessmentId,
  patientId
}: AssessmentErrorRecoveryProps) {
  const { state } = useMedical();
  const [downloading, setDownloading] = useState(false);
  const { data: assessment } = useAssessment(assessmentId || '');

  const handleDownloadProgress = async () => {
    if (!state.currentPatient || !state.answers) return;
    
    setDownloading(true);
    try {
      const progressData = {
        patient: state.currentPatient,
        assessment: assessment || state.currentAssessment,
        answers: state.answers,
        rosData: state.rosData,
        pmhData: state.pmhData,
        peData: state.peData,
        timestamp: new Date().toISOString(),
        error: error
      };

      const dataStr = JSON.stringify(progressData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `assessment-backup-${state.currentPatient.patientId}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download progress:', err);
    } finally {
      setDownloading(false);
    }
  };

  const getErrorCategory = (errorMessage: string) => {
    if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')) {
      return 'network';
    }
    if (errorMessage.toLowerCase().includes('ai') || errorMessage.toLowerCase().includes('openrouter')) {
      return 'ai';
    }
    if (errorMessage.toLowerCase().includes('database') || errorMessage.toLowerCase().includes('supabase')) {
      return 'database';
    }
    return 'general';
  };

  const getRecoveryRecommendations = (category: string) => {
    switch (category) {
      case 'network':
        return [
          'Check your internet connection',
          'Try refreshing the page',
          'Disable any VPN or proxy temporarily',
          'Try again in a few minutes'
        ];
      case 'ai':
        return [
          'AI services may be temporarily unavailable',
          'The system will use fallback clinical protocols',
          'Your progress is saved and you can continue',
          'Contact support if issue persists'
        ];
      case 'database':
        return [
          'Database connection issue detected',
          'Your answers may not have been saved',
          'Try the retry button to attempt saving again',
          'Download your progress as backup'
        ];
      default:
        return [
          'An unexpected error occurred',
          'Try retrying the operation',
          'Your progress should be preserved',
          'Contact support if the problem continues'
        ];
    }
  };

  const errorCategory = getErrorCategory(error);
  const recommendations = getRecoveryRecommendations(errorCategory);

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Assessment Error</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Error Details */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Error Details:</p>
                <p className="text-sm font-mono bg-red-100 p-2 rounded">{error}</p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Recovery Recommendations */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Recommended Actions:</h3>
            <ul className="space-y-2">
              {recommendations.map((rec, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span className="text-sm text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Progress Information */}
          {state.currentPatient && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Your Progress:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Patient:</span>
                  <p className="font-medium">{state.currentPatient.name}</p>
                </div>
                <div>
                  <span className="text-blue-700">Answers Saved:</span>
                  <p className="font-medium">{Object.keys(state.answers).length}</p>
                </div>
                <div>
                  <span className="text-blue-700">Current Step:</span>
                  <p className="font-medium">Step {state.currentStep}/5</p>
                </div>
                <div>
                  <span className="text-blue-700">Assessment ID:</span>
                  <p className="font-medium text-xs">{state.currentAssessment?.id || 'Not saved'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Recovery Actions */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={onRetry}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </Button>

            <Button 
              onClick={onRestart}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Restart Assessment</span>
            </Button>

            <Button 
              onClick={handleDownloadProgress}
              variant="outline"
              disabled={downloading}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>{downloading ? 'Downloading...' : 'Backup Progress'}</span>
            </Button>

            <Button 
              onClick={onReturnHome}
              variant="secondary"
              className="flex items-center space-x-2"
            >
              <Home className="h-4 w-4" />
              <span>Return Home</span>
            </Button>
          </div>

          {/* Support Information */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-600">
              If you continue to experience issues, please contact support with the error details above.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
