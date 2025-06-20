
// ABOUTME: Advanced clinical decision support display component
// ABOUTME: Shows severity scores, risk assessment, triage recommendations, and clinical alerts

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Activity, 
  Target, 
  Clock,
  Shield,
  TrendingUp,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { AdvancedClinicalSupport as AdvancedSupportType } from '@/types/clinical-scores';

interface AdvancedClinicalSupportProps {
  clinicalSupport: AdvancedSupportType;
}

export function AdvancedClinicalSupport({ clinicalSupport }: AdvancedClinicalSupportProps) {
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-red-500 text-white';
      case 'moderate': return 'bg-orange-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'resuscitation': return 'bg-red-700 text-white';
      case 'emergency': return 'bg-red-500 text-white';
      case 'urgent': return 'bg-orange-500 text-white';
      case 'routine': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default: return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Clinical Alerts */}
      {clinicalSupport.clinicalAlerts.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            Clinical Alerts
          </h3>
          <div className="space-y-2">
            {clinicalSupport.clinicalAlerts.map((alert, index) => (
              <Alert key={index} className={`border-l-4 ${
                alert.type === 'critical' ? 'border-l-red-600 bg-red-50' :
                alert.type === 'warning' ? 'border-l-orange-500 bg-orange-50' :
                'border-l-blue-500 bg-blue-50'
              }`}>
                <div className="flex items-start space-x-2">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <AlertDescription>
                      <div className="font-medium">{alert.title}</div>
                      <p className="text-sm mt-1">{alert.message}</p>
                      {alert.actions.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs font-medium">Immediate Actions:</span>
                          <ul className="text-xs mt-1 ml-4">
                            {alert.actions.map((action, idx) => (
                              <li key={idx}>• {action}</li>
                            ))}
                          </ul>
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

      {/* Triage Recommendation */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Target className="h-5 w-5 text-purple-600 mr-2" />
            Triage Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Badge className={`${getPriorityColor(clinicalSupport.triageRecommendation.priority)} text-sm`}>
                  {clinicalSupport.triageRecommendation.priority.toUpperCase()}
                </Badge>
                <div className="flex items-center mt-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  {clinicalSupport.triageRecommendation.timeframe}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">Location</div>
                <div className="text-sm text-gray-600 capitalize">
                  {clinicalSupport.triageRecommendation.location.replace('-', ' ')}
                </div>
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium mb-1">Clinical Reasoning</div>
              <p className="text-sm text-gray-700">{clinicalSupport.triageRecommendation.reasoning}</p>
            </div>

            {clinicalSupport.triageRecommendation.immediateActions.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Immediate Actions</div>
                <div className="grid grid-cols-1 gap-2">
                  {clinicalSupport.triageRecommendation.immediateActions.map((action, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Severity Scores */}
      {clinicalSupport.severityScores.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Activity className="h-5 w-5 text-teal-600 mr-2" />
            Clinical Severity Scores
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clinicalSupport.severityScores.map((score, index) => (
              <Card key={index} className="border-l-4 border-l-teal-500">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{score.name}</h4>
                      <Badge className={getRiskLevelColor(score.riskLevel)}>
                        {score.riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Score: {score.score} / {score.maxScore}</span>
                        <span>{Math.round((score.score / score.maxScore) * 100)}%</span>
                      </div>
                      <Progress value={(score.score / score.maxScore) * 100} className="h-2" />
                    </div>

                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-1">Interpretation</div>
                      <p className="text-xs text-gray-600">{score.interpretation}</p>
                    </div>

                    {score.recommendations.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-gray-700 mb-1">Recommendations</div>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {score.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start space-x-1">
                              <span>•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Risk Assessment */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Shield className="h-5 w-5 text-orange-600 mr-2" />
            Overall Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Badge className={getRiskLevelColor(clinicalSupport.riskAssessment.overallRisk)}>
                  {clinicalSupport.riskAssessment.overallRisk.toUpperCase()} RISK
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  Risk Score: {clinicalSupport.riskAssessment.riskScore} / {clinicalSupport.riskAssessment.maxRiskScore}
                </div>
                <Progress 
                  value={(clinicalSupport.riskAssessment.riskScore / clinicalSupport.riskAssessment.maxRiskScore) * 100} 
                  className="w-32 h-2 mt-1"
                />
              </div>
            </div>

            <div>
              <h5 className="font-medium mb-2">Risk Factors</h5>
              <div className="space-y-2">
                {clinicalSupport.riskAssessment.riskFactors.map((factor, index) => (
                  <div key={index} className="flex items-start space-x-2 text-sm">
                    {factor.present ? (
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{factor.factor}</div>
                      <div className="text-gray-600 text-xs">{factor.description}</div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Weight: {factor.weight}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 className="font-medium mb-2">Recommendations</h5>
              <ul className="text-sm text-gray-700 space-y-1">
                {clinicalSupport.riskAssessment.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <TrendingUp className="h-3 w-3 text-blue-500 mt-1" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
