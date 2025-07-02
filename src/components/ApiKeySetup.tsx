// ABOUTME: API key setup component for configuring OpenRouter AI service
// ABOUTME: Provides interface for users to configure API keys when service fails

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, ExternalLink, AlertTriangle } from 'lucide-react';

interface ApiKeySetupProps {
  onApiKeyConfigured: () => void;
  error?: string;
}

export function ApiKeySetup({ onApiKeyConfigured, error }: ApiKeySetupProps) {
  const [isConfiguring, setIsConfiguring] = useState(false);

  const handleOpenSupabaseSecrets = () => {
    const projectId = "4cdc7514-eff8-44ee-a4ff-be4016dddc33";
    const url = `https://supabase.com/dashboard/project/${projectId}/settings/functions`;
    window.open(url, '_blank');
  };

  const handleTestConnection = async () => {
    setIsConfiguring(true);
    try {
      // Test the AI service by making a simple request
      const response = await fetch('/api/test-ai-connection');
      if (response.ok) {
        onApiKeyConfigured();
      }
    } catch (err) {
      console.error('Failed to test AI connection:', err);
    } finally {
      setIsConfiguring(false);
    }
  };

  return (
    <div className="p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl flex items-center space-x-2">
            <Key className="h-5 w-5 text-yellow-600" />
            <span>AI Service Configuration Required</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">OpenRouter API Configuration</h3>
              <p className="text-gray-600 text-sm mb-4">
                The AI features require an OpenRouter API key to function. You'll need to configure this in your Supabase project settings.
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg space-y-3">
              <h4 className="font-medium text-blue-900">Setup Instructions:</h4>
              <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                <li>Get an API key from <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="underline">OpenRouter.ai</a></li>
                <li>Click the button below to open Supabase Edge Function secrets</li>
                <li>Add a new secret with name: <code className="bg-white px-1 rounded">OPENROUTER_API_KEY</code></li>
                <li>Paste your OpenRouter API key as the value</li>
                <li>Save the secret and return here to test the connection</li>
              </ol>
            </div>

            <div className="flex flex-col space-y-3">
              <Button
                onClick={handleOpenSupabaseSecrets}
                variant="outline"
                className="flex items-center justify-center space-x-2"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Open Supabase Secrets Configuration</span>
              </Button>

              <Button
                onClick={handleTestConnection}
                disabled={isConfiguring}
                className="bg-primary hover:bg-primary/90"
              >
                {isConfiguring ? 'Testing Connection...' : 'Test AI Connection'}
              </Button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Fallback Mode</h4>
              <p className="text-sm text-gray-600 mb-3">
                While AI features are unavailable, the application will use evidence-based clinical protocols and fallback data.
              </p>
              <Button
                onClick={onApiKeyConfigured}
                variant="outline"
                size="sm"
              >
                Continue with Limited Features
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}