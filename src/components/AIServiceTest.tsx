// ABOUTME: AI service testing component for debugging and validation
// ABOUTME: Provides interface to test edge function connectivity and API responses

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { AIService } from '@/services/aiService';
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

export function AIServiceTest() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [chiefComplaint, setChiefComplaint] = useState('Chest pain');

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    const startTime = Date.now();
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      setTestResults(prev => [...prev, {
        name: testName,
        status: 'success',
        result,
        duration,
        timestamp: new Date().toISOString()
      }]);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      setTestResults(prev => [...prev, {
        name: testName,
        status: 'error',
        error: error.message,
        duration,
        timestamp: new Date().toISOString()
      }]);
      throw error;
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setTestResults([]);

    try {
      // Test 1: Direct Edge Function Call
      await runTest('Direct Edge Function', async () => {
        const { data, error } = await supabase.functions.invoke('ai-assistant', {
          body: {
            action: 'generate-questions',
            chiefComplaint: chiefComplaint
          }
        });
        
        if (error) throw new Error(`Edge function error: ${error.message}`);
        if (!data) throw new Error('No data returned from edge function');
        
        return {
          questionsCount: data.questions?.length || 0,
          hasQuestions: !!data.questions,
          sampleQuestion: data.questions?.[0]?.text || 'No questions'
        };
      });

      // Test 2: AI Service Question Generation
      await runTest('AI Service Questions', async () => {
        const questions = await AIService.generateQuestions(chiefComplaint);
        return {
          questionsCount: questions.length,
          questionsHaveIds: questions.every(q => q.id && q.id.length > 0),
          validUUIDs: questions.every(q => {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            return uuidRegex.test(q.id);
          }),
          sampleQuestion: questions[0]?.text || 'No questions'
        };
      });

      // Test 3: Check Environment Variables
      await runTest('Environment Check', async () => {
        const { data, error } = await supabase.functions.invoke('ai-assistant', {
          body: {
            action: 'health-check'
          }
        });
        
        if (error) throw new Error(`Health check failed: ${error.message}`);
        
        return data || { status: 'No health data returned' };
      });

    } catch (error) {
      console.error('Test suite error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearTests = () => {
    setTestResults([]);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          AI Service Testing & Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Configuration */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="complaint">Test Chief Complaint</Label>
            <Input
              id="complaint"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="Enter chief complaint to test"
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={runAllTests} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Running Tests...
                </>
              ) : (
                'Run AI Service Tests'
              )}
            </Button>
            <Button variant="outline" onClick={clearTests}>
              Clear Results
            </Button>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Results</h3>
            {testResults.map((result, index) => (
              <Alert key={index} className={
                result.status === 'success' ? 'border-green-200 bg-green-50' :
                result.status === 'error' ? 'border-red-200 bg-red-50' :
                'border-yellow-200 bg-yellow-50'
              }>
                <div className="flex items-start gap-2">
                  {result.status === 'success' && <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />}
                  {result.status === 'error' && <XCircle className="h-4 w-4 text-red-600 mt-0.5" />}
                  {result.status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />}
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{result.name}</h4>
                      <span className="text-sm text-gray-500">{result.duration}ms</span>
                    </div>
                    
                    <AlertDescription className="mt-1">
                      {result.status === 'success' && (
                        <div className="space-y-1">
                          <div>✅ Test passed successfully</div>
                          <Textarea
                            value={JSON.stringify(result.result, null, 2)}
                            readOnly
                            rows={4}
                            className="mt-2 text-xs font-mono"
                          />
                        </div>
                      )}
                      
                      {result.status === 'error' && (
                        <div className="space-y-1">
                          <div>❌ Test failed</div>
                          <div className="text-red-600">{result.error}</div>
                        </div>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Test Status:</strong>
              <ul className="mt-1 space-y-1">
                <li>✅ Success: Service working properly</li>
                <li>❌ Error: Service needs attention</li>
                <li>⚠️ Warning: Service working with issues</li>
              </ul>
            </div>
            <div>
              <strong>Common Issues:</strong>
              <ul className="mt-1 space-y-1">
                <li>• OPENROUTER_API_KEY not configured</li>
                <li>• Edge function deployment issues</li>
                <li>• Network connectivity problems</li>
                <li>• Invalid question UUID generation</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}