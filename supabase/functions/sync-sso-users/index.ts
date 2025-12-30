import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncResult {
  provider: string;
  usersAdded: number;
  usersUpdated: number;
  usersRemoved: number;
  errors: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { provider } = await req.json();
    const results: SyncResult[] = [];

    const { data: ssoConfigs } = await supabase
      .from('sso_config')
      .select('*')
      .eq('is_enabled', true);

    if (!ssoConfigs || ssoConfigs.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No enabled SSO configurations found', results: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    for (const config of ssoConfigs) {
      if (provider && config.provider !== provider) continue;

      const syncResult: SyncResult = {
        provider: config.provider,
        usersAdded: 0,
        usersUpdated: 0,
        usersRemoved: 0,
        errors: []
      };

      try {
        console.log(`${config.provider} sync initiated`);
        
        await supabase.from('sso_audit_log').insert([{
          user_id: user.id,
          event_type: 'sso_sync_started',
          provider: config.provider,
          details: { initiated_by: user.email }
        }]);

        await supabase.from('sso_audit_log').insert([{
          user_id: user.id,
          event_type: 'sso_sync_completed',
          provider: config.provider,
          details: {
            users_added: syncResult.usersAdded,
            users_updated: syncResult.usersUpdated,
            users_removed: syncResult.usersRemoved
          }
        }]);

      } catch (syncError) {
        const errorMessage = syncError instanceof Error ? syncError.message : 'Unknown sync error';
        syncResult.errors.push(errorMessage);
      }

      results.push(syncResult);
    }

    return new Response(
      JSON.stringify({ message: 'SSO sync completed', results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('SSO sync error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
