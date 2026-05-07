"use client";

import React, { useStateframer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ChevronRight, ChevronLeft, CheckCircle2, Loader2,
  Search, Brain, Heart, Activity, Eye, Ear
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMedical } from "@/context/MedicalContext";

import { AssessmentHeader } f/noom "@/components/AssessmentProgress";
import { ReviewOfSystemsComponent } from "@/components/ReviewOfSystemsComponent";
import { PastMedicalHistory } from "@/components/PastMedicalHistory";
import { PhysicalExamination } from "@/components/PhysicalExamination";
import { DifferentialDiagnosisEngine } from "@/components/DifferentialDiagnosisEngine";
import { PatientDemographics } from "@/components/PatientDemographics";
import { ClinicalSummary } from "@/components/ClinicalSummary";
import { AssessmentService } from "@/services/assessmentService";

const commonComplaints = [
  { name: 'Headache', icon: Brain, category: 'Neurological' },
  { name: 'Chest Pain', icon: Heart, category: 'Cardiovascular' },
  { name: 'Abdominal Pain', icon: Activity, category: 'Gastrointestinal' },
  { name: 'Shortness of Breath', icon: Heart, category: 'Respiratory' },
  { name: 'Fever', icon: Brain, category: 'General' },
  { name: 'Nausea/Vomiting', icon: Activity, category: 'Gastrointestinal' },
  { name: 'Dizziness', icon: Brain, category: 'Neurological' },
  { name: 'Joint Pain', icon: Brain, category: 'Musculoskeletal' },
  { name: 'Back Pain', icon: Brain, category: 'Musculoskeletal' },
  { name: 'Fatigue', icon: Brain, category: 'General' },
  { name: 'Vision Problems', icon: Eye, category: 'Ophthalmologic' },
  { name: 'Ear Pain', icon: Ear, category: 'ENT' }
];

const hpiQuestionMap: Record<string, { id: string, label: string, options: string[] }[]> = {
  'Headache': [
    { id: 'onset', label: 'Onset', options: ['Sudden', 'Gradual', 'Woke up with it'] },
    { id: 'location', label: 'Location', options: ['Frontal', 'Temporal', 'Occipital', 'Whole head', 'One side'] },
    { id: 'character', label: 'Character', options: ['Throbbing', 'Aching', 'Sharp', 'Pressure'] },
    { id: 'severity', label: 'Severity', options: ['Mild', 'Moderate', 'Severe', '10/10'] },
    { id: 'associated', label: 'Associated Symptoms', options: ['Nausea', 'Vomiting', 'Photophobia', 'Aura'] },
  ],
  'Chest Pain': [
    { id: 'onset', label: 'Onset', options: ['Sudden', 'Gradual', 'At rest', 'With exertion'] },
    { id: 'location', label: 'Location', options: ['Central', 'Left sided', 'Right sided'] },
    { id: 'character', label: 'Character', options: ['Crushing', 'Pressure', 'Sharp', 'Burning', 'Tightness'] },
    { id: 'radiation', label: 'Radiation', options: ['None', 'Left arm', 'Right arm', 'Jaw', 'Back'] },
    { id: 'associated', label: 'Associated Symptoms', options: ['Shortness of breath', 'Sweating', 'Nausea', 'Dizziness'] },
  ],
  'Abdominal Pain': [
    { id: 'onset', label: 'Onset', options: ['Sudden', 'Gradual', 'After eating'] },
    { id: 'location', label: 'Location', options: ['RUQ', 'RLQ', 'LUQ', 'LLQ', 'Epigastric', 'Periumbilical', 'Diffuse'] },
    { id: 'character', label: 'Character', options: ['Cramping', 'Sharp', 'Dull ache', 'Burning', 'Colicky'] },
    { id: 'radiation', label: 'Radiation', options: ['None', 'Back', 'Groin', 'Shoulder'] },
    { id: 'associated', label: 'Associated Symptoms', options: ['Nausea', 'Vomiting', 'Diarrhea', 'Constipation', 'Fever'] },
  ],
  'Shortness of Breath': [
    { id: 'onset', label: 'Onset', options: ['Sudden', 'Gradual', 'At rest', 'With exertion'] },
    { id: 'severity', label: 'Severity', options: ['Mild', 'Moderate', 'Severe', 'Unable to speak in full sentences'] },
    { id: 'timing', label: 'Timing', options: ['Constant', 'Intermittent', 'Worse at night'] },
    { id: 'associated', label: 'Associated Symptoms', options: ['Chest pain', 'Cough', 'Wheezing', 'Swelling in legs'] },
    { id: 'aggravating', label: 'Aggravating Factors', options: ['Lying flat', 'Cold air', 'Dust/Pollen', 'Exercise'] },
  ]
};

