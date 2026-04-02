
// ABOUTME: AI assistant edge function for clinical question generation, differential diagnosis, and clinical support
// ABOUTME: Uses Lovable AI Gateway (OpenAI-compatible) with LOVABLE_API_KEY for all AI features

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function callAI(systemPrompt: string, userPrompt: string, maxTokens = 2000): Promise<string> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) throw new Error('LOVABLE_API_KEY is not configured');

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

function extractJSON(text: string, type: 'array' | 'object'): any {
  const pattern = type === 'array' ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
  const match = text.match(pattern);
  if (!match) throw new Error(`No JSON ${type} found in AI response`);
  return JSON.parse(match[0]);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
        gateway: 'lovable-ai',
        hasApiKey: !!Deno.env.get('LOVABLE_API_KEY'),
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
      let questions = extractJSON(aiResponse, 'array');

      // Validate and fix question IDs
      questions = questions.map((q: any, i: number) => {
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

Return ONLY a valid JSON array:
[
  {
    "condition": "Condition name",
    "probability": 85,
    "explanation": "Clinical reasoning",
    "keyFeatures": ["Feature 1", "Feature 2"]
  }
]

Provide 3-5 differentials ranked by likelihood (probability 1-100). Include common and serious conditions. Return ONLY the JSON array.`;

      const userPrompt = `Chief complaint: ${chiefComplaint}
Patient answers: ${JSON.stringify(answers, null, 2)}
Review of Systems: ${JSON.stringify(rosData, null, 2)}
Generate differential diagnoses.`;

      const aiResponse = await callAI(systemPrompt, userPrompt, 3000);
      const differentials = extractJSON(aiResponse, 'array');

      console.log(`[ai-assistant] Generated ${differentials.length} differentials`);
      return new Response(JSON.stringify({ differentials }), {
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
      const clinicalSupport = extractJSON(aiResponse, 'object');

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
    console.error('[ai-assistant] Error:', error.message);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
