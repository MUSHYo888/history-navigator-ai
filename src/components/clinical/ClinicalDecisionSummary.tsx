// ABOUTME: Component for displaying clinical decision support data in patient summary
// ABOUTME: Shows investigation orders and treatment plans in a structured format

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Microscope, Pill, FileText, DollarSign } from 'lucide-react';

interface ClinicalDecisionSummaryProps {
  clinicalDecisionData: any;
}

export function ClinicalDecisionSummary({ clinicalDecisionData }: ClinicalDecisionSummaryProps) {
  if (!clinicalDecisionData) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Clinical decision support not completed</p>
          <p className="text-sm">Investigation and treatment planning pending</p>
        </CardContent>
      </Card>
    );
  }

  const { investigation_plan, treatment_plan, clinical_notes } = clinicalDecisionData;

  return (
    <div className="space-y-6">
      {/* Investigation Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Microscope className="h-5 w-5 text-primary" />
            <span>Investigation Plan</span>
            {investigation_plan?.estimatedCost > 0 && (
              <Badge variant="outline" className="ml-auto">
                <DollarSign className="h-3 w-3 mr-1" />
                ${investigation_plan.estimatedCost}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {investigation_plan?.selected?.length > 0 ? (
            <>
              <div>
                <h4 className="font-medium mb-2">Selected Investigations:</h4>
                <div className="flex flex-wrap gap-2">
                  {investigation_plan.selected.map((investigation: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {investigation}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {investigation_plan.rationale && (
                <div>
                  <h4 className="font-medium mb-2">Clinical Rationale:</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    {investigation_plan.rationale}
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">No investigations selected</p>
          )}
        </CardContent>
      </Card>

      {/* Treatment Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Pill className="h-5 w-5 text-secondary" />
            <span>Treatment & Management Plan</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {treatment_plan?.medications?.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Medications:</h4>
              <div className="flex flex-wrap gap-2">
                {treatment_plan.medications.map((medication: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {medication}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {treatment_plan?.nonPharmacological?.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Non-Pharmacological Treatment:</h4>
              <div className="flex flex-wrap gap-2">
                {treatment_plan.nonPharmacological.map((treatment: string, index: number) => (
                  <Badge key={index} variant="outline">
                    {treatment}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {treatment_plan?.followUp && (
            <div>
              <h4 className="font-medium mb-2">Follow-up Plan:</h4>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                {treatment_plan.followUp}
              </p>
            </div>
          )}

          {(!treatment_plan?.medications?.length && !treatment_plan?.nonPharmacological?.length && !treatment_plan?.followUp) && (
            <p className="text-muted-foreground">No treatment plan specified</p>
          )}
        </CardContent>
      </Card>

      {/* Clinical Notes */}
      {clinical_notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-accent" />
              <span>Additional Clinical Notes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-lg">
              {clinical_notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}