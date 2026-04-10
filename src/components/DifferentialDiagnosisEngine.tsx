// ABOUTME: Advanced AI-powered differential diagnosis engine component
// ABOUTME: Provides intelligent diagnostic reasoning with confidence scores and clinical recommendations

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  FileText,
  Target,
  Clock,
  RefreshCw,
  Lightbulb,
  Shield,
  Activity,
  Stethoscope
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMedical } from '@/context/MedicalContext';
import { toast } from 'sonner';

interface DifferentialDiagnosis {
  condition: string;
  probability: number;
  explanation: string;
  keyFeatures: string[];
  conflictingFeatures?: string[];
  urgency: 'high' | 'moderate' | 'low';
  category: string;
  redFlags: string[];
}

interface ClinicalRecommendations {
  immediateActions: string[];
  investigationPriority: Array<{
    condition: string;
    recommendedTests: string[];
  }>;
  redFlagAlert: boolean;
  followUpRecommendations: string[];
}

interface RiskStratification {
  overallRisk: 'high' | 'moderate' | 'low';
  riskFactors: {
    highUrgencyConditions: number;
    redFlagConditions: number;
    diagnosticConfidence: number;
  };
  recommendations: string[];
}

interface DifferentialDiagnosisEngineProps {
  chiefComplaint: string;
  assessmentId?: string;
  onDiagnosisGenerated?: (diagnoses: DifferentialDiagnosis[]) => void;
}

