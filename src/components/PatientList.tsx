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
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'completed' | 'none'>('all');

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patientId.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return patient.lastAssessment !== null;
    if (statusFilter === 'none') return patient.lastAssessment === null;
    return true;
  });

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
    <div className="p-4 sm:p-6 animate-fade-in">
      <Card className="max-w-6xl mx-auto shadow-lg">
        <CardHeader className="space-y-4">
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle className="text-xl sm:text-2xl flex items-center space-x-2">
              <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <span>Patient Management</span>
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button variant="outline" onClick={onBack} className="h-11 sm:h-10 hover-lift">
                Back to Dashboard
              </Button>
              <Button onClick={onNewPatient} className="bg-primary hover:bg-primary/90 h-11 sm:h-10 hover-lift">
                <UserPlus className="h-4 w-4 mr-2" />
                New Patient
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search patients by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 sm:h-10"
              />
            </div>
            <Badge variant="outline" className="text-xs sm:text-sm px-3 py-2 w-fit">
              {filteredPatients.length} patients
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {filteredPatients.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-muted mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium mb-2">
                {searchTerm ? 'No matching patients' : 'No patients yet'}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-6 px-4">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Get started by adding your first patient'
                }
              </p>
              {!searchTerm && (
                <Button onClick={onNewPatient} className="bg-primary hover:bg-primary/90 h-11 sm:h-10 hover-lift" size="lg">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Patient
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4">
              {filteredPatients.map((patient) => (
                <Card 
                  key={patient.id} 
                  className="border hover:border-primary/50 transition-smooth cursor-pointer hover-lift"
                  onClick={() => onSelectPatient(patient)}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm sm:text-base">
                            {getPatientInitials(patient.name)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base sm:text-lg font-medium truncate">
                            {patient.name}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs sm:text-sm text-muted-foreground space-y-1 sm:space-y-0">
                            <span className="truncate">ID: {patient.patientId}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>{patient.age} years, {patient.gender}</span>
                            {patient.location && (
                              <>
                                <span className="hidden sm:inline">•</span>
                                <span className="truncate">{patient.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4">
                        <div className="text-left sm:text-right flex-1 sm:flex-none">
                          <div className="flex items-center space-x-2 mb-1">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              {patient.lastAssessment 
                                ? format(new Date(patient.lastAssessment), 'MMM dd, yyyy')
                                : 'Never'
                              }
                            </span>
                          </div>
                          <div className="flex items-center sm:justify-end space-x-2">
                            <div 
                              className={`w-2 h-2 rounded-full ${getAssessmentStatusColor(patient.lastAssessment)}`}
                            />
                            <span className="text-xs text-muted-foreground">
                              {patient.lastAssessment ? 'Active' : 'New'}
                            </span>
                          </div>
                        </div>

                        <Button 
                          variant="outline" 
                          size="sm"
                          className="hover-lift flex-shrink-0 h-9"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPatient(patient);
                          }}
                        >
                          <span className="hidden sm:inline">View Details</span>
                          <span className="sm:hidden">View</span>
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