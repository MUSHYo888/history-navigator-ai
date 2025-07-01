
// ABOUTME: PDF export button component for clinical reports
// ABOUTME: Provides one-click PDF generation and download functionality

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2 } from 'lucide-react';
import { PDFGeneratorService } from '@/services/reporting/PDFGeneratorService';
import { ClinicalReportService } from '@/services/reporting/ClinicalReportService';
import { Patient, DifferentialDiagnosis } from '@/types/medical';
import { toast } from 'sonner';

interface PDFExportButtonProps {
  assessmentId: string;
  patient: Patient;
  chiefComplaint: string;
  answers: Record<string, any>;
  rosData: Record<string, any>;
  differentials: DifferentialDiagnosis[];
  pmhData?: any;
  peData?: any;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
}

export function PDFExportButton({
  assessmentId,
  patient,
  chiefComplaint,
  answers,
  rosData,
  differentials,
  pmhData,
  peData,
  variant = 'default',
  size = 'default'
}: PDFExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExportPDF = async () => {
    try {
      setLoading(true);
      
      // Create report content
      const reportContent = {
        patientDemographics: {
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          patientId: patient.patientId,
          location: patient.location
        },
        chiefComplaint,
        historyPresentIllness: Object.values(answers).map((answer: any) => 
          typeof answer.value === 'string' ? answer.value : JSON.stringify(answer.value)
        ),
        reviewOfSystems: rosData,
        pastMedicalHistory: pmhData,
        physicalExamination: peData,
        investigations: [],
        differentialDiagnosis: differentials.map(diff => ({
          condition: diff.condition,
          probability: diff.probability,
          explanation: diff.explanation
        })),
        treatmentPlan: [],
        followUpInstructions: []
      };

      // Save report to database
      const clinicalReport = await ClinicalReportService.createClinicalReport(
        assessmentId,
        'clinical_summary',
        `Clinical Assessment - ${patient.name}`,
        reportContent
      );

      // Generate PDF
      const pdfBlob = await PDFGeneratorService.generateClinicalReportPDF(
        clinicalReport,
        patient,
        differentials
      );

      // Download PDF
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `clinical-report-${patient.patientId}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Clinical report exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export clinical report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleExportPDF}
      disabled={loading}
      variant={variant}
      size={size}
      className="flex items-center gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      {loading ? 'Generating PDF...' : 'Export PDF'}
      {!loading && <Download className="h-4 w-4 ml-1" />}
    </Button>
  );
}
