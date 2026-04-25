
// ABOUTME: Dedicated differential diagnosis edge function with full clinical context
// ABOUTME: Uses Groq API for comprehensive differential diagnosis generation and DB persistence

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const AI_GATEWAY_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama3-70b-8192";

interface DifferentialDiagnosis {
  condition: string;
  probability: number;
  explanation: string;
  keyFeatures: string[];
  conflictingFeatures?: string[];
  urgency: string;
  category: string;
  redFlags?: string[];
  guidelineCitation?: string;
  statOrders?: string[];
}

interface ClinicalRecommendations {
  immediateActions: string[];
  redFlagAlert: boolean;
  followUpRecommendations: string[];
}

interface RiskStratification {
  overallRisk: string;
  riskFactors: {
    highUrgencyConditions: number;
    redFlagConditions: number;
    diagnosticConfidence: number;
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const apiKey = Deno.env.get('GROQ_API_KEY');
    if (!apiKey) throw new Error('GROQ_API_KEY is not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { chiefComplaint, answers, rosData, pmhData, peData, assessmentId } = await req.json();
    console.log('[differential-diagnosis] Generating for:', chiefComplaint);

    const clinicalContext = {
      chiefComplaint,
      presentingSymptoms: extractPresentingSymptoms(answers),
      reviewOfSystems: rosData || {},
      pastMedicalHistory: pmhData || {},
      physicalExam: peData || {},
    };

    const systemPrompt = `You are an expert clinical diagnostician. Analyze the clinical presentation and generate a comprehensive differential diagnosis list.

You must extract 3-5 pertinent negatives from the HPI/ROS.
Draft a complete, formal SOAP note based on the provided clinical data.
For each diagnosis, you must provide a real-world, evidence-based guideline citation.
Instead of generic investigations, provide actionable, STAT order sets (CPOE style).

Return ONLY a valid JSON object:
{
  "pertinentNegatives": ["negative 1", "negative 2"],
  "soapNote": "S: ...\\nO: ...\\nA: ...\\nP: ...",
  "differentialDiagnoses": [
    {
      "condition": "Condition Name",
      "probability": 85,
      "explanation": "Clinical reasoning",
      "keyFeatures": ["Supporting feature 1"],
      "conflictingFeatures": ["Feature against"],
      "urgency": "high",
      "category": "cardiovascular",
      "redFlags": ["Red flag 1"],
      "guidelineCitation": "2021 AHA/ACC Guidelines",
      "statOrders": ["STAT 12-lead ECG", "High-sensitivity Troponin"]
    }
  ]
}

Generate 5-8 diagnoses ranked by probability (0-100). Include common and serious conditions. Return ONLY the JSON object.`;

    const userPrompt = `Chief Complaint: ${clinicalContext.chiefComplaint}
Presenting Symptoms: ${JSON.stringify(clinicalContext.presentingSymptoms)}
Review of Systems: ${JSON.stringify(clinicalContext.reviewOfSystems)}
Past Medical History: ${JSON.stringify(clinicalContext.pastMedicalHistory)}
Physical Examination: ${JSON.stringify(clinicalContext.physicalExam)}`;

    const response = await fetch(AI_GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 3000,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[differential-diagnosis] AI error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    let differentialDiagnoses: DifferentialDiagnosis[] = [];
    let pertinentNegatives: string[] = [];
    let soapNote: string = '';

    try {
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON object in response');
      const parsedData = JSON.parse(match[0]);
      differentialDiagnoses = parsedData.differentialDiagnoses || parsedData.differentials || [];
      pertinentNegatives = parsedData.pertinentNegatives || [];
      soapNote = parsedData.soapNote || '';
    } catch {
      console.error('[differential-diagnosis] Parse failed, using fallback');
      differentialDiagnoses = generateFallbackDifferentials(chiefComplaint);
    }

    // Save to database if assessmentId provided
    if (assessmentId && differentialDiagnoses.length > 0) {
      await supabase.from('differential_diagnoses').delete().eq('assessment_id', assessmentId);
      for (const diagnosis of differentialDiagnoses) {
        await supabase.from('differential_diagnoses').insert({
          assessment_id: assessmentId,
          condition_name: diagnosis.condition,
          probability: diagnosis.probability,
          explanation: diagnosis.explanation,
          key_features: diagnosis.keyFeatures,
        });
      }
    }

    console.log(`[differential-diagnosis] Generated ${differentialDiagnoses.length} diagnoses`);

    return new Response(JSON.stringify({
      differentialDiagnoses,
      pertinentNegatives,
      soapNote,
      clinicalRecommendations: generateClinicalRecommendations(differentialDiagnoses),
      riskStratification: calculateRiskStratification(differentialDiagnoses),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[differential-diagnosis] Error:', error);
    return new Response(JSON.stringify({ error: 'An internal server error occurred while generating the differential diagnosis.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function extractPresentingSymptoms(answers: Record<string, { value?: unknown; notes?: string }>): string[] {
  const symptoms: string[] = [];
  Object.values(answers || {}).forEach((answer) => {
    if (answer?.value && typeof answer.value === 'string') symptoms.push(answer.value);
    if (answer?.notes) symptoms.push(answer.notes);
  });
  return symptoms.filter(s => s.length > 0);
}

function generateClinicalRecommendations(diagnoses: DifferentialDiagnosis[]): ClinicalRecommendations {
  const urgentConditions = diagnoses.filter(d => d.urgency === 'high');
  return {
    immediateActions: urgentConditions.length > 0
      ? ['Consider urgent evaluation', 'Monitor vital signs', 'Ensure appropriate follow-up']
      : [],
    redFlagAlert: diagnoses.some(d => (d.redFlags?.length || 0) > 0),
    followUpRecommendations: [
      'Re-evaluate if symptoms worsen',
      'Consider specialist referral if diagnosis uncertain',
      'Patient education regarding warning signs',
    ],
  };
}

function calculateRiskStratification(diagnoses: DifferentialDiagnosis[]): RiskStratification {
  const highRiskCount = diagnoses.filter(d => d.urgency === 'high').length;
  const redFlagCount = diagnoses.filter(d => (d.redFlags?.length || 0) > 0).length;
  const avgProb = diagnoses.reduce((sum, d) => sum + d.probability, 0) / (diagnoses.length || 1);

  let overallRisk = 'low';
  if (highRiskCount > 0 || redFlagCount > 0) overallRisk = 'high';
  else if (avgProb > 60) overallRisk = 'moderate';

  return { overallRisk, riskFactors: { highUrgencyConditions: highRiskCount, redFlagConditions: redFlagCount, diagnosticConfidence: Math.round(avgProb) } };
}

function generateFallbackDifferentials(chiefComplaint: string): DifferentialDiagnosis[] {
  const fallbackMap: Record<string, DifferentialDiagnosis[]> = {
    'chest pain': [{ condition: 'Coronary Artery Disease', probability: 65, explanation: 'Most common cause of chest pain in adults', keyFeatures: ['Exertional chest pain'], conflictingFeatures: [], urgency: 'high', category: 'cardiovascular', redFlags: ['Acute onset'], guidelineCitation: '2021 AHA/ACC Guidelines', statOrders: ['STAT ECG', 'High-sensitivity Troponin'] }],
    'shortness of breath': [{ condition: 'Asthma', probability: 55, explanation: 'Common reversible airway disease', keyFeatures: ['Wheezing'], conflictingFeatures: [], urgency: 'moderate', category: 'respiratory', redFlags: [], guidelineCitation: 'GINA Guidelines', statOrders: ['Peak Flow', 'Spirometry'] }],
  };
  const key = Object.keys(fallbackMap).find(k => chiefComplaint.toLowerCase().includes(k));
  return key ? fallbackMap[key] : [{ condition: 'Clinical Assessment Required', probability: 50, explanation: 'Further evaluation needed', keyFeatures: ['Presenting symptoms require evaluation'], conflictingFeatures: [], urgency: 'moderate', category: 'general', redFlags: [], guidelineCitation: 'Standard Care Protocol', statOrders: ['Vitals', 'Clinical Evaluation'] }];
}
