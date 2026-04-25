
// ABOUTME: AI assistant edge function for clinical question generation, differential diagnosis, and clinical support
// ABOUTME: Uses Groq API with GROQ_API_KEY for all AI features

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const AI_GATEWAY_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama3-70b-8192";

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function callAI(systemPrompt: string, userPrompt: string, maxTokens = 2000): Promise<string> {
  const apiKey = Deno.env.get('GROQ_API_KEY');
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured');

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
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('AI Gateway error:', response.status, errorText);
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    if (response.status === 402) {
      throw new Error('AI credits exhausted. Please add funds in Settings > Workspace > Usage.');
    }
    throw new Error(`AI Gateway error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function extractJSON<T = unknown>(text: string, type: 'array' | 'object'): T {
  const pattern = type === 'array' ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
  const match = text.match(pattern);
  if (!match) throw new Error(`No JSON ${type} found in AI response`);
  return JSON.parse(match[0]) as T;
}

interface GeneratedQuestion {
  id?: string;
  text?: string;
  type?: string;
  options?: string[];
  category?: string;
  required?: boolean;
}

interface GeneratedDifferential {
  condition: string;
  probability: number;
  explanation: string;
  keyFeatures: string[];
}

interface DifferentialDiagnosisResponse {
  pertinentNegatives?: string[];
  soapNote?: string;
  differentialDiagnoses?: GeneratedDifferential[];
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const requestBody = await req.json();
    const { action, chiefComplaint } = requestBody;

    if (!action) {
      return new Response(JSON.stringify({ error: 'Action parameter is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[ai-assistant] action="${action}" chiefComplaint="${chiefComplaint}"`);

    // Health check
    if (action === 'health-check' || action === 'test') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'ai-assistant',
        version: '3.0.0',
        gateway: 'groq-ai',
        hasApiKey: !!Deno.env.get('GROQ_API_KEY'),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'generate-questions') {
      const { previousAnswers = {} } = requestBody;

      if (!chiefComplaint) {
        return new Response(JSON.stringify({ error: 'Chief complaint is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const systemPrompt = `You are a clinical AI assistant generating focused medical history questions for a patient presenting with "${chiefComplaint}".

Generate 4-6 relevant questions following the SOCRATES/OLDCARTS framework (Site, Onset, Character, Radiation, Associated symptoms, Timing, Exacerbating/Relieving factors, Severity).

Return ONLY a valid JSON array of question objects:
[
  {
    "id": "uuid-format",
    "text": "Question text?",
    "type": "multiple-choice",
    "options": ["Option 1", "Option 2", "Option 3"],
    "category": "onset",
    "required": true
  }
]

Use valid UUID v4 format for each ID. Make questions specific to "${chiefComplaint}". Include severity scale questions (type: "scale") for pain. Return ONLY the JSON array.`;

      const userPrompt = `Chief complaint: ${chiefComplaint}
${Object.keys(previousAnswers).length > 0 ? `Previous answers: ${JSON.stringify(previousAnswers)}` : ''}
Generate focused clinical questions.`;

      const aiResponse = await callAI(systemPrompt, userPrompt, 2000);
      let questions = extractJSON<GeneratedQuestion[]>(aiResponse, 'array');

      // Validate and fix question IDs
      questions = questions.map((q) => {
        if (!q.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(q.id)) {
          q.id = generateUUID();
        }
        if (!q.type) q.type = 'text';
        if (!q.category) q.category = 'general';
        if (typeof q.required !== 'boolean') q.required = true;
        return q;
      });

      console.log(`[ai-assistant] Generated ${questions.length} questions`);
      return new Response(JSON.stringify({ questions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'generate-differential') {
      const { answers = {}, rosData = {} } = requestBody;

      const systemPrompt = `You are a clinical AI assistant generating differential diagnoses. Analyze the patient presentation and provide the most likely diagnoses with clinical reasoning.

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
      "condition": "Condition name",
      "probability": 85,
      "explanation": "Clinical reasoning",
      "keyFeatures": ["Feature 1", "Feature 2"],
      "guidelineCitation": "2021 AHA/ACC Guidelines",
      "statOrders": ["STAT 12-lead ECG", "High-sensitivity Troponin"]
    }
  ]
}

Provide 3-5 differentials ranked by likelihood (probability 1-100). Include common and serious conditions. Return ONLY the JSON object.`;

      const userPrompt = `Chief complaint: ${chiefComplaint}
Patient answers: ${JSON.stringify(answers, null, 2)}
Review of Systems: ${JSON.stringify(rosData, null, 2)}
Generate differential diagnoses.`;

      const aiResponse = await callAI(systemPrompt, userPrompt, 3000);
      const parsedObject = extractJSON<DifferentialDiagnosisResponse>(aiResponse, 'object');
      const differentials = parsedObject.differentialDiagnoses || [];

      console.log(`[ai-assistant] Generated ${differentials.length} differentials`);
      return new Response(JSON.stringify({ 
        differentials, 
        pertinentNegatives: parsedObject.pertinentNegatives || [],
        soapNote: parsedObject.soapNote || ''
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'generate-adaptive-questions') {
      const { phase1Answers = '', redFlags = '', triggers = '', riskLevel = 'medium', maxQuestions = 5 } = requestBody;

      if (!chiefComplaint) {
        return new Response(JSON.stringify({ error: 'Chief complaint is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const systemPrompt = `You are a clinical AI assistant generating targeted follow-up questions for Phase 2 of a medical assessment. The patient presented with "${chiefComplaint}" and their risk level is "${riskLevel}".

Based on the Phase 1 answers and identified concerns, generate ${maxQuestions} focused follow-up questions that address gaps, red flags, and clinical concerns.

Return ONLY a valid JSON array of question objects:
[
  {
    "text": "Follow-up question text?",
    "type": "multiple-choice-with-text",
    "options": ["Option 1", "Option 2", "Option 3"],
    "category": "symptom_clarification",
    "required": true,
    "priority": 1,
    "redFlag": false,
    "rationale": "Why this question matters clinically",
    "trigger": "What finding triggered this question"
  }
]

Categories: symptom_clarification, red_flag_screening, pain_management, medical_history, emergency_screening, additional_concerns.
Return ONLY the JSON array.`;

      const userPrompt = `Chief complaint: ${chiefComplaint}
Risk level: ${riskLevel}
Phase 1 answers:
${phase1Answers}
Red flags identified:
${redFlags}
Phase 2 triggers:
${triggers}
Generate targeted follow-up questions.`;

      const aiResponse = await callAI(systemPrompt, userPrompt, 2000);
      let questions = extractJSON<GeneratedQuestion[]>(aiResponse, 'array');

      questions = questions.slice(0, maxQuestions);

      console.log(`[ai-assistant] Generated ${questions.length} adaptive questions`);
      return new Response(JSON.stringify({ questions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'generate-clinical-support') {
      const { differentialDiagnoses = [], answers = {}, rosData = {} } = requestBody;

      const systemPrompt = `You are a clinical AI assistant providing investigation recommendations and clinical decision support.

Return ONLY a valid JSON object:
{
  "investigations": [
    {
      "investigation": {
        "id": "unique_id",
        "name": "Investigation Name",
        "type": "laboratory",
        "category": "Category",
        "indication": "Clinical indication",
        "urgency": "routine",
        "cost": "low",
        "rationale": "Scientific rationale"
      },
      "priority": 1,
      "clinicalRationale": "Why this test is recommended",
      "contraindications": []
    }
  ],
  "redFlags": [
    {
      "condition": "Condition name",
      "severity": "high",
      "description": "Red flag description",
      "immediateActions": ["action1"]
    }
  ],
  "guidelines": [
    {
      "title": "Guideline title",
      "source": "Source",
      "recommendation": "Recommendation",
      "evidenceLevel": "A",
      "applicableConditions": ["condition1"]
    }
  ],
  "treatmentRecommendations": ["treatment1"],
  "followUpRecommendations": ["followup1"]
}

Provide evidence-based recommendations. Return ONLY the JSON object.`;

      const userPrompt = `Chief complaint: ${chiefComplaint}
Differential diagnoses: ${JSON.stringify(differentialDiagnoses, null, 2)}
Patient answers: ${JSON.stringify(answers, null, 2)}
Review of Systems: ${JSON.stringify(rosData, null, 2)}
Generate clinical decision support.`;

      const aiResponse = await callAI(systemPrompt, userPrompt, 4000);
      const clinicalSupport = extractJSON<Record<string, unknown>>(aiResponse, 'object');

      console.log(`[ai-assistant] Generated clinical support`);
      return new Response(JSON.stringify({ clinicalSupport }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action', received: action }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ai-assistant] Error:', error);
    return new Response(JSON.stringify({
      error: 'An internal server error occurred while processing your request.',
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
