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

// Helper function to log errors with context
function logError(context: string, error: any, additionalInfo?: any) {
  console.error(`[${context}] Error:`, {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    additionalInfo
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
    console.log('=== AI Assistant Function Called ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Method:', req.method);
    console.log('URL:', req.url);

    // Check OpenRouter API Key
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    console.log('Environment check:', {
      hasOpenRouterKey: !!openRouterApiKey,
      keyLength: openRouterApiKey ? openRouterApiKey.length : 0,
      keyPreview: openRouterApiKey ? openRouterApiKey.substring(0, 8) + '...' : 'NOT_SET'
    });

    if (!openRouterApiKey) {
      const errorResponse = { 
        error: 'OPENROUTER_API_KEY is not configured in Supabase secrets',
        timestamp: new Date().toISOString(),
        function: 'ai-assistant',
        details: 'Please configure the OPENROUTER_API_KEY in your Supabase project settings under Edge Functions > Secrets'
      };
      console.error('API Key Error:', errorResponse);
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body with error handling
    let requestBody;
    try {
      const bodyText = await req.text();
      console.log('Raw request body:', bodyText);
      requestBody = JSON.parse(bodyText);
      console.log('Parsed request body:', JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      const errorResponse = {
        error: 'Invalid JSON in request body',
        details: parseError.message,
        timestamp: new Date().toISOString()
      };
      logError('JSON_PARSE', parseError, { requestBody: 'FAILED_TO_PARSE' });
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { action, chiefComplaint } = requestBody;
    
    if (!action) {
      const errorResponse = { 
        error: 'Action parameter is required',
        availableActions: ['generate-questions', 'generate-differential', 'generate-clinical-support', 'health-check', 'test'],
        timestamp: new Date().toISOString()
      };
      console.error('Missing action parameter');
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing action: "${action}" for chief complaint: "${chiefComplaint}"`);

    // Handle health check
    if (action === 'health-check') {
      const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'ai-assistant',
        version: '1.1.0',
        environment: {
          hasOpenRouterKey: !!openRouterApiKey,
          openRouterKeyLength: openRouterApiKey ? openRouterApiKey.length : 0,
          denoVersion: Deno.version.deno,
          keyStatus: openRouterApiKey ? 'CONFIGURED' : 'MISSING'
        },
        endpoints: {
          'generate-questions': 'available',
          'generate-differential': 'available', 
          'generate-clinical-support': 'available',
          'health-check': 'available',
          'test': 'available'
        }
      };
      
      console.log('Health check response:', healthData);
      
      return new Response(JSON.stringify(healthData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Test endpoint
    if (action === 'test') {
      console.log('Test endpoint called - function is operational');
      const testResponse = { 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        message: 'AI Assistant function is operational',
        openRouterConfigured: !!openRouterApiKey,
        version: '1.1.0',
        testResult: 'PASS'
      };
      console.log('Test response:', testResponse);
      return new Response(JSON.stringify(testResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'generate-questions') {
      const { previousAnswers = {} }: GenerateQuestionsRequest = requestBody;
      
      if (!chiefComplaint || typeof chiefComplaint !== 'string') {
        const errorResponse = {
          error: 'Chief complaint is required and must be a string',
          received: { chiefComplaint, type: typeof chiefComplaint },
          timestamp: new Date().toISOString()
        };
        console.error('Invalid chief complaint:', errorResponse);
        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
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

      console.log(`Sending request to OpenRouter API...`);
      console.log(`System prompt length: ${systemPrompt.length} characters`);
      console.log(`User prompt length: ${userPrompt.length} characters`);

      try {
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
            temperature: 0.3,
            max_tokens: 2000
          }),
        });

        console.log(`OpenRouter response status: ${response.status}`);
        console.log(`OpenRouter response headers:`, Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          logError('OPENROUTER_API', { status: response.status, statusText: response.statusText }, { errorText });
          
          const errorResponse = {
            error: `OpenRouter API error: ${response.status} - ${response.statusText}`,
            details: errorText,
            timestamp: new Date().toISOString(),
            apiKeyConfigured: !!openRouterApiKey
          };
          
          return new Response(JSON.stringify(errorResponse), {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
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
          logError('JSON_EXTRACTION', new Error('No JSON array found'), { aiResponse });
          throw new Error('Invalid AI response format - no JSON array found');
        }

        let questions;
        try {
          questions = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          logError('AI_RESPONSE_PARSE', parseError, { jsonString: jsonMatch[0] });
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

        console.log(`Successfully generated ${questions.length} questions for: ${chiefComplaint}`);
        console.log('Questions with IDs:', questions.map(q => ({ id: q.id, text: q.text.substring(0, 50) + '...' })));

        return new Response(JSON.stringify({ questions }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (fetchError) {
        logError('QUESTION_GENERATION', fetchError, { chiefComplaint, action });
        
        const errorResponse = {
          error: 'Failed to generate questions',
          details: fetchError.message,
          timestamp: new Date().toISOString(),
          chiefComplaint,
          apiKeyConfigured: !!openRouterApiKey
        };
        
        return new Response(JSON.stringify(errorResponse), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
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

    console.error('Invalid action parameter:', action);
    return new Response(JSON.stringify({ 
      error: 'Invalid action parameter',
      received: action,
      availableActions: ['generate-questions', 'generate-differential', 'generate-clinical-support', 'health-check', 'test'],
      timestamp: new Date().toISOString()
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logError('FUNCTION_ERROR', error, { url: req.url, method: req.method });
    
    const errorResponse = { 
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString(),
      function: 'ai-assistant',
      version: '1.1.0'
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
