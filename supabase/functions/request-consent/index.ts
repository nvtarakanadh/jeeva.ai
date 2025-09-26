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
    const { doctor_user_id, patient_email, purpose, expiry_date } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      throw new Error('Supabase service credentials not configured');
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Resolve doctor profile by user_id
    const { data: doctorProfile, error: docErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', doctor_user_id)
      .maybeSingle();
    if (docErr) throw docErr;
    if (!doctorProfile?.id) {
      return new Response(JSON.stringify({ success: false, error: 'Doctor profile not found' }), { status: 404, headers: corsHeaders });
    }

    // Resolve patient profile by email (case-insensitive)
    let { data: patientProfile, error: patErr } = await supabase
      .from('profiles')
      .select('id, user_id')
      .ilike('email', patient_email.trim())
      .maybeSingle();
    if (patErr) throw patErr;

    // If profile missing, try to find auth user and create a minimal profile
    if (!patientProfile?.id) {
      let authUserId: string | null = null;
      let authEmail: string | null = null;
      try {
        const admin = createClient(supabaseUrl, serviceKey);
        const { data: adminUser, error: adminErr } = await admin.auth.admin.getUserByEmail(patient_email.trim());
        if (adminErr) throw adminErr;
        authUserId = adminUser?.user?.id ?? null;
        authEmail = adminUser?.user?.email ?? null;
      } catch (e) {
        console.error('admin.getUserByEmail failed:', e);
      }

      if (authUserId && authEmail) {
        const { data: created, error: createErr } = await supabase
          .from('profiles')
          .insert({
            user_id: authUserId,
            role: 'patient',
            first_name: '',
            last_name: '',
            email: authEmail,
          })
          .select('id')
          .single();
        if (createErr) throw createErr;
        patientProfile = { id: created.id, user_id: authUserId } as any;
      } else {
        return new Response(JSON.stringify({ success: false, error: 'Patient not found' }), { status: 404, headers: corsHeaders });
      }
    }

    const { error: insertErr } = await supabase.from('consent_requests').insert({
      patient_id: patientProfile.id,
      doctor_id: doctorProfile.id,
      purpose: purpose?.trim() || 'Access to health records',
      expiry_date: expiry_date || null,
    });
    if (insertErr) throw insertErr;

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('request-consent error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


