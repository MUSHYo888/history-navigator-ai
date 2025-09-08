
import React, { useState } from 'react';
import { Plus, Users, Clock, FileText, Activity, Settings, Wrench, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePatients } from '@/hooks/usePatients';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { SystemHealth } from './SystemHealth';
import { AdvancedAnalyticsDashboard } from './AdvancedAnalyticsDashboard';

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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Clinical Dashboard</h2>
          <p className="text-gray-600">Manage patient assessments and clinical workflows</p>
        </div>
        
        <div className="flex gap-2">
          {onViewAnalytics && (
            <Button
              variant="outline"
              onClick={onViewAnalytics}
              className="bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Advanced Analytics
            </Button>
          )}
          {onTestAI && (
            <Button
              variant="outline"
              onClick={onTestAI}
              className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
            >
              <Wrench className="h-4 w-4 mr-2" />
              AI Diagnostics
            </Button>
          )}
          <Button onClick={onNewPatient} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="h-4 w-4 mr-2" />
            New Patient Assessment
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {stat.loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Patients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Recent Patients
            <Button variant="outline" onClick={onViewPatients}>
              View All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patientsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
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
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No patients yet. Start by creating your first patient assessment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {patients.slice(0, 5).map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{patient.name}</p>
                    <p className="text-sm text-gray-600">{patient.age} years • {patient.gender}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">ID: {patient.patientId}</p>
                    <p className="text-xs text-gray-500">
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
