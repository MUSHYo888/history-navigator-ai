
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
    <div className="p-4 sm:p-6 animate-fade-in-up">
      <Card className="max-w-4xl mx-auto shadow-lg hover-lift">
        <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
          <div className="relative mb-6">
            <div className="absolute inset-0 animate-ping opacity-20">
              <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
            <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary relative z-10" />
          </div>
          <p className="text-base sm:text-lg font-medium text-center mb-2">{message}</p>
          <p className="text-xs sm:text-sm text-muted-foreground text-center">{subMessage}</p>
        </CardContent>
      </Card>
    </div>
  );
}
