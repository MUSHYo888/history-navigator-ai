
// ABOUTME: Enhanced AI service testing component with detailed error diagnostics
// ABOUTME: Comprehensive testing suite for edge function connectivity and API validation

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { AIService } from '@/services/aiService';
import { CheckCircle, XCircle, AlertTriangle, Loader2, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  result?: any;
  error?: string;
  duration: number;
  timestamp: string;
  details?: any;
}

export function AIServiceTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [chiefComplaint, setChiefComplaint] = useState('Chest pain');
  const [detailedLogs, setDetailedLogs] = useState<string>('');

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
    console.log(`Test Result: ${result.name}`, result);
  };

  const runTest = async (testName: string, testFn: () => Promise<any>): Promise<any> => {
    const startTime = Date.now();
    try {
      console.log(`Starting test: ${testName}`);
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      addTestResult({
        name: testName,
        status: 'success',
        result,
        duration,
        timestamp: new Date().toISOString()
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Test failed: ${testName}`, error);
      
      addTestResult({
        name: testName,
        status: 'error',
        error: error.message,
        duration,
        timestamp: new Date().toISOString(),
        details: {
          stack: error.stack,
          cause: error.cause,
          name: error.name
        }
      });
      
      throw error;
    }
  };

  const runComprehensiveTests = async () => {
    setLoading(true);
    setTestResults([]);
    setDetailedLogs('=== Starting Comprehensive AI Service Tests ===\n');

    try {
      // Test 1: Basic Edge Function Health Check
      await runTest('Edge Function Health Check', async () => {
        console.log('Testing edge function health...');
        const { data, error } = await supabase.functions.invoke('ai-assistant', {
          body: { action: 'health-check' }
        });
        
        if (error) {
          console.error('Health check error:', error);
          throw new Error(`Health check failed: ${error.message}`);
        }
        
        console.log('Health check response:', data);
        setDetailedLogs(prev => prev + `Health Check Response: ${JSON.stringify(data, null, 2)}\n\n`);
        
        return {
          status: data?.status || 'unknown',
          version: data?.version || 'unknown',
          openRouterConfigured: data?.environment?.hasOpenRouterKey || false,
          environment: data?.environment || {}
        };
      });

      // Test 2: Test Endpoint
      await runTest('Test Endpoint', async () => {
        console.log('Testing test endpoint...');
        const { data, error } = await supabase.functions.invoke('ai-assistant', {
          body: { action: 'test' }
        });
        
        if (error) {
          console.error('Test endpoint error:', error);
          throw new Error(`Test endpoint failed: ${error.message}`);
        }
        
        console.log('Test endpoint response:', data);
        setDetailedLogs(prev => prev + `Test Endpoint Response: ${JSON.stringify(data, null, 2)}\n\n`);
        
        return data;
      });

      // Test 3: Direct Question Generation
      await runTest('Direct Question Generation', async () => {
        console.log('Testing direct question generation...');
        const { data, error } = await supabase.functions.invoke('ai-assistant', {
          body: {
            action: 'generate-questions',
            chiefComplaint: chiefComplaint
          }
        });
        
        if (error) {
          console.error('Question generation error:', error);
          setDetailedLogs(prev => prev + `Question Generation Error: ${JSON.stringify(error, null, 2)}\n\n`);
          throw new Error(`Question generation failed: ${error.message}`);
        }
        
        if (!data?.questions) {
          throw new Error('No questions returned from AI service');
        }
        
        console.log('Generated questions:', data.questions);
        setDetailedLogs(prev => prev + `Generated Questions: ${JSON.stringify(data.questions, null, 2)}\n\n`);
        
        // Validate question structure
        const validQuestions = data.questions.filter((q: any) => 
          q.id && q.text && q.type && q.category
        );
        
        const invalidQuestions = data.questions.filter((q: any) => 
          !q.id || !q.text || !q.type || !q.category
        );
        
        if (invalidQuestions.length > 0) {
          console.warn('Invalid questions found:', invalidQuestions);
          setDetailedLogs(prev => prev + `Invalid Questions: ${JSON.stringify(invalidQuestions, null, 2)}\n\n`);
        }
        
        return {
          totalQuestions: data.questions.length,
          validQuestions: validQuestions.length,
          invalidQuestions: invalidQuestions.length,
          questionsHaveUUIDs: data.questions.every((q: any) => {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            return uuidRegex.test(q.id);
          }),
          sampleQuestion: data.questions[0]?.text || 'No questions'
        };
      });

      // Test 4: AI Service Wrapper
      await runTest('AI Service Wrapper', async () => {
        console.log('Testing AI service wrapper...');
        const questions = await AIService.generateQuestions(chiefComplaint);
        
        if (!questions || questions.length === 0) {
          throw new Error('AI Service returned no questions');
        }
        
        console.log('AI Service questions:', questions);
        setDetailedLogs(prev => prev + `AI Service Questions: ${JSON.stringify(questions, null, 2)}\n\n`);
        
        return {
          questionCount: questions.length,
          allHaveIds: questions.every(q => q.id && q.id.length > 0),
          validUUIDs: questions.every(q => {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            return uuidRegex.test(q.id);
          }),
          questionTypes: [...new Set(questions.map(q => q.type))],
          categories: [...new Set(questions.map(q => q.category))]
        };
      });

      // Test 5: Performance Test
      await runTest('Performance Test', async () => {
        console.log('Running performance test...');
        const startTime = Date.now();
        
        const promises = Array.from({ length: 3 }, (_, i) => 
          supabase.functions.invoke('ai-assistant', {
            body: {
              action: 'generate-questions',
              chiefComplaint: `Test complaint ${i + 1}`
            }
          })
        );
        
        const results = await Promise.allSettled(promises);
        const duration = Date.now() - startTime;
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        return {
          totalRequests: 3,
          successful,
          failed,
          totalDuration: duration,
          averageDuration: duration / 3,
          successRate: (successful / 3) * 100
        };
      });

      setDetailedLogs(prev => prev + '=== All Tests Completed Successfully ===\n');
      toast.success('All AI service tests completed successfully!');

    } catch (error) {
      console.error('Test suite error:', error);
      setDetailedLogs(prev => prev + `=== Test Suite Error: ${error.message} ===\n`);
      toast.error('Some tests failed. Check results for details.');
    } finally {
      setLoading(false);
    }
  };

  const copyLogs = () => {
    navigator.clipboard.writeText(detailedLogs);
    toast.success('Logs copied to clipboard');
  };

  const clearResults = () => {
    setTestResults([]);
    setDetailedLogs('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const successfulTests = testResults.filter(r => r.status === 'success').length;
  const totalTests = testResults.length;
  const successRate = totalTests > 0 ? (successfulTests / totalTests) * 100 : 0;

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>AI Service Comprehensive Testing & Diagnostics</span>
          {totalTests > 0 && (
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{Math.round(successRate)}%</div>
              <div className="text-sm text-gray-600">{successfulTests}/{totalTests} tests passed</div>
            </div>
          )}
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
            <Button onClick={runComprehensiveTests} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Running Tests...
                </>
              ) : (
                'Run Comprehensive Tests'
              )}
            </Button>
            <Button variant="outline" onClick={clearResults}>
              Clear Results
            </Button>
            {detailedLogs && (
              <Button variant="outline" size="sm" onClick={copyLogs}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Logs
              </Button>
            )}
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testResults.map((result, index) => (
                <Alert key={index} className={
                  result.status === 'success' ? 'border-green-200 bg-green-50' :
                  result.status === 'error' ? 'border-red-200 bg-red-50' :
                  'border-yellow-200 bg-yellow-50'
                }>
                  <div className="flex items-start gap-2">
                    {getStatusIcon(result.status)}
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{result.name}</h4>
                        <span className="text-sm text-gray-500">{result.duration}ms</span>
                      </div>
                      
                      <AlertDescription className="mt-1">
                        {result.status === 'success' && (
                          <div className="space-y-2">
                            <div className="text-green-700">✅ Test passed</div>
                            {result.result && (
                              <div className="bg-white p-2 rounded border text-xs">
                                <pre className="whitespace-pre-wrap overflow-auto max-h-32">
                                  {JSON.stringify(result.result, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {result.status === 'error' && (
                          <div className="space-y-2">
                            <div className="text-red-700">❌ Test failed</div>
                            <div className="text-red-600 text-sm">{result.error}</div>
                            {result.details && (
                              <details className="text-xs">
                                <summary className="cursor-pointer text-red-500 hover:text-red-700">
                                  Show error details
                                </summary>
                                <pre className="mt-2 bg-white p-2 rounded border overflow-auto max-h-32">
                                  {JSON.stringify(result.details, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        )}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Logs */}
        {detailedLogs && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detailed Logs</h3>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
              <pre className="whitespace-pre-wrap overflow-auto max-h-96">{detailedLogs}</pre>
            </div>
          </div>
        )}

        {/* Quick Actions & Documentation */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">Troubleshooting Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Common Issues:</strong>
              <ul className="mt-1 space-y-1 text-gray-600">
                <li>• OPENROUTER_API_KEY not configured in Supabase secrets</li>
                <li>• OpenRouter API key invalid or out of credits</li>
                <li>• Edge function deployment issues</li>
                <li>• Network connectivity problems</li>
                <li>• Invalid request format or parameters</li>
              </ul>
            </div>
            <div>
              <strong>Next Steps:</strong>
              <ul className="mt-1 space-y-1 text-gray-600">
                <li>• Check Supabase Edge Function logs</li>
                <li>• Verify API key in project settings</li>
                <li>• Test OpenRouter API directly</li>
                <li>• Check network and CORS configuration</li>
                <li>• Review detailed logs above</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
