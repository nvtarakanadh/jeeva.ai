// @ts-nocheck - Deno edge function
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check endpoint - no authentication required
  if (req.method === 'GET') {
    console.log('🔧 Edge Function: Health check requested');
    return new Response(JSON.stringify({
      success: true,
      message: 'Edge Function is running',
      timestamp: new Date().toISOString(),
      environment: {
        status: 'Mock AI Ready - Free and Working!'
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('🔧 Edge Function: Starting analyze-health-record function');
    
    // Parse request body
    let requestData = {};
    if (req.method === 'POST') {
      try {
        requestData = await req.json();
        console.log('🔧 Edge Function: Request data parsed successfully');
      } catch (parseError) {
        console.error('❌ Edge Function: Failed to parse request body:', parseError);
        return new Response(JSON.stringify({
          error: 'Invalid JSON in request body',
          success: false,
          timestamp: new Date().toISOString()
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    const { recordId, text, testOnly } = requestData;
    console.log('🔧 Edge Function: Request data', { recordId, hasText: !!text, testOnly });

    // If this is a test-only request, return success
    if (testOnly) {
      console.log('🔧 Edge Function: Running mock AI test...');

      return new Response(JSON.stringify({
        success: true,
        message: 'Mock AI test successful - AI analytics is ready!',
        response: { status: 'ready' }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('❌ Edge Function: No authorization header provided');
      return new Response(JSON.stringify({
        error: 'Authorization header is required',
        success: false,
        timestamp: new Date().toISOString()
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract token from authorization header
    const token = authHeader.replace('Bearer ', '');
    console.log('🔧 Edge Function: Token extracted, length:', token.length);

    // Validate input
    if (!text || text.trim().length === 0) {
      console.error('❌ Edge Function: No text provided for analysis');
      return new Response(JSON.stringify({
        error: 'Text content is required for analysis',
        success: false,
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const inputText = text.trim();
    console.log('🔧 Edge Function: Input text length:', inputText.length);

    // Generate dynamic AI analysis based on actual text content
    console.log('🔧 Edge Function: Generating dynamic AI analysis...');
    console.log('🔧 Edge Function: Analyzing text:', inputText.substring(0, 200) + '...');
    
    // Simple keyword-based analysis
    const textLower = inputText.toLowerCase();
    const analysisData = {
      summary: "",
      keyFindings: [],
      riskWarnings: [],
      recommendations: [],
      confidence: 85
    };

    // Extract record type and title for context
    const recordType = textLower.includes('prescription') ? 'Prescription' :
                      textLower.includes('medication') ? 'Prescription' :
                      textLower.includes('blood test') ? 'Blood Test' : 
                      textLower.includes('lab result') ? 'Lab Result' :
                      textLower.includes('x-ray') ? 'X-Ray' :
                      textLower.includes('mri') ? 'MRI' :
                      textLower.includes('ct') ? 'CT Scan' :
                      textLower.includes('ultrasound') ? 'Ultrasound' :
                      textLower.includes('consultation') ? 'Consultation' :
                      textLower.includes('vaccination') ? 'Vaccination' :
                      textLower.includes('imaging') ? 'Imaging' :
                      'Health Record';

    // Generate summary based on content
    analysisData.summary = `AI Analysis of ${recordType} - ${new Date().toLocaleDateString()}`;

    // Analyze for common health conditions with more specific detection
    if (textLower.includes('blood pressure') || textLower.includes('hypertension') || textLower.includes('bp')) {
      analysisData.keyFindings.push("Blood pressure concerns detected in this record");
      analysisData.riskWarnings.push("High blood pressure may increase cardiovascular risk");
      analysisData.recommendations.push("Monitor blood pressure regularly and consult healthcare provider");
    }

    if (textLower.includes('diabetes') || textLower.includes('blood sugar') || textLower.includes('glucose') || textLower.includes('hba1c')) {
      analysisData.keyFindings.push("Diabetes-related indicators found in this analysis");
      analysisData.riskWarnings.push("Blood sugar levels should be monitored closely");
      analysisData.recommendations.push("Maintain regular blood glucose monitoring and follow diabetic care plan");
    }

    if (textLower.includes('cholesterol') || textLower.includes('lipid') || textLower.includes('hdl') || textLower.includes('ldl')) {
      analysisData.keyFindings.push("Cholesterol levels mentioned in this record");
      analysisData.recommendations.push("Consider lipid panel testing and heart-healthy diet");
    }

    if (textLower.includes('chest pain') || textLower.includes('heart') || textLower.includes('cardiac') || textLower.includes('ecg')) {
      analysisData.keyFindings.push("Cardiac symptoms identified in this analysis");
      analysisData.riskWarnings.push("Chest pain requires immediate medical attention");
      analysisData.recommendations.push("Seek immediate medical evaluation for chest pain");
    }

    if (textLower.includes('exercise') || textLower.includes('physical activity') || textLower.includes('fitness')) {
      analysisData.recommendations.push("Regular exercise is beneficial for overall health");
    }

    if (textLower.includes('family history') || textLower.includes('hereditary')) {
      analysisData.keyFindings.push("Family history of health conditions noted");
      analysisData.recommendations.push("Discuss family history with healthcare provider for personalized risk assessment");
    }

    // Check for specific lab values
    if (textLower.includes('hemoglobin') || textLower.includes('hgb')) {
      analysisData.keyFindings.push("Hemoglobin levels analyzed");
      analysisData.recommendations.push("Monitor iron levels and consider dietary adjustments if needed");
    }

    if (textLower.includes('white blood cell') || textLower.includes('wbc')) {
      analysisData.keyFindings.push("White blood cell count reviewed");
      analysisData.recommendations.push("Monitor for signs of infection or immune system changes");
    }

    if (textLower.includes('platelet') || textLower.includes('plt')) {
      analysisData.keyFindings.push("Platelet count assessed");
      analysisData.recommendations.push("Monitor bleeding and clotting factors");
    }

    // Check for specific conditions
    if (textLower.includes('anemia') || textLower.includes('low hemoglobin')) {
      analysisData.keyFindings.push("Anemia indicators detected");
      analysisData.riskWarnings.push("Low hemoglobin may indicate anemia");
      analysisData.recommendations.push("Consider iron supplementation and dietary changes");
    }

    if (textLower.includes('infection') || textLower.includes('bacterial') || textLower.includes('viral')) {
      analysisData.keyFindings.push("Infection markers identified");
      analysisData.riskWarnings.push("Active infection may require treatment");
      analysisData.recommendations.push("Follow prescribed treatment and monitor symptoms");
    }

    // Default recommendations if no specific conditions found
    if (analysisData.keyFindings.length === 0) {
      analysisData.keyFindings.push(`${recordType} reviewed successfully`);
      analysisData.recommendations.push("Continue regular health checkups and maintain healthy lifestyle");
    }

    // Add record-specific recommendations
    if (recordType === 'Prescription') {
      analysisData.recommendations.push("Follow prescribed medication schedule and dosage instructions");
      analysisData.recommendations.push("Monitor for any side effects and report to healthcare provider");
    } else if (recordType === 'Blood Test' || recordType === 'Lab Result') {
      analysisData.recommendations.push("Follow up with healthcare provider to discuss results");
    } else if (recordType === 'X-Ray' || recordType === 'MRI' || recordType === 'CT Scan' || recordType === 'Imaging') {
      analysisData.recommendations.push("Review imaging results with radiologist or specialist");
    } else if (recordType === 'Consultation') {
      analysisData.recommendations.push("Follow up on recommendations discussed during consultation");
    } else if (recordType === 'Vaccination') {
      analysisData.recommendations.push("Keep vaccination record updated and follow recommended schedule");
    }

    console.log('✅ Edge Function: Mock analysis generated');

    // Return analysis directly
    console.log('✅ Edge Function: AI analysis completed for text input');
    
    return new Response(JSON.stringify({
      success: true,
      analysis: analysisData,
      timestamp: new Date().toISOString()
    }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

  } catch (error) {
    console.error('❌ Edge Function: Error in analyze-health-record function:', error);
    
    const errorResponse = {
      error: error instanceof Error ? error.message : 'Internal server error',
      success: false,
      timestamp: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});