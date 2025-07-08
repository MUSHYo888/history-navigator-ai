
import React, { useState } from 'react';
import { Plus, Users, Clock, FileText, Activity, Settings, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMedical } from '@/context/MedicalContext';
import { SystemHealth } from './SystemHealth';

interface DashboardProps {
  onNewPatient: () => void;
  onViewPatients: () => void;
  onTestAI?: () => void;
}

export function Dashboard({ onNewPatient, onViewPatients, onTestAI }: DashboardProps) {
  const { state } = useMedical();
  const [showSystemHealth, setShowSystemHealth] = useState(false);
  
  const stats = [
    { title: 'Total Patients', value: state.patients.length, icon: Users, color: 'text-blue-600' },
    { title: 'Active Assessments', value: '3', icon: Activity, color: 'text-green-600' },
    { title: 'Completed Today', value: '8', icon: FileText, color: 'text-purple-600' },
    { title: 'Avg. Time per Assessment', value: '12 min', icon: Clock, color: 'text-orange-600' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Clinical Dashboard</h2>
          <p className="text-gray-600">Manage patient assessments and clinical workflows</p>
        </div>
        
        <div className="flex gap-2">
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
              <div className="text-2xl font-bold">{stat.value}</div>
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
          {state.patients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No patients yet. Start by creating your first patient assessment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {state.patients.slice(0, 5).map((patient) => (
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
