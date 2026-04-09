
// ABOUTME: System health monitoring component with comprehensive AI service diagnostics
// ABOUTME: Enhanced monitoring for OpenRouter API, edge functions, and clinical workflows

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, Brain, Zap, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AIService } from '@/services/aiService';

interface SystemStatus {
  database: 'healthy' | 'error' | 'checking';
  aiService: 'healthy' | 'error' | 'checking';
  edgeFunction: 'healthy' | 'error' | 'checking';
  openRouterAPI: 'healthy' | 'error' | 'checking';
}

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'error';
  message: string;
  details?: string;
  actionable?: string[];
  responseTime?: number;
}

interface SystemHealthProps {
  onAIServiceFixed?: () => void;
}

export function SystemHealth({ onAIServiceFixed }: SystemHealthProps) {
  const [status, setStatus] = useState<SystemStatus>({
    database: 'checking',
    aiService: 'checking',
    edgeFunction: 'checking',
    openRouterAPI: 'checking'
  });
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checking, setChecking] = useState(false);
  const [healthResults, setHealthResults] = useState<HealthCheckResult[]>([]);
  const [systemScore, setSystemScore] = useState<number>(0);

  const checkSystemHealth = async () => {
    setChecking(true);
    setHealthResults([]);
    const results: HealthCheckResult[] = [];

    // Check database connectivity
    try {
      const startTime = Date.now();
      const { error, count } = await supabase
        .from('patients')
        .select('count', { count: 'exact', head: true });
      
      if (error) throw error;
      
      const responseTime = Date.now() - startTime;
      setStatus(prev => ({ ...prev, database: 'healthy' }));
      results.push({
        service: 'Database',
        status: 'healthy',
        message: `Connected successfully. ${count || 0} patients in database.`,
        details: 'Supabase database connection is operational',
        responseTime
      });
    } catch (error) {
      console.error('Database check failed:', error);
      setStatus(prev => ({ ...prev, database: 'error' }));
      results.push({
        service: 'Database',
        status: 'error',
        message: `Connection failed: ${error.message}`,
        details: 'Unable to connect to Supabase database',
        actionable: [
          'Check internet connection',
          'Verify Supabase project status',
          'Check database configuration'
        ]
      });
    }

    // Check edge function
    try {
      const startTime = Date.now();
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { action: 'test' }
      });
      
      if (error) throw error;
      
      const responseTime = Date.now() - startTime;
      setStatus(prev => ({ ...prev, edgeFunction: 'healthy' }));
      results.push({
        service: 'Edge Function',
        status: 'healthy',
        message: 'AI Assistant function is operational',
        details: `Response: ${data?.message || 'Function responding normally'}`,
        responseTime
      });

      // If edge function works, test OpenRouter integration
      if (data?.openRouterConfigured) {
        setStatus(prev => ({ ...prev, openRouterAPI: 'healthy' }));
        results.push({
          service: 'OpenRouter API',
          status: 'healthy',
          message: 'OpenRouter API key is configured',
          details: 'API key is available in edge function environment'
        });
      } else {
        setStatus(prev => ({ ...prev, openRouterAPI: 'error' }));
        results.push({
          service: 'OpenRouter API',
          status: 'error',
          message: 'OpenRouter API key not configured',
          details: 'API key missing from edge function secrets',
          actionable: [
            'Check OPENROUTER_API_KEY in Supabase secrets',
            'Verify API key is valid and has credits',
            'Test API key directly with OpenRouter'
          ]
        });
      }
    } catch (error) {
      console.error('Edge function check failed:', error);
      setStatus(prev => ({ ...prev, edgeFunction: 'error' }));
      results.push({
        service: 'Edge Function',
        status: 'error',
        message: `Function error: ${error.message}`,
        details: 'AI Assistant edge function is not responding',
        actionable: [
          'Check edge function deployment',
          'Verify function configuration',
          'Check function logs in Supabase dashboard'
        ]
      });

      // Mark OpenRouter as unknown if edge function fails
      setStatus(prev => ({ ...prev, openRouterAPI: 'error' }));
      results.push({
        service: 'OpenRouter API',
        status: 'error',
        message: 'Cannot test - edge function not responding',
        details: 'OpenRouter API test requires working edge function'
      });
    }

    // Test AI service with actual question generation
    try {
      const startTime = Date.now();
      const testQuestions = await AIService.generateQuestions('test headache for system health check');
      const responseTime = Date.now() - startTime;
      
      if (testQuestions && testQuestions.length > 0) {
        // Validate question structure
        const validQuestions = testQuestions.filter(q => 
          q.id && q.text && q.type && q.category
        );
        
        if (validQuestions.length === testQuestions.length) {
          setStatus(prev => ({ ...prev, aiService: 'healthy' }));
          results.push({
            service: 'AI Service',
            status: 'healthy',
            message: `AI service operational. Generated ${testQuestions.length} valid questions.`,
            details: 'OpenRouter API and question generation working correctly',
            responseTime
          });
          onAIServiceFixed?.();
        } else {
          throw new Error(`Generated ${testQuestions.length} questions but only ${validQuestions.length} are valid`);
        }
      } else {
        throw new Error('No questions generated from AI service');
      }
    } catch (error) {
      console.error('AI service check failed:', error);
      setStatus(prev => ({ ...prev, aiService: 'error' }));
      results.push({
        service: 'AI Service',
        status: 'error',
        message: `AI service failed: ${error.message}`,
        details: 'OpenRouter API or AI processing not working properly',
        actionable: [
          'Check OpenRouter API key validity',
          'Verify OpenRouter account has sufficient credits',
          'Test edge function logs for detailed errors',
          'Check network connectivity to OpenRouter',
          'Verify model availability (claude-3.5-sonnet)'
        ]
      });
    }

    // Calculate system health score
    const healthyServices = results.filter(r => r.status === 'healthy').length;
    const score = (healthyServices / results.length) * 100;
    setSystemScore(score);

    setHealthResults(results);
    setLastChecked(new Date());
    setChecking(false);
  };

  useEffect(() => {
    checkSystemHealth();
  }, []);

  const getStatusIcon = (serviceStatus: string) => {
    switch (serviceStatus) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (serviceStatus: string) => {
    switch (serviceStatus) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'checking':
        return <Badge variant="secondary">Checking...</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName.toLowerCase()) {
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'ai service':
        return <Brain className="h-4 w-4" />;
      case 'edge function':
        return <Zap className="h-4 w-4" />;
      case 'openrouter api':
        return <Activity className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const hasErrors = Object.values(status).some(s => s === 'error');
  const overallStatus = systemScore === 100 ? 'excellent' : 
                       systemScore >= 75 ? 'good' : 
                       systemScore >= 50 ? 'degraded' : 'critical';

  return (
    <div className="space-y-4">
      {/* Overall System Status */}
      <div className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">System Health Score</h3>
          <p className="text-sm text-gray-600">Overall system operational status</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-indigo-600">{Math.round(systemScore)}%</div>
          <div className={`text-sm font-medium ${
            overallStatus === 'excellent' ? 'text-green-600' :
            overallStatus === 'good' ? 'text-blue-600' :
            overallStatus === 'degraded' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {overallStatus.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Service Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {healthResults.map((result, index) => (
          <Card key={index} className={`${result.status === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  {getServiceIcon(result.service)}
                  <span>{result.service}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {result.responseTime && (
                    <span className="text-xs text-gray-500">{result.responseTime}ms</span>
                  )}
                  {getStatusBadge(result.status)}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-700 mb-2">{result.message}</p>
              {result.details && (
                <p className="text-xs text-gray-500 mb-2">{result.details}</p>
              )}
              {result.actionable && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-700">Actions needed:</p>
                  {result.actionable.map((action, i) => (
                    <p key={i} className="text-xs text-gray-600">• {action}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Alerts */}
      {!hasErrors && !checking && systemScore === 100 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            All systems operational. Clinical assessment features should work normally.
          </AlertDescription>
        </Alert>
      )}

      {hasErrors && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">System Issues Detected</p>
              <p className="text-sm">Some clinical features may not work properly. See individual service status above for specific actions.</p>
              {systemScore < 50 && (
                <p className="text-sm font-medium">Critical system issues detected. Medical assessments may fail.</p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={checkSystemHealth}
          disabled={checking}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Checking...' : 'Refresh Status'}
        </Button>
        
        {lastChecked && (
          <p className="text-sm text-gray-500">
            Last checked: {lastChecked.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Performance Metrics */}
      {healthResults.some(r => r.responseTime) && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Response Times</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {healthResults
              .filter(r => r.responseTime)
              .map((result, index) => (
                <div key={index} className="flex justify-between">
                  <span>{result.service}:</span>
                  <span className={`font-mono ${result.responseTime! > 5000 ? 'text-red-600' : result.responseTime! > 2000 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {result.responseTime}ms
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
