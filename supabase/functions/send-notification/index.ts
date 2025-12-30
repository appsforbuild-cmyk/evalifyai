import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  userId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

const getEmailTemplate = (type: string, title: string, message: string, actionUrl?: string) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #002D62 0%, #63A4FF 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">EvalifyAI</h1>
      </div>
      <div style="padding: 30px; background: #ffffff;">
        <h2 style="color: #002D62;">${title}</h2>
        <p style="color: #555; line-height: 1.6;">${message}</p>
        ${actionUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${actionUrl}" style="background: #002D62; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Details
            </a>
          </div>
        ` : ''}
      </div>
      <div style="padding: 20px; background: #f5f5f5; text-align: center; color: #888; font-size: 12px;">
        <p>You're receiving this email because you have notifications enabled.</p>
        <p>© ${new Date().getFullYear()} EvalifyAI. All rights reserved.</p>
      </div>
    </div>
  `;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: NotificationPayload = await req.json();
    const { userId, type, title, message, actionUrl, metadata } = payload;

    if (!userId || !type || !title || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, type, title, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating notification for user:', userId, 'type:', type);

    // Insert notification into database
    const { data: notification, error: insertError } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        type,
        title,
        message,
        action_url: actionUrl,
        metadata: metadata || {},
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting notification:', insertError);
      throw insertError;
    }

    console.log('Notification created:', notification.id);

    // Check user's notification preferences
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    const shouldSendEmail = preferences 
      ? preferences.email_enabled && (preferences.channels as Record<string, { email: boolean }>)?.[type]?.email !== false
      : true;

    const isRealtime = preferences?.frequency === 'real-time' || !preferences;
    let emailSent = false;

    // Send email notification if enabled and real-time
    if (shouldSendEmail && isRealtime && resendApiKey) {
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        const userEmail = userData?.user?.email;

        if (userEmail) {
          const resend = new Resend(resendApiKey);
          
          await resend.emails.send({
            from: 'EvalifyAI <notifications@resend.dev>',
            to: [userEmail],
            subject: `${title} - EvalifyAI`,
            html: getEmailTemplate(type, title, message, actionUrl),
          });

          console.log('Email sent to:', userEmail);
          emailSent = true;
        }
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, notification, emailSent }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Send notification error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