export function DifferentialDiagnosisEngine({
  chiefComplaint,
  assessmentId,
  onDiagnosisGenerated
}: DifferentialDiagnosisEngineProps) {
  const { state } = useMedical();
  const [diagnoses, setDiagnoses] = useState<DifferentialDiagnosis[]>([]);
  const [recommendations, setRecommendations] = useState<ClinicalRecommendations | null>(null);
  const [riskStratification, setRiskStratification] = useState<RiskStratification | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('diagnoses');
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    if (chiefComplaint && state.answers && Object.keys(state.answers).length > 0 && !hasAttempted) {
      generateDifferentialDiagnosis();
    }
  }, [chiefComplaint, hasAttempted]);

  const generateDifferentialDiagnosis = async () => {
    try {
      setLoading(true);
      setError(null);
      setHasAttempted(true);
      

      // Create timeout promise (30 seconds)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI service timeout - taking longer than expected')), 30000)
      );

      // Create API call promise
      const apiPromise = supabase.functions.invoke('differential-diagnosis', {
        body: {
          chiefComplaint,
          answers: state.answers,
          rosData: state.rosData,
          pmhData: state.pmhData,
          peData: state.peData,
          assessmentId
        }
      });

      // Race between timeout and API call
      const { data, error: functionError } = await Promise.race([apiPromise, timeoutPromise]) as any;

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setDiagnoses(data.differentialDiagnoses || []);
      setRecommendations(data.clinicalRecommendations);
      setRiskStratification(data.riskStratification);

      if (onDiagnosisGenerated) {
        onDiagnosisGenerated(data.differentialDiagnoses || []);
      }

      if (data._fallback) {
        toast.warning(data._message || 'Using evidence-based clinical protocols.');
      } else {
        toast.success(`Generated ${data.differentialDiagnoses?.length || 0} differential diagnoses`);
      }

    } catch (err) {
      console.error('Error generating differential diagnosis:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate differential diagnosis';
      setError(errorMessage);
      
      if (errorMessage.includes('timeout')) {
        toast.error('AI service is taking longer than expected. You can retry or continue with clinical protocols.');
      } else {
        toast.error('AI service unavailable. Using evidence-based clinical protocols.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualRetry = () => {
    setHasAttempted(false);
    setError(null);
    generateDifferentialDiagnosis();
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 70) return 'bg-red-500';
    if (probability >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'moderate': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'cardiovascular': return <Activity className="h-4 w-4 text-red-500" />;
      case 'respiratory': return <Target className="h-4 w-4 text-blue-500" />;
      case 'neurological': return <Brain className="h-4 w-4 text-purple-500" />;
      case 'infectious': return <Shield className="h-4 w-4 text-orange-500" />;
      default: return <Stethoscope className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Card className="max-w-6xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Brain className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Generating Differential Diagnosis</h3>
            <p className="text-muted-foreground mb-4">AI is analyzing clinical data and generating diagnostic possibilities...</p>
            <p className="text-sm text-muted-foreground">This usually takes 10-20 seconds</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-6 w-6 text-primary" />
          <span>AI-Powered Differential Diagnosis Engine</span>
        </CardTitle>
        <p className="text-muted-foreground">
          Chief Complaint: <span className="font-medium">{chiefComplaint}</span>
        </p>

        {/* Risk Stratification Alert */}
        {riskStratification && (
          <Alert className={`border-l-4 ${
            riskStratification.overallRisk === 'high' 
              ? 'border-l-red-500 bg-red-50' 
              : riskStratification.overallRisk === 'moderate'
              ? 'border-l-yellow-500 bg-yellow-50'
              : 'border-l-green-500 bg-green-50'
          }`}>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">
                Overall Risk: {riskStratification.overallRisk.toUpperCase()}
              </div>
              <div className="text-sm mt-1">
                Diagnostic Confidence: {riskStratification.riskFactors.diagnosticConfidence}% | 
                High-Risk Conditions: {riskStratification.riskFactors.highUrgencyConditions} | 
                Red Flags: {riskStratification.riskFactors.redFlagConditions}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      <CardContent>
        {error && (
          <Alert className="mb-6 border-yellow-500 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              <div className="font-medium text-yellow-900 mb-2">AI Service Unavailable</div>
              <p className="text-sm text-yellow-800 mb-3">{error}</p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleManualRetry}
                  className="border-yellow-600 text-yellow-700 hover:bg-yellow-100"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Retry with AI
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => setError(null)}
                >
                  Continue with Clinical Protocols
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="diagnoses" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Differential Diagnoses</span>
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center space-x-2">
              <Lightbulb className="h-4 w-4" />
              <span>Clinical Recommendations</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Clinical Analysis</span>
            </TabsTrigger>
          </TabsList>

          {/* Differential Diagnoses Tab */}
          <TabsContent value="diagnoses" className="space-y-4">
            {diagnoses.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No differential diagnoses generated yet</p>
                <Button onClick={generateDifferentialDiagnosis} className="mt-4">
                  <Brain className="h-4 w-4 mr-2" />
                  Generate Diagnoses
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {diagnoses.map((diagnosis, index) => (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {getCategoryIcon(diagnosis.category)}
                          <div>
                            <h3 className="text-lg font-semibold">{diagnosis.condition}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="outline">{diagnosis.category}</Badge>
                              <div className="flex items-center space-x-1">
                                {getUrgencyIcon(diagnosis.urgency)}
                                <span className="text-sm">{diagnosis.urgency}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {diagnosis.probability}%
                          </div>
                          <Progress 
                            value={diagnosis.probability} 
                            className="w-24 mt-1"
                          />
                        </div>
                      </div>

                      <p className="text-muted-foreground mb-4">{diagnosis.explanation}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2 flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                            Supporting Features
                          </h4>
                          <ul className="text-sm space-y-1">
                            {(diagnosis.keyFeatures || []).map((feature, i) => (
                              <li key={i} className="flex items-start">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {diagnosis.conflictingFeatures && diagnosis.conflictingFeatures.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2 flex items-center">
                              <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
                              Conflicting Features
                            </h4>
                            <ul className="text-sm space-y-1">
                              {diagnosis.conflictingFeatures.map((feature, i) => (
                                <li key={i} className="flex items-start">
                                  <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {(diagnosis.redFlags || []).length > 0 && (
                        <Alert className="mt-4 border-red-200 bg-red-50">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <AlertDescription>
                            <div className="font-medium text-red-700 mb-1">Red Flags Identified:</div>
                            <ul className="text-sm text-red-600">
                              {(diagnosis.redFlags || []).map((flag, i) => (
                                <li key={i}>• {flag}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Clinical Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            {recommendations ? (
              <div className="space-y-6">
                {recommendations.immediateActions.length > 0 && (
                  <Card className="border-red-200">
                    <CardHeader>
                      <CardTitle className="flex items-center text-red-600">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        Immediate Actions Required
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {(recommendations.immediateActions || []).map((action, i) => (
                          <li key={i} className="flex items-start">
                            <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="h-5 w-5 mr-2" />
                      Investigation Priorities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(recommendations.investigationPriority || []).map((item, i) => (
                      <div key={i} className="mb-4 last:mb-0">
                        <h4 className="font-medium mb-2">{item.condition}</h4>
                        <div className="flex flex-wrap gap-2">
                          {(item.recommendedTests || []).map((test, j) => (
                            <Badge key={j} variant="secondary">{test}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Follow-up Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {(recommendations.followUpRecommendations || []).map((rec, i) => (
                        <li key={i} className="flex items-start">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8">
                <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Generate diagnoses first to see recommendations</p>
              </div>
            )}
          </TabsContent>

          {/* Clinical Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            {riskStratification ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      Risk Stratification Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {riskStratification.overallRisk.toUpperCase()}
                        </div>
                        <div className="text-sm text-muted-foreground">Overall Risk</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {riskStratification.riskFactors.diagnosticConfidence}%
                        </div>
                        <div className="text-sm text-muted-foreground">Confidence</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-500">
                          {riskStratification.riskFactors.highUrgencyConditions}
                        </div>
                        <div className="text-sm text-muted-foreground">High Urgency</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-500">
                          {riskStratification.riskFactors.redFlagConditions}
                        </div>
                        <div className="text-sm text-muted-foreground">Red Flags</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-3">Risk-Based Recommendations:</h4>
                      <ul className="space-y-2">
                        {(riskStratification.recommendations || []).map((rec, i) => (
                          <li key={i} className="flex items-start">
                            <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Diagnostic Confidence Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {diagnoses.map((diagnosis, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <span className="text-sm font-medium w-32 truncate">
                            {diagnosis.condition}
                          </span>
                          <div className="flex-1">
                            <Progress value={diagnosis.probability} className="h-2" />
                          </div>
                          <span className="text-sm font-medium w-12 text-right">
                            {diagnosis.probability}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Generate diagnoses first to see analysis</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={generateDifferentialDiagnosis} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate Analysis
          </Button>
          
          {diagnoses.length > 0 && (
            <div className="flex space-x-2">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button>
                <CheckCircle className="h-4 w-4 mr-2" />
                Proceed to Treatment Plan
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}