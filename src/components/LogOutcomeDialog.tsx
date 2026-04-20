import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Activity, Loader2, Target, HeartPulse, Award, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LogOutcomeDialogProps {
  assessmentId: string;
  patientId: string;
  onSuccess?: () => void;
}

export function LogOutcomeDialog({ assessmentId, patientId, onSuccess }: LogOutcomeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [outcome, setOutcome] = useState('improved');
  const [diagnosticAccuracy, setDiagnosticAccuracy] = useState([85]);
  const [treatmentEffectiveness, setTreatmentEffectiveness] = useState([80]);
  const [patientSatisfaction, setPatientSatisfaction] = useState([90]);
  const [costEfficiency, setCostEfficiency] = useState([75]);
  const [followUpDate, setFollowUpDate] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('patient_outcomes').insert({
        assessment_id: assessmentId,
        patient_id: patientId,
        outcome,
        diagnostic_accuracy_score: diagnosticAccuracy[0],
        treatment_effectiveness_score: treatmentEffectiveness[0],
        patient_satisfaction_score: patientSatisfaction[0],
        cost_efficiency_score: costEfficiency[0],
        follow_up_date: followUpDate ? new Date(followUpDate).toISOString() : null
      });

      if (error) throw error;

      toast.success('Patient outcome logged successfully');
      setIsOpen(false);
      if (onSuccess) onSuccess();
      
    } catch (err: any) {
      console.error('Failed to log outcome:', err);
      toast.error(err.message || 'Failed to log patient outcome');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100">
          <Activity className="h-3 w-3 mr-1" />
          Log Outcome
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Log Patient Outcome</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Clinical Outcome</Label>
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger>
                <SelectValue placeholder="Select patient outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="improved">Improved</SelectItem>
                <SelectItem value="stable">Stable</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center"><Target className="w-4 h-4 mr-2 text-blue-500" /> Diagnostic Accuracy</Label>
              <span className="text-sm font-medium">{diagnosticAccuracy[0]}%</span>
            </div>
            <Slider value={diagnosticAccuracy} onValueChange={setDiagnosticAccuracy} max={100} step={1} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center"><HeartPulse className="w-4 h-4 mr-2 text-green-500" /> Treatment Effectiveness</Label>
              <span className="text-sm font-medium">{treatmentEffectiveness[0]}%</span>
            </div>
            <Slider value={treatmentEffectiveness} onValueChange={setTreatmentEffectiveness} max={100} step={1} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center"><Award className="w-4 h-4 mr-2 text-purple-500" /> Patient Satisfaction</Label>
              <span className="text-sm font-medium">{patientSatisfaction[0]}%</span>
            </div>
            <Slider value={patientSatisfaction} onValueChange={setPatientSatisfaction} max={100} step={1} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center"><DollarSign className="w-4 h-4 mr-2 text-yellow-600" /> Cost Efficiency</Label>
              <span className="text-sm font-medium">{costEfficiency[0]}%</span>
            </div>
            <Slider value={costEfficiency} onValueChange={setCostEfficiency} max={100} step={1} />
          </div>

          <div className="space-y-2">
            <Label>Actual Follow-up Date (Optional)</Label>
            <Input 
              type="date" 
              value={followUpDate} 
              onChange={(e) => setFollowUpDate(e.target.value)} 
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Outcome'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}