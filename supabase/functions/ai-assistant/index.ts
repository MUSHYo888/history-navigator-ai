
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

interface GenerateQuestionsRequest {
  action: string;
  chiefComplaint: string;
  previousAnswers?: Record<string, any>;
}

interface GenerateDifferentialRequest {
  action: string;
  chiefComplaint: string;
  answers: Record<string, any>;
  rosData?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('AI Assistant function called at:', new Date().toISOString());
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));

    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterApiKey) {
      console.error('OPENROUTER_API_KEY is not configured');
      return new Response(JSON.stringify({ 
        error: 'OPENROUTER_API_KEY is not configured',
        timestamp: new Date().toISOString(),
        function: 'ai-assistant'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('OpenRouter API key found, length:', openRouterApiKey.length);

    const requestBody = await req.json();
    console.log('Request body received:', JSON.stringify(requestBody, null, 2));
    
    const { action, chiefComplaint } = requestBody;
    
    if (!action) {
      console.error('Action parameter is required');
      return new Response(JSON.stringify({ 
        error: 'Action parameter is required',
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing action: ${action} for chief complaint: "${chiefComplaint}"`);

    if (action === 'generate-questions') {
      const { previousAnswers = {} }: GenerateQuestionsRequest = requestBody;
      
      console.log(`Generating questions for: "${chiefComplaint}"`);
      
      const systemPrompt = `You are a clinical AI assistant helping to generate focused medical history questions for a patient presenting with "${chiefComplaint}".

Generate 4-6 relevant questions that follow the SOCRATES/OLDCARTS framework (Site, Onset, Character, Radiation, Associated symptoms, Timing, Exacerbating/Relieving factors, Severity).

Return ONLY a valid JSON array of question objects with this exact format:
[
  {
    "id": "uuid-here",
    "text": "Question text here?",
    "type": "multiple-choice",
    "options": ["Option 1", "Option 2", "Option 3"],
    "category": "onset",
    "required": true
  }
]

IMPORTANT:
- Use valid UUID v4 format for each question ID
- Make questions specific to the chief complaint "${chiefComplaint}"
- For pain complaints, include severity scale questions (type: "scale")
- Use appropriate time ranges for timing questions
- Keep questions clinically relevant and focused
- Return ONLY the JSON array, no other text`;

      const userPrompt = `Chief complaint: ${chiefComplaint}
${Object.keys(previousAnswers).length > 0 ? `Previous answers: ${JSON.stringify(previousAnswers)}` : ''}

Generate focused clinical questions for this presentation.`;

      console.log('Sending request to OpenRouter...');
      console.log('System prompt length:', systemPrompt.length);
      console.log('User prompt length:', userPrompt.length);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://lovable.dev', // Optional: helps with rate limiting
          'X-Title': 'Medical Assessment AI' // Optional: for identification
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 2000
        }),
      });

      console.log('OpenRouter response status:', response.status);
      console.log('OpenRouter response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error:', response.status, errorText);
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('OpenRouter response data:', JSON.stringify(data, null, 2));
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response structure from OpenRouter API');
      }

      const aiResponse = data.choices[0].message.content;
      console.log('AI response content:', aiResponse);
      
      // Extract JSON from the response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('No JSON array found in AI response');
        throw new Error('Invalid AI response format - no JSON array found');
      }

      let questions;
      try {
        questions = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('Failed to parse AI response JSON:', parseError);
        throw new Error('Failed to parse AI response JSON');
      }

      // Validate and fix question IDs
      questions = questions.map((q: any, index: number) => {
        if (!q.id || typeof q.id !== 'string' || !q.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
          q.id = generateUUID();
          console.log(`Generated new UUID for question ${index}: ${q.id}`);
        }
        return q;
      });

      console.log(`Generated ${questions.length} questions for: ${chiefComplaint}`);
      console.log('Questions with IDs:', questions.map(q => ({ id: q.id, text: q.text })));

      return new Response(JSON.stringify({ questions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'generate-differential') {
      const { answers, rosData = {} }: GenerateDifferentialRequest = requestBody;

      console.log(`Generating differential diagnosis for: "${chiefComplaint}"`);

      const systemPrompt = `You are a clinical AI assistant generating differential diagnoses. Analyze the patient presentation and provide the most likely diagnoses with clinical reasoning.

Return ONLY a valid JSON array of differential diagnoses with this exact format:
[
  {
    "condition": "Condition name",
    "probability": 85,
    "explanation": "Clinical reasoning for this diagnosis",
    "keyFeatures": ["Feature 1", "Feature 2", "Feature 3"]
  }
]

Provide 3-5 differential diagnoses ranked by likelihood (probability 1-100). Include both common and serious conditions that must be ruled out. Base probabilities on clinical evidence and epidemiology.
Return ONLY the JSON array, no other text.`;

      const userPrompt = `Chief complaint: ${chiefComplaint}

Patient answers to history questions:
${JSON.stringify(answers, null, 2)}

Review of Systems findings:
${JSON.stringify(rosData, null, 2)}

Generate differential diagnoses with clinical reasoning.`;

      console.log('Sending differential diagnosis request to OpenRouter...');

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://lovable.dev',
          'X-Title': 'Medical Assessment AI'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2,
          max_tokens: 3000
        }),
      });

      console.log('Differential diagnosis response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error for differential:', response.status, errorText);
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Extract JSON from the response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format for differential diagnosis');
      }

      const differentials = JSON.parse(jsonMatch[0]);
      console.log(`Generated ${differentials.length} differential diagnoses for: ${chiefComplaint}`);

      return new Response(JSON.stringify({ differentials }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'generate-clinical-support') {
      const { differentialDiagnoses, answers, rosData = {} } = requestBody;

      console.log(`Generating clinical decision support for: "${chiefComplaint}"`);

      const systemPrompt = `You are a clinical AI assistant providing investigation recommendations and clinical decision support. Analyze the patient presentation and provide structured clinical guidance.

Return ONLY a valid JSON object with this exact format:
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
      "description": "Description of the red flag",
      "immediateActions": ["action1", "action2"]
    }
  ],
  "guidelines": [
    {
      "title": "Guideline title",
      "source": "Guideline source",
      "recommendation": "Specific recommendation",
      "evidenceLevel": "A",
      "applicableConditions": ["condition1"]
    }
  ],
  "treatmentRecommendations": ["treatment1", "treatment2"],
  "followUpRecommendations": ["followup1", "followup2"]
}

Provide evidence-based recommendations prioritized by clinical importance and cost-effectiveness.
Return ONLY the JSON object, no other text.`;

      const userPrompt = `Chief complaint: ${chiefComplaint}

Differential diagnoses:
${JSON.stringify(differentialDiagnoses, null, 2)}

Patient answers to history questions:
${JSON.stringify(answers, null, 2)}

Review of Systems findings:
${JSON.stringify(rosData, null, 2)}

Generate comprehensive clinical decision support.`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://lovable.dev',
          'X-Title': 'Medical Assessment AI'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2,
          max_tokens: 4000
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error for clinical support:', response.status, errorText);
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format for clinical support');
      }

      const clinicalSupport = JSON.parse(jsonMatch[0]);
      console.log(`Generated clinical decision support for: ${chiefComplaint}`);

      return new Response(JSON.stringify({ clinicalSupport }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Test endpoint for system health checks
    if (action === 'test') {
      console.log('Test endpoint called - function is working');
      return new Response(JSON.stringify({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        message: 'AI Assistant function is operational',
        openRouterConfigured: !!openRouterApiKey
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.error('Invalid action parameter:', action);
    return new Response(JSON.stringify({ 
      error: 'Invalid action parameter',
      availableActions: ['generate-questions', 'generate-differential', 'generate-clinical-support', 'test']
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    console.error('Error stack:', error.stack);
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString(),
      function: 'ai-assistant',
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
