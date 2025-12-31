import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyDomainRequest {
  domain: string;
  organizationId: string;
}

// Simple DNS check using public DNS-over-HTTPS
async function checkDnsRecord(domain: string, type: 'CNAME' | 'TXT'): Promise<{ found: boolean; value?: string }> {
  try {
    const response = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`,
      { headers: { 'Accept': 'application/dns-json' } }
    );
    
    if (!response.ok) return { found: false };
    
    const data = await response.json();
    
    if (data.Answer && data.Answer.length > 0) {
      return { found: true, value: data.Answer[0].data };
    }
    
    return { found: false };
  } catch (error) {
    console.error(`DNS check failed for ${domain}:`, error);
    return { found: false };
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Verify custom domain function called");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain, organizationId }: VerifyDomainRequest = await req.json();
    
    if (!domain || !organizationId) {
      throw new Error("Missing domain or organizationId");
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?$/;
    if (!domainRegex.test(domain)) {
      throw new Error("Invalid domain format");
    }

    console.log(`Verifying domain: ${domain} for org: ${organizationId}`);

    // Check CNAME record
    const cnameCheck = await checkDnsRecord(domain, 'CNAME');
    console.log("CNAME check:", cnameCheck);
    
    const expectedCname = 'cname.evalifyai.com';
    const cnameValid = cnameCheck.found && cnameCheck.value?.includes('evalifyai');

    // Check TXT record for verification
    const txtCheck = await checkDnsRecord(`_evalify.${domain}`, 'TXT');
    console.log("TXT check:", txtCheck);
    
    const expectedTxtValue = `verify=${organizationId.slice(0, 8)}`;
    const txtValid = txtCheck.found && txtCheck.value?.includes(organizationId.slice(0, 8));

    const verified = cnameValid && txtValid;

    if (verified) {
      // Update organization with custom domain
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error } = await supabase
        .from('organizations')
        .update({ domain })
        .eq('id', organizationId);

      if (error) {
        console.error("Failed to update organization domain:", error);
        throw error;
      }

      console.log(`Domain ${domain} verified and saved for organization ${organizationId}`);
    }

    return new Response(
      JSON.stringify({
        verified,
        checks: {
          cname: { valid: cnameValid, found: cnameCheck.found, expected: expectedCname },
          txt: { valid: txtValid, found: txtCheck.found, expected: expectedTxtValue },
        },
        message: verified 
          ? "Domain verified successfully!" 
          : "DNS records not found. Please check your configuration.",
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message, verified: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
