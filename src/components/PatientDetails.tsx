
// ABOUTME: Patient details view showing patient info and assessment history
// ABOUTME: Loads from database when clicking a patient name in dashboard or patient list

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Activity, ArrowLeft, Calendar, FileText, User, UserPlus, ClipboardList, Loader2 } from 'lucide-react';
import { Patient } from '@/types/medical';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

interface PatientDetailsProps {
  patient: Patient;
  onBack: () => void;
  onStartAssessment: () => void;
  onResumeAssessment: (assessmentId: string) => void;
  onViewCompletedAssessment?: (assessmentId: string, chiefComplaint: string) => void;
}

export function PatientDetails({ patient, onBack, onStartAssessment, onResumeAssessment, onViewCompletedAssessment }: PatientDetailsProps) {
  const { data: assessments, isLoading: assessmentsLoading } = useQuery({
    queryKey: ['patient-assessments', patient.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: diagnoses } = useQuery({
    queryKey: ['patient-diagnoses', patient.id],
    queryFn: async () => {
      if (!assessments || assessments.length === 0) return [];
      const assessmentIds = assessments.map(a => a.id);
      const { data, error } = await supabase
        .from('differential_diagnoses')
        .select('*')
        .in('assessment_id', assessmentIds)
        .order('probability', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!assessments && assessments.length > 0,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Button variant="outline" onClick={onBack} className="w-fit">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={onStartAssessment} className="bg-primary hover:bg-primary/90">
            <ClipboardList className="h-4 w-4 mr-2" />
            New Assessment
          </Button>
        </div>

        {/* Patient Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{patient.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Patient ID</p>
                <p className="font-medium">{patient.patientId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Age</p>
                <p className="font-medium">{patient.age} years</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium capitalize">{patient.gender}</p>
              </div>
              {patient.location && (
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{patient.location}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Registered</p>
                <p className="font-medium">{format(new Date(patient.createdAt), 'MMM dd, yyyy')}</p>
              </div>
              {patient.lastAssessment && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Assessment</p>
                  <p className="font-medium">{format(new Date(patient.lastAssessment), 'MMM dd, yyyy')}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Assessments History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Assessment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assessmentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading assessments...</span>
              </div>
            ) : !assessments || assessments.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-10 w-10 text-muted mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No assessments yet for this patient.</p>
                <Button onClick={onStartAssessment} size="sm">
                  Start First Assessment
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {assessments.map((assessment) => {
                  const assessmentDiagnoses = diagnoses?.filter(d => d.assessment_id === assessment.id) || [];
                  return (
                    <Card key={assessment.id} className="border hover:border-primary/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{assessment.chief_complaint}</p>
                              {getStatusBadge(assessment.status)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{format(new Date(assessment.created_at), 'MMM dd, yyyy HH:mm')}</span>
                              <span>•</span>
                              <span>Step {assessment.current_step}</span>
                            </div>
                            {assessmentDiagnoses.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {assessmentDiagnoses.slice(0, 3).map((dx) => (
                                  <Badge key={dx.id} variant="outline" className="text-xs">
                                    {dx.condition_name} ({Math.round(dx.probability * 100)}%)
                                  </Badge>
                                ))}
                                {assessmentDiagnoses.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{assessmentDiagnoses.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {assessment.status === 'in-progress' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onResumeAssessment(assessment.id)}
                              >
                                Resume
                              </Button>
                            )}
                            {assessment.status === 'completed' && onViewCompletedAssessment && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onViewCompletedAssessment(assessment.id, assessment.chief_complaint)}
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                View Summary
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