const defaultHpiQuestions = [
  { id: 'onset', label: 'Onset', options: ['Sudden', 'Gradual', 'Recent', 'Chronic'] },
  { id: 'location', label: 'Location', options: ['Localized', 'Diffuse', 'Radiating'] },
  { id: 'character', label: 'Character', options: ['Sharp', 'Dull', 'Aching', 'Burning'] },
  { id: 'severity', label: 'Severity', options: ['Mild', 'Moderate', 'Severe'] },
  { id: 'timing', label: 'Timing', options: ['Constant', 'Intermittent', 'Worse at night', 'Worse with activity'] },
  { id: 'context', label: 'Context', options: ['At rest', 'With exertion', 'After eating', 'Upon waking'] },
  { id: 'associated', label: 'Associated Symptoms', options: ['Fever', 'Nausea', 'Fatigue', 'Dizziness'] },
];

export default function Intake() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, dispatch } = useMedical();
  const initialStep = searchParams.get('step') ? parseInt(searchParams.get('step') as string, 10) : 1;
  consts[complaintSearchTerm, setComplaintSearchTerm] = useState('');
  const [hpiAnswers, setHpiAnswers] = useState<Record<string, string[]>>({});

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    patientId: '',
    location: '',
    chiefComplaint: '',
    hpi: '',
    pmhData: null,
    peData: null
  });

  const updateField = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const resumeId = searchParams.get('resume');
    if (resumeId && (!state.currentAssessment || state.currentAssessment.id !== resumeId)) {
      const loadAssessment = async () => {
        setLoading(true);
        try {
          const { data: assessment, error } = await supabase
            .from('assessments')
            .select('*, patients!inner(*)')
            .eq('id', resumeId)
            .single();

          if (error) throw error;

          dispatch({ 
            type: 'SET_CURRENT_PATIENT', 
            payload: {
              id: assessment.patients.id,
              name: assessment.patients.name,
              age: assessment.patients.age,
              gender: assessment.patients.gender as any,
              patientId: assessment.patients.patient_id,
              location: assessment.patients.location,
              createdAt: assessment.patients.created_at
            }
          });

          dispatch({
            type: 'SET_CURRENT_ASSESSMENT',
            payload: {
              id: assessment.id,
              patientId: assessment.patient_id,
              chiefComplaint: assessment.chief_complaint,
              status: assessment.status as any,
              currentStep: assessment.current_step,
              createdAt: assessment.created_at,
              updatedAt: assessment.updated_at
            }
          });

          const [answers, rosData, pmhData, peData] = await Promise.all([
            AssessmentService.getAssessmentAnswers(resumeId).catch(() => ({})),
            AssessmentService.getReviewOfSystems(resumeId).catch(() => ({})),
            AssessmentService.getPastMedicalHistory(resumeId).catch(() => null),
            AssessmentService.getPhysicalExamination(resumeId).catch(() => null)
          ]);
          
          if (answers && Object.keys(answers).length > 0) dispatch({ type: 'SET_ALL_ANSWERS', payload: answers });
          if (rosData && Object.keys(rosData).length > 0) dispatch({ type: 'SET_ROS_DATA', payload: rosData });
          if (pmhData) dispatch({ type: 'SET_PMH_DATA', payload: pmhData });
          if (peData) dispatch({ type: 'SET_PE_DATA', payload: peData });

          updateField('chiefComplaint', assessment.chief_complaint);
        } catch (err) {
          console.error("Failed to load assessment for resume:", err);
          toast.error("Failed to load assessment data.");
        } finally {
          setLoading(false);
        }
      };

      loadAssessment();
    }
  }, [searchParams, state.currentAssessment?.id, dispatch]);

  const steps = [
    "Demographics",
    "Chief Complaint",
    "History of Present Illness",
    "Past Medical History",
    "Review of Systems",
    "Physical Examination",
    "Differential Diagnosis"
  ];

  const getHPIQuestions = () => {
    const cc = formData.chiefComplaint || '';
    for (const key of Object.keys(hpiQuestionMap)) {
      if (cc.toLowerCase().includes(key.toLowerCase())) {
        return hpiQuestionMap[key];
      }
    }
    return defaultHpiQuestions;
  };

  const toggleHpiAnswer = (questionId: string, option: string) => {
    setHpiAnswers(prev => {
      const currentOptions = prev[questionId] || [];
      const newOptions = currentOptions.includes(option)
        ? currentOptions.filter(o => o !== option)
        : [...currentOptions, option];
      const newAnswers = { ...prev, [questionId]: newOptions };
      
      const cc = formData.chiefComplaint || 'complaint';
      let narrative = `Patient presents with ${cc.toLowerCase()}.`;
      
      const onset = newAnswers['onset'];
      const location = newAnswers['location'];
      const character = newAnswers['character'];
      const severity = newAnswers['severity'];
      const radiation = newAnswers['radiation'];
      const timing = newAnswers['timing'];
      const context = newAnswers['context'];
      const aggravating = newAnswers['aggravating'];
      const associated = newAnswers['associated'];

      const sentences = [];

      if (character?.length || location?.length) {
        const charText = character?.length ? character.join(' and ').toLowerCase() : 'pain';
        const locText = location?.length ? ` located in the ${location.join(', ').toLowerCase()}` : '';
        sentences.push(`Patient reports ${charText}${locText}.`);
      }
      
      if (onset?.length) {
        sentences.push(`Onset was ${onset.join(' and ').toLowerCase()}.`);
      }
      if (severity?.length) {
        sentences.push(`Severity is rated as ${severity.join(', ').toLowerCase()}.`);
      }
      if (radiation?.length && !radiation.includes('None')) {
        sentences.push(`Pain radiates to the ${radiation.join(', ').toLowerCase()}.`);
      }
      if (timing?.length) {
        sentences.push(`Timing is ${timing.join(' and ').toLowerCase()}.`);
      }
      if (context?.length) {
        sentences.push(`Occurs ${context.join(', ').toLowerCase()}.`);
      }
      if (aggravating?.length) {
        sentences.push(`Worsened by ${aggravating.join(', ').toLowerCase()}.`);
      }
      if (associated?.length) {
        sentences.push(`Associated symptoms include ${associated.join(', ').toLowerCase()}.`);
      }
      
      if (sentences.length > 0) {
        narrative += ' ' + sentences.join(' ');
      }
      
      updateField('hpi', narrative);
      return newAnswers;
    });
  };

  const answeredCount = Object.keys(hpiAnswers).filter(k => hpiAnswers[k].length > 0).length;

  const handleSelectComplaint = (cc: string) => {
    updateField('chiefComplaint', cc);
    toast.success(`Selected: ${cc}`);
    setStep(3);
  };

  const filteredComplaints = commonComplaints.filter(complaint =>
    complaint.name.toLowerCase().includes(complaintSearchTerm.toLowerCase())
  );

  const handleNext = () => {
    if (step === 1 && (!formData.name || !formData.age || !formData.gender)) {
      toast.error("Please complete demographics.");
      return;
    }
    if (step === 2 && !formData.chiefComplaint) {
      toast.error("Please select a chief complaint.");
      return;
    }
    setStep(s => Math.min(s + 1, 7));
  };

  const handlePrev = () => {
    setStep(s => Math.max(s - 1, 1));
  };

  const handleCompleteIntake = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required to save patient data.");

      // 1. Create Patient Record
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .insert({
          name: formData.name,
          age: parseInt(formData.age),
          gender: formData.gender,
          patient_id: formData.patientId || `PAT-${Date.now().toString().slice(-6)}`,
          location: formData.location || 'Triage',
          healthcare_provider_id: user.id
        })
        .select().single();

      if (patientError) throw patientError;

      // 2. Create Assessment Record
      const combinedChiefComplaint = formData.chiefComplaint + (formData.hpi ? ` - HPI: ${formData.hpi}` : '');
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          patient_id: patient.id,
          chief_complaint: combinedChiefComplaint,
          status: 'completed',
          current_step: 8
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      dispatch({ 
        type: 'SET_CURRENT_PATIENT', 
        payload: {
          id: patient.id,
          name: patient.name,
          age: patient.age,
          gender: patient.gender as 'male' | 'female' | 'other',
          patientId: patient.patient_id,
          location: patient.location || '',
          createdAt: patient.created_at,
          lastAssessment: patient.last_assessment || undefined
        }
      });
      dispatch({ 
        type: 'SET_CURRENT_ASSESSMENT', 
        payload: {
          id: assessment.id,
          patientId: assessment.patient_id,
          chiefComplaint: assessment.chief_complaint,
          status: assessment.status as 'in-progress' | 'completed' | 'draft',
          currentStep: assessment.current_step,
          createdAt: assessment.created_at,
          updatedAt: assessment.updated_at
        } 
      });

      toast.success("History completed and saved successfully!");
      setStep(8);
    } catch (err: unknown) {
      console.error(err);
      const error = err as Error;
      toast.error(error.message || "Failed to save intake data.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && step === 8 && !state.currentPatient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span className="text-muted-foreground">Loading patient summary...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-[95%] space-y-6">
        
        {/* Top Navigation */}
        <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        {/* Main Form Card */}
        <Card className="shadow-lg border-t-4 border-t-primary">
          {step !== 8 && (
            <CardHeader>
              <AssessmentHeader chiefComplaint={formData.chiefComplaint || "Not selected"} />
              <AssessmentProgress 
                currentStep={step} 
                totalSteps={7}
                steps={steps}
                progressPercent={(step / 7) * 100}
                answersCount={step === 3 ? answeredCount : 0}
              />
            </CardHeader>
          )}
          <CardContent>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="min-h-[350px]"
            >
              {/* STEP 1: Demographics */}
              {step === 1 && (
                <PatientDemographics formData={formData} updateField={updateField} />
              )}

              {/* STEP 2: Chief Complaint */}
              {step === 2 && (
                <div className="flex flex-col items-center justify-center h-full space-y-8 pt-8 text-center">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight">Chief Complaint</h2>
                    <p className="text-muted-foreground mt-2">What is the primary reason for the patient's visit?</p>
                  </div>

                  {/* Smart Search */}
                  <div className="w-full max-w-lg relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Search complaints or type a custom one..."
                      value={complaintSearchTerm}
                      onChange={(e) => setComplaintSearchTerm(e.target.value)}
                      className="pl-10 h-12 text-base"
                    />
                  </div>

                  {/* Custom Complaint Button */}
                  {filteredComplaints.length === 0 && complaintSearchTerm.trim() !== '' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Button 
                        onClick={() => handleSelectComplaint(complaintSearchTerm)}
                        className="bg-primary text-primary-foreground shadow-lg"
                        size="lg"
                      >
                        Use "{complaintSearchTerm}" as custom complaint
                      </Button>
                    </motion.div>
                  )}

                  {/* Common Complaints Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 w-full max-w-4xl pt-4">
                    {filteredComplaints.map((complaint) => (
                      <motion.div
                        key={complaint.name}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Button
                          variant="outline"
                          className="h-28 w-full flex flex-col items-center justify-center space-y-2 border-border/50 hover:border-primary hover:bg-primary/5 hover:text-primary focus-visible:ring-primary"
                          onClick={() => handleSelectComplaint(complaint.name)}
                        >
                          <complaint.icon className="h-7 w-7" />
                          <span className="text-xs font-medium text-center px-1 whitespace-normal leading-tight">{complaint.name}</span>
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: History of Present Illness (HPI) */}
              {step === 3 && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">History of Present Illness</h3>
                    <div className="space-y-6">
                      {getHPIQuestions().map(q => (
                        <div key={q.id} className="space-y-2">
                          <Label className="text-base text-muted-foreground">{q.label}</Label>
                          <div className="flex flex-wrap gap-2">
                            {q.options.map(opt => {
                              const isSelected = hpiAnswers[q.id]?.includes(opt);
                              return (
                                <Badge
                                  key={opt}
                                  variant={isSelected ? "default" : "outline"}
                                  className={`cursor-pointer px-3 py-1.5 text-sm transition-all ${isSelected ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-primary/5 text-muted-foreground'}`}
                                  onClick={() => toggleHpiAnswer(q.id, opt)}
                                >
                                  {opt}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <Label className="text-base font-semibold">Live HPI Summary</Label>
                    <Textarea 
                      value={formData.hpi} 
                      onChange={e => updateField('hpi', e.target.value)} 
                      placeholder="Auto-generated summary will appear here. Add any additional notes manually..."
                      className="min-h-[150px] leading-relaxed text-base"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: PMH */}
              {step === 4 && (
                <div className="space-y-8 [&_.p-6]:px-0 [&_.shadow-lg]:shadow-none">
                  <PastMedicalHistory />
                </div>
              )}

              {/* STEP 5: ROS */}
              {step === 5 && (
                <div className="space-y-8 [&_.p-6]:px-0 [&_.shadow-lg]:shadow-none">
                  <ReviewOfSystemsComponent />
                </div>
              )}

              {/* STEP 6: Physical Examination */}
              {step === 6 && (
                <div className="[&_.p-6]:px-0 [&_.shadow-lg]:shadow-none">
              <PhysicalExamination />
                </div>
              )}

              {/* STEP 7: DDx Engine */}
              {step === 7 && (
                <div className="[&_.p-6]:px-0 [&_.shadow-lg]:shadow-none">
                  <DifferentialDiagnosisEngine 
                    chiefComplaint={formData.chiefComplaint}
                  />
                </div>
              )}
              
              {/* STEP 8: Clinical Summary */}
              {step === 8 && (
                <div className="[&_.p-6]:px-0 [&_.shadow-lg]:shadow-none">
                  <ClinicalSummary 
                    chiefComplaint={formData.chiefComplaint}
                    hpiNote={formData.hpi}
                    onComplete={() => navigate("/")}
                    onBack={() => setStep(7)}
                  />
                </div>
              )}
              
            </motion.div>

            {/* Form Actions */}
            {step !== 8 && (
              <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t mt-8 gap-4">
                {step === 1 ? (
                  <Button variant="outline" onClick={() => navigate("/")} className="w-full sm:w-auto">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                  </Button>
                ) : (
                  <Button variant="outline" onClick={handlePrev} disabled={loading} className="w-full sm:w-auto">
                    <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                  </Button>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  {step < 7 && (
                    <Button onClick={handleNext} disabled={loading} className="w-full sm:w-auto">
                      Next <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                  {step === 7 && (
                    <Button onClick={handleCompleteIntake} disabled={loading} className="w-full sm:w-auto">
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                      Complete Intake
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
          )}
}
