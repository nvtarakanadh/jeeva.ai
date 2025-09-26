import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { record_text, record_type, patient_id, record_id } = await req.json();
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze this health record and provide insights:
            
            Record Type: ${record_type}
            Content: ${record_text}
            
            Please provide:
            1. Key health indicators and biomarkers
            2. Risk assessment (low/medium/high)
            3. Recommendations for the patient
            4. Any concerning patterns or values
            
            Format as JSON with: indicators, risk_level, recommendations, concerns`
          }]
        }]
      }),
    });

    const data = await response.json();
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text;

    // Attempt to persist to ai_insights using service role
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (!supabaseUrl || !serviceKey) {
        throw new Error('Supabase service credentials not configured');
      }

      const supabase = createClient(supabaseUrl, serviceKey);

      // Try to parse JSON; fall back to raw text
      let parsed: any = null;
      try {
        parsed = analysis ? JSON.parse(analysis) : null;
      } catch {
        parsed = { raw: analysis };
      }

      if (patient_id) {
        await supabase.from('ai_insights').insert({
          patient_id,
          record_id: record_id ?? null,
          insight_type: record_type ?? 'other',
          content: parsed ?? {},
          risk_level: parsed?.risk_level ?? null,
          recommendations: parsed?.recommendations ?? null,
        });
      }
    } catch (persistError) {
      console.error('Failed to persist AI insight:', persistError);
    }

    return new Response(JSON.stringify({ 
      analysis,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error analyzing health record:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});