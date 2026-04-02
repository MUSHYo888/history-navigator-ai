
// ABOUTME: Main clinical dashboard with stats, patient list, and system health
// ABOUTME: Includes realtime subscriptions for live patient and assessment updates
import React, { useState, useEffect } from 'react';
import { Plus, Users, Clock, FileText, Activity, Settings, Wrench, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePatients } from '@/hooks/usePatients';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { SystemHealth } from './SystemHealth';
import { AdvancedAnalyticsDashboard } from './AdvancedAnalyticsDashboard';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface DashboardProps {
  onNewPatient: () => void;
  onViewPatients: () => void;
  onTestAI?: () => void;
  onViewAnalytics?: () => void;
}

export function Dashboard({ onNewPatient, onViewPatients, onTestAI, onViewAnalytics }: DashboardProps) {
  const [showSystemHealth, setShowSystemHealth] = useState(false);
  const { data: patients, isLoading: patientsLoading } = usePatients();
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  
  const stats = [
    { 
      title: 'Total Patients', 
      value: dashboardStats?.totalPatients ?? 0, 
      icon: Users, 
      color: 'text-blue-600',
      loading: statsLoading
    },
    { 
      title: 'Active Assessments', 
      value: dashboardStats?.activeAssessments ?? 0, 
      icon: Activity, 
      color: 'text-green-600',
      loading: statsLoading
    },
    { 
      title: 'Completed Today', 
      value: dashboardStats?.completedToday ?? 0, 
      icon: FileText, 
      color: 'text-purple-600',
      loading: statsLoading
    },
    { 
      title: 'Avg. Time per Assessment', 
      value: dashboardStats?.avgTimePerAssessment ?? '0 min', 
      icon: Clock, 
      color: 'text-orange-600',
      loading: statsLoading
    }
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Clinical Dashboard</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage patient assessments and clinical workflows</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {onViewAnalytics && (
            <Button
              variant="outline"
              onClick={onViewAnalytics}
              className="bg-primary/5 border-primary/20 text-primary hover:bg-primary/10 h-11 sm:h-10 hover-lift"
              size="lg"
            >
              <BarChart3 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Advanced Analytics</span>
              <span className="sm:hidden">Analytics</span>
            </Button>
          )}
          {onTestAI && (
            <Button
              variant="outline"
              onClick={onTestAI}
              className="bg-warning/10 border-warning/20 text-warning hover:bg-warning/20 h-11 sm:h-10 hover-lift"
              size="lg"
            >
              <Wrench className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">AI Diagnostics</span>
              <span className="sm:hidden">Diagnostics</span>
            </Button>
          )}
          <Button onClick={onNewPatient} className="bg-primary hover:bg-primary/90 h-11 sm:h-10 hover-lift" size="lg">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">New Patient Assessment</span>
            <span className="sm:hidden">New Patient</span>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover-lift" style={{ animationDelay: `${index * 100}ms` }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 sm:h-4 sm:w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {stat.loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Patients */}
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <span className="text-lg sm:text-xl">Recent Patients</span>
            <Button variant="outline" onClick={onViewPatients} className="w-full sm:w-auto h-10 hover-lift">
              View All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patientsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg space-y-2 sm:space-y-0">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : !patients || patients.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-muted-foreground">
              <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-muted" />
              <p className="text-sm sm:text-base px-4">No patients yet. Start by creating your first patient assessment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {patients.slice(0, 5).map((patient) => (
                <div key={patient.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg hover:border-primary/50 transition-smooth space-y-2 sm:space-y-0 hover-lift">
                  <div>
                    <p className="font-medium text-sm sm:text-base">{patient.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{patient.age} years • {patient.gender}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs sm:text-sm text-muted-foreground">ID: {patient.patientId}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(patient.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>System Status</span>
            <div className="flex gap-2">
              {onTestAI && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onTestAI}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  Run AI Diagnostics
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSystemHealth(!showSystemHealth)}
              >
                <Settings className="h-4 w-4 mr-2" />
                {showSystemHealth ? 'Hide' : 'Show'} Details
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showSystemHealth ? (
            <SystemHealth />
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-3">
                Click "Show Details" to check system health and troubleshoot issues.
              </p>
              <p className="text-sm text-orange-600">
                If you're experiencing AI service errors, use the "Run AI Diagnostics" button for detailed testing.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
