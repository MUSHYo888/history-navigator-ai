
// ABOUTME: Investigation ordering component with AI-powered recommendations
// ABOUTME: Provides structured investigation selection with clinical rationale and decision support
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Beaker, 
  Scan, 
  Heart, 
  Wind, 
  AlertTriangle, 
  Clock, 
  DollarSign,
  Brain,
  CheckCircle2,
  Info
} from 'lucide-react';
import { InvestigationRecommendation, RedFlag, ClinicalGuideline } from '@/types/medical';
import { AIService } from '@/services/aiService';

interface InvestigationOrderingProps {
  chiefComplaint: string;
  differentialDiagnoses: any[];
  answers: Record<string, any>;
  rosData: Record<string, any>;
  onSubmit: (selectedInvestigations: string[], notes: string) => void;
  onBack: () => void;
}

export function InvestigationOrdering({
  chiefComplaint,
  differentialDiagnoses,
  answers,
  rosData,
  onSubmit,
  onBack
}: InvestigationOrderingProps) {
  const [recommendations, setRecommendations] = useState<InvestigationRecommendation[]>([]);
  const [redFlags, setRedFlags] = useState<RedFlag[]>([]);
  const [guidelines, setGuidelines] = useState<ClinicalGuideline[]>([]);
  const [selectedInvestigations, setSelectedInvestigations] = useState<string[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateRecommendations();
  }, []);

  const generateRecommendations = async () => {
    try {
      setLoading(true);
      
      // Generate AI-powered investigation recommendations
      const clinicalSupport = await AIService.generateClinicalDecisionSupport(
        chiefComplaint,
        differentialDiagnoses,
        answers,
        rosData
      );
      
      setRecommendations(clinicalSupport.investigations);
      setRedFlags(clinicalSupport.redFlags);
      setGuidelines(clinicalSupport.guidelines);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      // Use fallback recommendations
      setRecommendations(getFallbackRecommendations());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackRecommendations = (): InvestigationRecommendation[] => {
    const fallbackByComplaint: Record<string, InvestigationRecommendation[]> = {
      'chest pain': [
        {
          investigation: {
            id: 'ecg',
            name: 'ECG',
            type: 'cardiac',
            category: 'Cardiac',
            indication: 'Rule out acute coronary syndrome',
            urgency: 'stat',
            cost: 'low',
            rationale: 'Essential for detecting acute ST changes or arrhythmias'
          },
          priority: 1,
          clinicalRationale: 'First-line investigation for chest pain to rule out MI'
        },
        {
          investigation: {
            id: 'troponin',
            name: 'Troponin T/I',
            type: 'laboratory',
            category: 'Cardiac Markers',
            indication: 'Detect myocardial injury',
            urgency: 'stat',
            cost: 'moderate',
            rationale: 'Gold standard for myocardial injury detection'
          },
          priority: 2,
          clinicalRationale: 'Elevated troponin indicates myocardial injury'
        }
      ],
      'fatigue': [
        {
          investigation: {
            id: 'fbc',
            name: 'Full Blood Count',
            type: 'laboratory',
            category: 'Hematology',
            indication: 'Screen for anemia, infection',
            urgency: 'routine',
            cost: 'low',
            rationale: 'Common cause of fatigue is anemia'
          },
          priority: 1,
          clinicalRationale: 'Anemia is a common reversible cause of fatigue'
        },
        {
          investigation: {
            id: 'tft',
            name: 'Thyroid Function Tests',
            type: 'laboratory',
            category: 'Endocrine',
            indication: 'Rule out thyroid dysfunction',
            urgency: 'routine',
            cost: 'moderate',
            rationale: 'Thyroid disorders commonly present with fatigue'
          },
          priority: 2,
          clinicalRationale: 'Both hypo- and hyperthyroidism can cause fatigue'
        }
      ]
    };

    const complaint = chiefComplaint.toLowerCase();
    return fallbackByComplaint[complaint] || fallbackByComplaint['fatigue'];
  };

  const getInvestigationIcon = (type: string) => {
    switch (type) {
      case 'laboratory': return <Beaker className="h-4 w-4" />;
      case 'imaging': return <Scan className="h-4 w-4" />;
      case 'cardiac': return <Heart className="h-4 w-4" />;
      case 'pulmonary': return <Wind className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'stat': return 'bg-red-500';
      case 'urgent': return 'bg-orange-500';
      case 'routine': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'low': return 'text-green-600';
      case 'moderate': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const handleInvestigationToggle = (investigationId: string) => {
    setSelectedInvestigations(prev => 
      prev.includes(investigationId)
        ? prev.filter(id => id !== investigationId)
        : [...prev, investigationId]
    );
  };

  const handleSubmit = () => {
    onSubmit(selectedInvestigations, clinicalNotes);
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="flex items-center justify-center py-12">
            <Brain className="h-8 w-8 animate-pulse text-teal-600 mr-4" />
            <div>
              <p className="text-lg">Generating Investigation Recommendations...</p>
              <p className="text-sm text-gray-600">AI is analyzing clinical data to suggest appropriate tests</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center space-x-2">
            <Beaker className="h-6 w-6 text-teal-600" />
            <span>Investigation Ordering & Clinical Decision Support</span>
          </CardTitle>
          <p className="text-gray-600">
            Chief Complaint: <span className="font-medium">{chiefComplaint}</span>
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Red Flags Alert */}
          {redFlags.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <div className="font-medium text-red-800 mb-2">Clinical Red Flags Detected:</div>
                {redFlags.map((flag, index) => (
                  <div key={index} className="mb-2">
                    <span className="font-medium">{flag.condition}</span>
                    <Badge className="ml-2 bg-red-100 text-red-800">
                      {flag.severity.toUpperCase()}
                    </Badge>
                    <p className="text-sm mt-1">{flag.description}</p>
                    {flag.immediateActions.length > 0 && (
                      <ul className="text-sm mt-1 ml-4">
                        {flag.immediateActions.map((action, idx) => (
                          <li key={idx}>• {action}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </AlertDescription>
            </Alert>
          )}

          {/* Investigation Recommendations */}
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Brain className="h-5 w-5 text-teal-600 mr-2" />
              AI-Recommended Investigations
            </h3>
            
            <div className="grid gap-4">
              {recommendations.map((rec, index) => (
                <Card key={rec.investigation.id} className="border-l-4 border-l-teal-500">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <Checkbox
                        checked={selectedInvestigations.includes(rec.investigation.id)}
                        onCheckedChange={() => handleInvestigationToggle(rec.investigation.id)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getInvestigationIcon(rec.investigation.type)}
                          <h4 className="font-medium text-lg">{rec.investigation.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            Priority {rec.priority}
                          </Badge>
                          <Badge className={`${getUrgencyColor(rec.investigation.urgency)} text-white text-xs`}>
                            {rec.investigation.urgency.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div>
                            <span className="text-sm font-medium">Category:</span>
                            <p className="text-sm">{rec.investigation.category}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Indication:</span>
                            <p className="text-sm">{rec.investigation.indication}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <DollarSign className={`h-4 w-4 ${getCostColor(rec.investigation.cost)}`} />
                            <span className={`text-sm font-medium ${getCostColor(rec.investigation.cost)}`}>
                              {rec.investigation.cost} cost
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium text-teal-700">Clinical Rationale:</span>
                            <p className="text-sm">{rec.clinicalRationale}</p>
                          </div>
                          {rec.investigation.rationale && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">Scientific Rationale:</span>
                              <p className="text-sm text-gray-600">{rec.investigation.rationale}</p>
                            </div>
                          )}
                        </div>

                        {rec.contraindications && rec.contraindications.length > 0 && (
                          <div className="mt-2 p-2 bg-yellow-50 rounded">
                            <span className="text-sm font-medium text-yellow-800">Contraindications:</span>
                            <ul className="text-sm text-yellow-700 mt-1">
                              {rec.contraindications.map((contra, idx) => (
                                <li key={idx}>• {contra}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Clinical Guidelines */}
          {guidelines.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Info className="h-5 w-5 text-blue-600 mr-2" />
                Clinical Guidelines
              </h3>
              
              <div className="space-y-3">
                {guidelines.map((guideline, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{guideline.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          Level {guideline.evidenceLevel}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Source: {guideline.source}</p>
                      <p className="text-sm">{guideline.recommendation}</p>
                      {guideline.applicableConditions.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs font-medium">Applicable to: </span>
                          {guideline.applicableConditions.map((condition, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs mr-1">
                              {condition}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Clinical Notes */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Additional Clinical Notes</h3>
            <Textarea
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Add any additional clinical reasoning, special considerations, or notes about the investigation plan..."
              className="min-h-[100px]"
            />
          </div>

          {/* Summary */}
          <Card className="bg-teal-50 border-teal-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-teal-600" />
                <span className="font-medium">Investigation Summary</span>
              </div>
              <p className="text-sm text-teal-700">
                {selectedInvestigations.length} investigation(s) selected for {chiefComplaint}
              </p>
              {selectedInvestigations.length > 0 && (
                <div className="mt-2">
                  <span className="text-sm font-medium">Selected:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedInvestigations.map(id => {
                      const rec = recommendations.find(r => r.investigation.id === id);
                      return rec ? (
                        <Badge key={id} variant="secondary" className="text-xs">
                          {rec.investigation.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button variant="outline" onClick={onBack}>
              Back to Clinical Summary
            </Button>
            
            <Button 
              onClick={handleSubmit}
              className="bg-teal-600 hover:bg-teal-700"
              disabled={selectedInvestigations.length === 0}
            >
              Submit Investigation Orders
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
