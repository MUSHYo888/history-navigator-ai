
// ABOUTME: Loading state component for assessment workflow
// ABOUTME: Shows spinner and loading messages during AI operations
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
}

export function LoadingState({ 
  message = "Generating personalized questions...", 
  subMessage = "AI is analyzing the chief complaint" 
}: LoadingStateProps) {
  return (
    <div className="p-6">
      <Card className="max-w-4xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 mb-4" />
          <p className="text-lg">{message}</p>
          <p className="text-sm text-gray-600">{subMessage}</p>
        </CardContent>
      </Card>
    </div>
  );
}
