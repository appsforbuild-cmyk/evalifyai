import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface UserImportData {
  email: string;
  full_name: string;
  role: 'employee' | 'manager' | 'hr';
  team?: string;
  department?: string;
  manager_email?: string;
}

interface ImportRequest {
  users: UserImportData[];
  method: 'csv' | 'manual' | 'api';
  sendWelcomeEmails?: boolean;
}

interface ImportResult {
  success: boolean;
  email: string;
  error?: string;
  userId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Check for API key auth first
    const apiKey = req.headers.get('x-api-key');
    let importedBy: string | null = null;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    if (apiKey) {
      // Validate API key
      const keyPrefix = apiKey.substring(0, 8);
      const { data: apiKeyData, error: keyError } = await supabaseAdmin
        .from('admin_api_keys')
        .select('id, created_by, is_active')
        .eq('key_prefix', keyPrefix)
        .eq('is_active', true)
        .maybeSingle();

      if (keyError || !apiKeyData) {
        console.error('Invalid API key:', keyError);
        return new Response(
          JSON.stringify({ error: 'Invalid or inactive API key' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update last used timestamp
      await supabaseAdmin
        .from('admin_api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', apiKeyData.id);

      importedBy = apiKeyData.created_by;
    } else {
      // JWT auth
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authorization required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user is admin or HR
      const { data: roles } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const isAuthorized = roles?.some(r => r.role === 'admin' || r.role === 'hr');
      if (!isAuthorized) {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions. Admin or HR role required.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      importedBy = user.id;
    }

    const { users, method, sendWelcomeEmails = false }: ImportRequest = await req.json();

    if (!users || !Array.isArray(users) || users.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No users provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limit: max 100 users per request
    if (users.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Maximum 100 users per request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${users.length} users for import by ${importedBy}`);

    const results: ImportResult[] = [];
    const validRoles = ['employee', 'manager', 'hr'];

    for (const userData of users) {
      try {
        // Validate email
        if (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
          results.push({ success: false, email: userData.email || 'unknown', error: 'Invalid email format' });
          continue;
        }

        // Validate role
        if (!userData.role || !validRoles.includes(userData.role)) {
          results.push({ success: false, email: userData.email, error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
          continue;
        }

        // Validate full_name
        if (!userData.full_name || userData.full_name.trim().length < 2) {
          results.push({ success: false, email: userData.email, error: 'Full name is required (min 2 characters)' });
          continue;
        }

        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === userData.email);
        
        if (existingUser) {
          results.push({ success: false, email: userData.email, error: 'User already exists' });
          continue;
        }

        // Generate temporary password
        const tempPassword = crypto.randomUUID().substring(0, 12) + 'Aa1!';

        // Create auth user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            full_name: userData.full_name,
          }
        });

        if (createError || !newUser.user) {
          console.error('Error creating user:', createError);
          results.push({ success: false, email: userData.email, error: createError?.message || 'Failed to create user' });
          continue;
        }

        const userId = newUser.user.id;

        // Create profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            user_id: userId,
            email: userData.email,
            full_name: userData.full_name,
            team: userData.team || null,
            org_unit: userData.department || null,
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }

        // Create user role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: userId,
            role: userData.role,
          });

        if (roleError) {
          console.error('Error creating role:', roleError);
        }

        // Add to employees_directory if employee or manager
        if (userData.role === 'employee' || userData.role === 'manager') {
          const { error: directoryError } = await supabaseAdmin
            .from('employees_directory')
            .upsert({
              email: userData.email,
              full_name: userData.full_name,
              team: userData.team || 'Unassigned',
              org_unit: userData.department || null,
            }, { onConflict: 'email' });

          if (directoryError) {
            console.error('Error adding to directory:', directoryError);
          }
        }

        // Send welcome email if requested
        if (sendWelcomeEmails) {
          try {
            const resendApiKey = Deno.env.get('RESEND_API_KEY');
            if (resendApiKey) {
              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${resendApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: 'EvalifyAI <onboarding@resend.dev>',
                  to: [userData.email],
                  subject: 'Welcome to EvalifyAI',
                  html: `
                    <h1>Welcome to EvalifyAI, ${userData.full_name}!</h1>
                    <p>Your account has been created with the following details:</p>
                    <ul>
                      <li><strong>Email:</strong> ${userData.email}</li>
                      <li><strong>Temporary Password:</strong> ${tempPassword}</li>
                      <li><strong>Role:</strong> ${userData.role}</li>
                    </ul>
                    <p>Please log in and change your password immediately.</p>
                  `,
                }),
              });
            }
          } catch (emailError) {
            console.error('Error sending welcome email:', emailError);
          }
        }

        results.push({ success: true, email: userData.email, userId });
      } catch (err) {
        console.error('Unexpected error processing user:', err);
        results.push({ success: false, email: userData.email, error: 'Unexpected error' });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    const errorDetails = results.filter(r => !r.success).map(r => ({ email: r.email, error: r.error }));

    // Record import history
    const { error: historyError } = await supabaseAdmin
      .from('user_import_history')
      .insert({
        imported_by: importedBy,
        method,
        total_count: users.length,
        success_count: successCount,
        error_count: errorCount,
        error_details: errorDetails,
      });

    if (historyError) {
      console.error('Error recording import history:', historyError);
    }

    console.log(`Import complete: ${successCount} success, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        total: users.length,
        successCount,
        errorCount,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Bulk import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
