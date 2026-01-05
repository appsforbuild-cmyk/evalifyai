import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BrandedEmailRequest {
  toEmail: string;
  subject: string;
  templateName: string;
  variables: Record<string, string>;
  organizationId: string;
}

const getBaseTemplate = (logoUrl: string, primaryColor: string, platformName: string, content: string, footerContent: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${platformName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 30px; text-align: center; background: linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd);">
              ${logoUrl ? `<img src="${logoUrl}" alt="${platformName}" style="max-height: 40px; max-width: 200px;">` : `<span style="color: white; font-size: 24px; font-weight: bold;">${platformName}</span>`}
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #fafafa; border-top: 1px solid #e4e4e7;">
              ${footerContent ? `<p style="margin: 0 0 10px; color: #71717a; font-size: 13px;">${footerContent}</p>` : ''}
              <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                <a href="{{unsubscribe_url}}" style="color: #a1a1aa;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const templates: Record<string, (vars: Record<string, string>, primaryColor: string) => string> = {
  welcome: (vars, primaryColor) => `
    <h1 style="margin: 0 0 20px; color: #18181b; font-size: 24px;">Welcome to ${vars.platform_name}!</h1>
    <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.6;">
      Hi ${vars.user_name},<br><br>
      Your account has been created and you're ready to start using ${vars.platform_name}.
    </p>
    <a href="${vars.login_url}" style="display: inline-block; padding: 14px 28px; background-color: ${primaryColor}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
      Get Started
    </a>
  `,
  feedback_notification: (vars, primaryColor) => `
    <h1 style="margin: 0 0 20px; color: #18181b; font-size: 24px;">New Feedback Available</h1>
    <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.6;">
      Hi ${vars.user_name},<br><br>
      ${vars.sender_name} has shared feedback with you on ${vars.platform_name}.
    </p>
    <a href="${vars.feedback_url}" style="display: inline-block; padding: 14px 28px; background-color: ${primaryColor}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
      View Feedback
    </a>
  `,
  trial_reminder: (vars, primaryColor) => `
    <h1 style="margin: 0 0 20px; color: #18181b; font-size: 24px;">Your Trial Ends in ${vars.days_left} Days</h1>
    <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.6;">
      Hi ${vars.user_name},<br><br>
      Your ${vars.platform_name} trial will expire on ${vars.expiry_date}. Subscribe now to keep access to all features.
    </p>
    <a href="${vars.upgrade_url}" style="display: inline-block; padding: 14px 28px; background-color: ${primaryColor}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
      Subscribe Now
    </a>
  `,
  organization_welcome: (vars, primaryColor) => `
    <h1 style="margin: 0 0 20px; color: #18181b; font-size: 24px;">Welcome to ${vars.platform_name}!</h1>
    <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.6;">
      Hi ${vars.admin_name},<br><br>
      Your organization <strong>${vars.organization_name}</strong> has been successfully created on ${vars.platform_name}.
    </p>
    <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.6;">
      Your team can now access the platform using your custom branded login page:
    </p>
    <div style="margin: 0 0 20px; padding: 16px; background-color: #f4f4f5; border-radius: 8px;">
      <p style="margin: 0; font-size: 14px; color: #71717a;">Your Login URL:</p>
      <a href="${vars.login_url}" style="color: ${primaryColor}; font-weight: 600; word-break: break-all;">${vars.login_url}</a>
    </div>
    <a href="${vars.login_url}" style="display: inline-block; padding: 14px 28px; background-color: ${primaryColor}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
      Access Your Platform
    </a>
    <p style="margin: 20px 0 0; color: #71717a; font-size: 14px;">
      Share this URL with your team members to give them access to the platform.
    </p>
  `,
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Send branded email function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { toEmail, subject, templateName, variables, organizationId }: BrandedEmailRequest = await req.json();
    
    if (!toEmail || !templateName || !organizationId) {
      throw new Error("Missing required fields");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch organization branding
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('name, logo_url, primary_color')
      .eq('id', organizationId)
      .single();

    if (orgError) throw orgError;

    // Fetch organization settings for additional branding
    const { data: settings } = await supabase
      .from('organization_settings')
      .select('custom_branding')
      .eq('organization_id', organizationId)
      .single();

    const customBranding = (settings?.custom_branding as Record<string, unknown>) || {};
    const platformName = (customBranding.platform_name as string) || org.name || 'EvalifyAI';
    const primaryColor = org.primary_color || '#6366f1';
    const logoUrl = org.logo_url || '';
    const footerContent = (customBranding.email_footer_content as string) || '';

    // Get template content
    const templateFn = templates[templateName];
    if (!templateFn) {
      throw new Error(`Unknown template: ${templateName}`);
    }

    const templateVars = { ...variables, platform_name: platformName };
    const content = templateFn(templateVars, primaryColor);
    const htmlEmail = getBaseTemplate(logoUrl, primaryColor, platformName, content, footerContent);

    // Send email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: true, message: "Email service not configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { Resend } = await import("https://esm.sh/resend@2.0.0");
    const resend = new Resend(resendApiKey);

    const emailResult = await resend.emails.send({
      from: `${platformName} <notifications@resend.dev>`,
      to: [toEmail],
      subject: subject || `Message from ${platformName}`,
      html: htmlEmail,
    });

    console.log("Email sent:", emailResult);

    return new Response(
      JSON.stringify({ success: true, result: emailResult }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
