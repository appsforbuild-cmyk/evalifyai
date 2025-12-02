import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { title, description, employeeId } = await req.json();

    if (!title || !employeeId) {
      throw new Error('Title and employee ID are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create admin client for storage operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Create user client to get the user ID
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log(`Creating voice session for manager: ${user.id}`);

    // Create voice session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('voice_sessions')
      .insert({
        title,
        description,
        manager_id: user.id,
        employee_id: employeeId,
        status: 'pending'
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      throw new Error('Failed to create voice session');
    }

    console.log(`Session created: ${session.id}`);

    // Generate signed upload URL
    const fileName = `${user.id}/${session.id}.webm`;
    const { data: signedUrl, error: signedUrlError } = await supabaseAdmin.storage
      .from('voice-recordings')
      .createSignedUploadUrl(fileName);

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError);
      throw new Error('Failed to create upload URL');
    }

    console.log(`Signed URL created for: ${fileName}`);

    return new Response(
      JSON.stringify({
        session,
        uploadUrl: signedUrl.signedUrl,
        uploadToken: signedUrl.token,
        uploadPath: fileName
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Create voice session error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
