
// ABOUTME: SOAP Notes editor component for structured clinical documentation
// ABOUTME: Provides interactive form for creating and editing SOAP notes

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText, Save, Loader2 } from 'lucide-react';
import { ClinicalReportService } from '@/services/reporting/ClinicalReportService';
import { SOAPNote } from '@/types/reporting';
import { toast } from 'sonner';

interface SOAPNotesEditorProps {
  assessmentId: string;
  initialData?: Partial<SOAPNote>;
  onSave?: (soapNote: SOAPNote) => void;
  onCancel?: () => void;
}

export function SOAPNotesEditor({
  assessmentId,
  initialData,
  onSave,
  onCancel
}: SOAPNotesEditorProps) {
  const [subjective, setSubjective] = useState(initialData?.subjective || '');
  const [objective, setObjective] = useState(initialData?.objective || '');
  const [assessment, setAssessment] = useState(initialData?.assessment || '');
  const [plan, setPlan] = useState(initialData?.plan || '');
  const [additionalNotes, setAdditionalNotes] = useState(initialData?.additionalNotes || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!subjective.trim() || !objective.trim() || !assessment.trim() || !plan.trim()) {
      toast.error('Please fill in all required SOAP sections');
      return;
    }

    try {
      setLoading(true);
      
      const soapNote = await ClinicalReportService.createSOAPNote(
        assessmentId,
        subjective,
        objective,
        assessment,
        plan,
        additionalNotes || undefined,
        'Clinical User'
      );

      toast.success('SOAP note saved successfully');
      onSave?.(soapNote);
    } catch (error) {
      console.error('Error saving SOAP note:', error);
      toast.error('Failed to save SOAP note');
    } finally {
      setLoading(false);
    }
  };

  const getPromptText = (section: string) => {
    switch (section) {
      case 'subjective':
        return 'Document what the patient reports: chief complaint, history of present illness, review of systems, past medical history, medications, allergies, social history...';
      case 'objective':
        return 'Document measurable, observable data: vital signs, physical examination findings, laboratory results, imaging results...';
      case 'assessment':
        return 'Document your clinical impression: primary diagnosis, differential diagnoses, clinical reasoning...';
      case 'plan':
        return 'Document the treatment plan: medications, procedures, follow-up appointments, patient education, monitoring...';
      default:
        return '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            SOAP Note Documentation
          </CardTitle>
          <p className="text-gray-600">
            Complete structured clinical documentation following the SOAP format
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Subjective */}
          <div className="space-y-2">
            <Label htmlFor="subjective" className="text-lg font-semibold text-blue-700">
              Subjective <span className="text-red-500">*</span>
            </Label>
            <p className="text-sm text-gray-600 mb-2">
              {getPromptText('subjective')}
            </p>
            <Textarea
              id="subjective"
              value={subjective}
              onChange={(e) => setSubjective(e.target.value)}
              placeholder="Patient reports..."
              className="min-h-[120px]"
              required
            />
          </div>

          {/* Objective */}
          <div className="space-y-2">
            <Label htmlFor="objective" className="text-lg font-semibold text-green-700">
              Objective <span className="text-red-500">*</span>
            </Label>
            <p className="text-sm text-gray-600 mb-2">
              {getPromptText('objective')}
            </p>
            <Textarea
              id="objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Vital signs: BP, HR, RR, Temp, O2 Sat&#10;Physical examination findings..."
              className="min-h-[120px]"
              required
            />
          </div>

          {/* Assessment */}
          <div className="space-y-2">
            <Label htmlFor="assessment" className="text-lg font-semibold text-purple-700">
              Assessment <span className="text-red-500">*</span>
            </Label>
            <p className="text-sm text-gray-600 mb-2">
              {getPromptText('assessment')}
            </p>
            <Textarea
              id="assessment"
              value={assessment}
              onChange={(e) => setAssessment(e.target.value)}
              placeholder="Primary diagnosis:&#10;Differential diagnoses:&#10;Clinical reasoning..."
              className="min-h-[120px]"
              required
            />
          </div>

          {/* Plan */}
          <div className="space-y-2">
            <Label htmlFor="plan" className="text-lg font-semibold text-orange-700">
              Plan <span className="text-red-500">*</span>
            </Label>
            <p className="text-sm text-gray-600 mb-2">
              {getPromptText('plan')}
            </p>
            <Textarea
              id="plan"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              placeholder="Medications:&#10;Procedures:&#10;Follow-up:&#10;Patient education:&#10;Monitoring:"
              className="min-h-[120px]"
              required
            />
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="additionalNotes" className="text-lg font-semibold text-gray-700">
              Additional Notes
            </Label>
            <p className="text-sm text-gray-600 mb-2">
              Any additional observations, considerations, or documentation
            </p>
            <Textarea
              id="additionalNotes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Additional clinical observations, patient concerns, or documentation..."
              className="min-h-[80px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {loading ? 'Saving...' : 'Save SOAP Note'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
