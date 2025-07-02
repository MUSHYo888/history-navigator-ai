// ABOUTME: Patient list component for viewing and managing all patients  
// ABOUTME: Displays patient history, recent assessments, and quick action buttons

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, UserPlus, Calendar, FileText, Activity } from 'lucide-react';
import { Patient } from '@/types/medical';
import { usePatients } from '@/hooks/usePatients';
import { format } from 'date-fns';

interface PatientListProps {
  onNewPatient: () => void;
  onSelectPatient: (patient: Patient) => void;
  onBack: () => void;
}

export function PatientList({ onNewPatient, onSelectPatient, onBack }: PatientListProps) {
  const { data: patients = [], isLoading } = usePatients();
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.patientId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPatientInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getAssessmentStatusColor = (lastAssessment: string | null) => {
    if (!lastAssessment) return 'bg-gray-500';
    const daysSince = Math.floor((Date.now() - new Date(lastAssessment).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince === 0) return 'bg-green-500';
    if (daysSince <= 7) return 'bg-blue-500';
    if (daysSince <= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Card className="max-w-6xl mx-auto">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Activity className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-lg">Loading patients...</p>
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl flex items-center space-x-2">
              <Activity className="h-6 w-6 text-primary" />
              <span>Patient Management</span>
            </CardTitle>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onBack}>
                Back to Dashboard
              </Button>
              <Button onClick={onNewPatient} className="bg-primary hover:bg-primary/90">
                <UserPlus className="h-4 w-4 mr-2" />
                New Patient
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 mt-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search patients by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="outline" className="text-sm">
              {filteredPatients.length} patients
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No matching patients' : 'No patients yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Get started by adding your first patient'
                }
              </p>
              {!searchTerm && (
                <Button onClick={onNewPatient} className="bg-primary hover:bg-primary/90">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Patient
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredPatients.map((patient) => (
                <Card 
                  key={patient.id} 
                  className="border hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => onSelectPatient(patient)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {getPatientInitials(patient.name)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {patient.name}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>ID: {patient.patientId}</span>
                            <span>{patient.age} years, {patient.gender}</span>
                            {patient.location && <span>{patient.location}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center space-x-2 mb-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              Last seen: {patient.lastAssessment 
                                ? format(new Date(patient.lastAssessment), 'MMM dd, yyyy')
                                : 'Never'
                              }
                            </span>
                          </div>
                          <div className="flex items-center justify-end space-x-2">
                            <div 
                              className={`w-2 h-2 rounded-full ${getAssessmentStatusColor(patient.lastAssessment)}`}
                            />
                            <span className="text-xs text-gray-500">
                              {patient.lastAssessment ? 'Active' : 'New'}
                            </span>
                          </div>
                        </div>

                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPatient(patient);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}