// ABOUTME: Advanced analytics dashboard for clinical performance and patient outcomes
// ABOUTME: Provides comprehensive insights with real-time data visualization and clinical metrics

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Calendar,
  Download,
  Filter,
  Zap,
  Brain,
  Stethoscope,
  FileText,
  Award
} from 'lucide-react';
import { AdvancedAnalyticsService } from '@/services/AdvancedAnalyticsService';
import { toast } from 'sonner';

interface AnalyticsMetrics {
  totalPatients: number;
  activeAssessments: number;
  completedAssessments: number;
  avgAssessmentTime: number;
  diagnosticAccuracy: number;
  treatmentEffectiveness: number;
  patientSatisfaction: number;
  costEfficiency: number;
}

interface PatientOutcome {
  patientId: string;
  chiefComplaint: string;
  diagnosis: string;
  treatmentPlan: string;
  outcome: 'improved' | 'stable' | 'declined' | 'resolved';
  followUpDate: string;
  satisfactionScore: number;
}

interface ClinicalInsight {
  type: 'diagnostic' | 'treatment' | 'efficiency' | 'quality';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
  confidence: number;
}

export function AdvancedAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d');
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [patientOutcomes, setPatientOutcomes] = useState<PatientOutcome[]>([]);
  const [clinicalInsights, setClinicalInsights] = useState<ClinicalInsight[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Simulate analytics data loading
      const [metricsData, outcomesData, insightsData, performanceChartData] = await Promise.all([
        AdvancedAnalyticsService.getAnalyticsMetrics(timeRange),
        AdvancedAnalyticsService.getPatientOutcomes(timeRange),
        AdvancedAnalyticsService.getClinicalInsights(timeRange),
        AdvancedAnalyticsService.getPerformanceData(timeRange)
      ]);

      setMetrics(metricsData);
      setPatientOutcomes(outcomesData);
      setClinicalInsights(insightsData);
      setPerformanceData(performanceChartData);

    } catch (error) {
      console.error('Failed to load analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const exportAnalytics = async () => {
    try {
      await AdvancedAnalyticsService.exportAnalyticsReport(timeRange);
      toast.success('Analytics report exported successfully');
    } catch (error) {
      console.error('Failed to export analytics:', error);
      toast.error('Failed to export analytics report');
    }
  };

  const getMetricTrend = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return {
      percentage: Math.abs(change).toFixed(1),
      isIncrease: change > 0,
      isSignificant: Math.abs(change) > 5
    };
  };

  const outcomeColors = {
    improved: '#22c55e',
    stable: '#3b82f6',
    declined: '#ef4444',
    resolved: '#10b981'
  };

  const impactColors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#10b981'
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card className="max-w-6xl mx-auto">
          <CardContent className="flex items-center justify-center py-12">
            <BarChart3 className="h-8 w-8 animate-pulse text-primary mr-4" />
            <div>
              <p className="text-lg">Loading Analytics Dashboard...</p>
              <p className="text-sm text-muted-foreground">
                Analyzing clinical data and generating insights
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Advanced Analytics Dashboard</h1>
            <p className="text-muted-foreground">Clinical performance insights and patient outcomes</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button onClick={exportAnalytics} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="outcomes">Patient Outcomes</TabsTrigger>
          <TabsTrigger value="insights">Clinical Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                    <p className="text-3xl font-bold">{metrics?.totalPatients.toLocaleString()}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-success mr-1" />
                  <span className="text-sm text-success">+12.5% from last period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Assessment Time</p>
                    <p className="text-3xl font-bold">{metrics?.avgAssessmentTime}m</p>
                  </div>
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <div className="flex items-center mt-2">
                  <TrendingDown className="h-4 w-4 text-success mr-1" />
                  <span className="text-sm text-success">-8.2% faster</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Diagnostic Accuracy</p>
                    <p className="text-3xl font-bold">{metrics?.diagnosticAccuracy}%</p>
                  </div>
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-success mr-1" />
                  <span className="text-sm text-success">+3.1% improvement</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Patient Satisfaction</p>
                    <p className="text-3xl font-bold">{metrics?.patientSatisfaction}%</p>
                  </div>
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-success mr-1" />
                  <span className="text-sm text-success">+5.7% increase</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <span>Assessment Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Assessments</span>
                    <Badge variant="outline">{metrics?.activeAssessments}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completed Today</span>
                    <Badge variant="outline">{metrics?.completedAssessments}</Badge>
                  </div>
                  <Progress value={75} className="w-full" />
                  <p className="text-xs text-muted-foreground">75% completion rate</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <span>Efficiency Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Treatment Effectiveness</span>
                    <span className="text-sm font-bold text-success">{metrics?.treatmentEffectiveness}%</span>
                  </div>
                  <Progress value={metrics?.treatmentEffectiveness} className="w-full" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Cost Efficiency</span>
                    <span className="text-sm font-bold text-primary">{metrics?.costEfficiency}%</span>
                  </div>
                  <Progress value={metrics?.costEfficiency} className="w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Volume Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="assessments" 
                      stackId="1"
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary) / 0.3)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Diagnostic Accuracy by Specialty</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="specialty" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="accuracy" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="responseTime" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Efficiency Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="cost" fill="hsl(var(--secondary))" />
                    <Bar dataKey="savings" fill="hsl(var(--success))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Patient Outcomes Tab */}
        <TabsContent value="outcomes" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Outcome Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Improved', value: 45, color: outcomeColors.improved },
                        { name: 'Stable', value: 30, color: outcomeColors.stable },
                        { name: 'Resolved', value: 20, color: outcomeColors.resolved },
                        { name: 'Declined', value: 5, color: outcomeColors.declined }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {[
                        { name: 'Improved', value: 45, color: outcomeColors.improved },
                        { name: 'Stable', value: 30, color: outcomeColors.stable },
                        { name: 'Resolved', value: 20, color: outcomeColors.resolved },
                        { name: 'Declined', value: 5, color: outcomeColors.declined }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Patient Outcomes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {patientOutcomes.slice(0, 10).map((outcome, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm">{outcome.chiefComplaint}</span>
                          <Badge 
                            style={{ backgroundColor: outcomeColors[outcome.outcome] }}
                            className="text-white text-xs"
                          >
                            {outcome.outcome}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{outcome.diagnosis}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                i < outcome.satisfactionScore 
                                  ? 'bg-warning' 
                                  : 'bg-muted'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {outcome.followUpDate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Clinical Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <span>AI-Generated Clinical Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clinicalInsights.map((insight, index) => (
                    <Alert key={index} className={`border-l-4 ${
                      insight.impact === 'high' ? 'border-l-destructive' :
                      insight.impact === 'medium' ? 'border-l-warning' : 'border-l-success'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {insight.type === 'diagnostic' && <Stethoscope className="h-4 w-4 text-primary" />}
                            {insight.type === 'treatment' && <FileText className="h-4 w-4 text-primary" />}
                            {insight.type === 'efficiency' && <Zap className="h-4 w-4 text-primary" />}
                            {insight.type === 'quality' && <Award className="h-4 w-4 text-primary" />}
                            <span className="font-medium">{insight.title}</span>
                            <Badge 
                              className={
                                insight.impact === 'high' ? 'bg-destructive text-destructive-foreground' :
                                insight.impact === 'medium' ? 'bg-warning text-warning-foreground' :
                                'bg-success text-success-foreground'
                              }
                            >
                              {insight.impact} impact
                            </Badge>
                          </div>
                          <AlertDescription>
                            <p className="text-sm mb-2">{insight.description}</p>
                            <div className="bg-muted/50 p-3 rounded-md">
                              <p className="text-sm font-medium mb-1">Recommendation:</p>
                              <p className="text-sm">{insight.recommendation}</p>
                            </div>
                          </AlertDescription>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs">
                            {insight.confidence}% confidence
                          </Badge>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}