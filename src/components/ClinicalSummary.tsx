// ABOUTME: Clinical summary component displaying AI-generated differential diagnoses
// ABOUTME: Shows assessment results, differential diagnoses with probabilities and clinical reasoning
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, AlertTriangle, CheckCircle } from 'lucide-react';
import { AIService } from '@/services/aiService';
import { DifferentialDiagnosis } from '@/types/medical';
import { useMedical } from '@/context/MedicalContext';
import { useCompleteAssessment } from '@/hooks/useAssessment';
import { toast } from 'sonner';

interface ClinicalSummaryProps {
  chiefComplaint: string;
  onComplete: () => void;
  onBack: () => void;
}

export function ClinicalSummary({ chiefComplaint, onComplete, onBack }: ClinicalSummaryProps) {
  const { state } = useMedical();
  const [differentials, setDifferentials] = useState<DifferentialDiagnosis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInvestigations, setShowInvestigations] = useState(false);
  
  const completeAssessmentMutation = useCompleteAssessment();

  useEffect(() => {
    generateDifferentials();
  }, []);

  const generateDifferentials = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Generating differential diagnosis with data:', {
        chiefComplaint,
        answers: state.answers,
        rosData: state.rosData
      });

      const differentialDiagnoses = await AIService.generateDifferentialDiagnosis(
        chiefComplaint,
        state.answers,
        state.rosData
      );

      setDifferentials(differentialDiagnoses);
    } catch (err) {
      console.error('Error generating differentials:', err);
      setError('Failed to generate differential diagnosis. Using clinical reasoning based on available data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAssessment = async () => {
    if (state.currentAssessment) {
      try {
        await completeAssessmentMutation.mutateAsync(state.currentAssessment.id);
        onComplete();
      } catch (error) {
        console.error('Failed to complete assessment:', error);
        toast.error('Failed to complete assessment');
      }
    } else {
      onComplete();
    }
  };

  const handleProceedToInvestigations = () => {
    setShowInvestigations(true);
  };

  const handleInvestigationsSubmit = (selectedInvestigations: string[], notes: string) => {
    // Save investigation data to context
    console.log('Investigation orders:', selectedInvestigations, notes);
    // You could dispatch this to context if needed
    
    // Proceed to complete assessment
    handleCompleteAssessment();
  };

  const handleInvestigationsBack = () => {
    setShowInvestigations(false);
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 70) return 'bg-red-500';
    if (probability >= 50) return 'bg-orange-500';
    if (probability >= 30) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getProbabilityText = (probability: number) => {
    if (probability >= 70) return 'High';
    if (probability >= 50) return 'Moderate';
    if (probability >= 30) return 'Low-Moderate';
    return 'Low';
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600 mb-4" />
            <p className="text-lg">Generating Clinical Assessment...</p>
            <p className="text-sm text-gray-600">AI is analyzing symptoms and generating differential diagnoses</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showInvestigations) {
    const InvestigationOrdering = React.lazy(() => 
      import('./InvestigationOrdering').then(module => ({ default: module.InvestigationOrdering }))
    );
    
    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        <InvestigationOrdering
          chiefComplaint={chiefComplaint}
          differentialDiagnoses={differentials}
          answers={state.answers}
          rosData={state.rosData}
          onSubmit={handleInvestigationsSubmit}
          onBack={handleInvestigationsBack}
        />
      </React.Suspense>
    );
  }

  return (
    <div className="p-6">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center space-x-2">
            <Brain className="h-6 w-6 text-teal-600" />
            <span>Clinical Assessment Summary</span>
          </CardTitle>
          <p className="text-gray-600">
            Chief Complaint: <span className="font-medium">{chiefComplaint}</span>
          </p>
          {error && (
            <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Assessment Data Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">History Questions</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{Object.keys(state.answers).length}</p>
                <p className="text-sm text-gray-600">Questions answered</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Review of Systems</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {Object.keys(state.rosData).length}
                </p>
                <p className="text-sm text-gray-600">Systems reviewed</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-orange-600" />
                  <span className="font-medium">Past Medical History</span>
                </div>
                <p className="text-2xl font-bold text-orange-600">
                  {state.pmhData ? 'Complete' : 'Pending'}
                </p>
                <p className="text-sm text-gray-600">Medical history</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  <span className="font-medium">Differential Diagnoses</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">{differentials.length}</p>
                <p className="text-sm text-gray-600">Conditions considered</p>
              </CardContent>
            </Card>
          </div>

          {/* Past Medical History Summary */}
          {state.pmhData && (
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="text-lg">Past Medical History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">Medical Conditions</h5>
                    <ul className="text-sm space-y-1">
                      {state.pmhData.conditions.map((condition, idx) => (
                        <li key={idx}>• {condition}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Current Medications</h5>
                    <ul className="text-sm space-y-1">
                      {state.pmhData.medications.map((medication, idx) => (
                        <li key={idx}>• {medication}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Physical Examination Summary */}
          {state.peData && (
            <Card className="border-l-4 border-l-teal-500">
              <CardHeader>
                <CardTitle className="text-lg">Physical Examination</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium mb-2">Vital Signs</h5>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>BP: {state.peData.vitalSigns.bloodPressure}</div>
                      <div>HR: {state.peData.vitalSigns.heartRate}</div>
                      <div>RR: {state.peData.vitalSigns.respiratoryRate}</div>
                      <div>Temp: {state.peData.vitalSigns.temperature}</div>
                      <div>O2: {state.peData.vitalSigns.oxygenSaturation}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-2">System Examination</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(state.peData.systems).map(([system, findings]) => (
                        <div key={system} className="text-sm">
                          <span className="font-medium">{system}:</span>
                          {findings.normal ? (
                            <span className="text-green-600 ml-2">Normal</span>
                          ) : (
                            <div className="ml-2">
                              {findings.findings.map((finding, idx) => (
                                <div key={idx}>• {finding}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Differential Diagnoses */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Differential Diagnoses</h3>
            <div className="space-y-4">
              {differentials.map((diagnosis, index) => (
                <Card key={index} className="border-l-4 border-l-teal-500">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900">
                          {diagnosis.condition}
                        </h4>
                        <div className="flex items-center space-x-3 mt-2">
                          <Badge 
                            variant="secondary" 
                            className={`${getProbabilityColor(diagnosis.probability)} text-white`}
                          >
                            {diagnosis.probability}% - {getProbabilityText(diagnosis.probability)} Probability
                          </Badge>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Progress 
                          value={diagnosis.probability} 
                          className="w-24 h-2"
                        />
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4">{diagnosis.explanation}</p>

                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Key Clinical Features:</h5>
                      <div className="flex flex-wrap gap-2">
                        {diagnosis.keyFeatures.map((feature, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button variant="outline" onClick={onBack}>
              Back to Physical Exam
            </Button>
            
            <div className="space-x-3">
              <Button 
                variant="outline" 
                onClick={generateDifferentials}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Regenerate Assessment
              </Button>
              <Button 
                onClick={handleProceedToInvestigations}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Order Investigations
              </Button>
              <Button 
                onClick={handleCompleteAssessment}
                className="bg-teal-600 hover:bg-teal-700"
                disabled={completeAssessmentMutation.isPending}
              >
                {completeAssessmentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Complete Assessment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
