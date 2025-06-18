
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateQuestionsRequest {
  chiefComplaint: string;
  previousAnswers?: Record<string, any>;
}

interface GenerateDifferentialRequest {
  chiefComplaint: string;
  answers: Record<string, any>;
  rosData?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterApiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'generate-questions') {
      const { chiefComplaint, previousAnswers = {} }: GenerateQuestionsRequest = await req.json();
      
      const systemPrompt = `You are a clinical AI assistant helping to generate focused medical history questions for a patient presenting with "${chiefComplaint}".

Generate 4-6 relevant questions that follow the SOCRATES/OLDCARTS framework (Site, Onset, Character, Radiation, Associated symptoms, Timing, Exacerbating/Relieving factors, Severity).

Return a JSON array of question objects with this exact format:
[
  {
    "id": "unique_id_here",
    "text": "Question text here?",
    "type": "multiple-choice|yes-no|text|scale",
    "options": ["Option 1", "Option 2"] (only for multiple-choice),
    "category": "onset|duration|severity|location|quality|radiation|associated|timing|triggers",
    "required": true
  }
]

Make questions specific to the chief complaint. For pain complaints, include severity scale questions. For timing questions, use appropriate time ranges. Keep questions clinically relevant and focused.`;

      const userPrompt = `Chief complaint: ${chiefComplaint}
${Object.keys(previousAnswers).length > 0 ? `Previous answers: ${JSON.stringify(previousAnswers)}` : ''}

Generate focused clinical questions for this presentation.`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
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

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Extract JSON from the response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }

      const questions = JSON.parse(jsonMatch[0]);
      console.log(`Generated ${questions.length} questions for: ${chiefComplaint}`);

      return new Response(JSON.stringify({ questions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'generate-differential') {
      const { chiefComplaint, answers, rosData = {} }: GenerateDifferentialRequest = await req.json();

      const systemPrompt = `You are a clinical AI assistant generating differential diagnoses. Analyze the patient presentation and provide the most likely diagnoses with clinical reasoning.

Return a JSON array of differential diagnoses with this exact format:
[
  {
    "condition": "Condition name",
    "probability": 85,
    "explanation": "Clinical reasoning for this diagnosis",
    "keyFeatures": ["Feature 1", "Feature 2", "Feature 3"]
  }
]

Provide 3-5 differential diagnoses ranked by likelihood (probability 1-100). Include both common and serious conditions that must be ruled out. Base probabilities on clinical evidence and epidemiology.`;

      const userPrompt = `Chief complaint: ${chiefComplaint}

Patient answers to history questions:
${JSON.stringify(answers, null, 2)}

Review of Systems findings:
${JSON.stringify(rosData, null, 2)}

Generate differential diagnoses with clinical reasoning.`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
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

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Extract JSON from the response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }

      const differentials = JSON.parse(jsonMatch[0]);
      console.log(`Generated ${differentials.length} differential diagnoses for: ${chiefComplaint}`);

      return new Response(JSON.stringify({ differentials }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action parameter' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
