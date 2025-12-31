import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  invitations: {
    email: string;
    organizationName: string;
    invitedByName: string;
    token?: string;
  }[];
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Send invitation emails function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invitations }: InvitationEmailRequest = await req.json();
    
    if (!invitations || invitations.length === 0) {
      throw new Error("No invitations provided");
    }

    console.log(`Processing ${invitations.length} invitation emails`);
    
    // Log invitations for now - email sending requires RESEND_API_KEY
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured - logging invitations only");
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "Email service not configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Dynamic import for Resend
    const { Resend } = await import("https://esm.sh/resend@2.0.0");
    const resend = new Resend(resendApiKey);
    
    const baseUrl = Deno.env.get("SITE_URL") || "https://evalifyai.com";
    
    const results = await Promise.allSettled(
      invitations.map(async (invitation) => {
        const inviteUrl = `${baseUrl}/invite/${invitation.token || 'TOKEN'}`;
        
        return resend.emails.send({
          from: "EvalifyAI <notifications@resend.dev>",
          to: [invitation.email],
          subject: `You're invited to join ${invitation.organizationName}`,
          html: `<h1>You're invited to join ${invitation.organizationName}</h1><p>${invitation.invitedByName} invited you.</p><a href="${inviteUrl}">Accept Invitation</a>`,
        });
      })
    );

    const successful = results.filter(r => r.status === "fulfilled").length;
    
    return new Response(
      JSON.stringify({ success: true, sent: successful }),
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
