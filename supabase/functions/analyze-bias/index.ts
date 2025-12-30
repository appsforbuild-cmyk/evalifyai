import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BIAS_ANALYSIS_PROMPT = `You are an expert HR bias detection system. Analyze the following text for potential biases in performance feedback context.

Detect these bias types:
1. GENDER_BIAS: Gendered language, stereotypes (e.g., "bossy" for women, "aggressive" for men), assumptions about work-life balance
2. AGE_BIAS: References to age, energy levels, technology adaptability, "old school" vs "fresh perspective"
3. RECENCY_BIAS: Overweighting recent events, ignoring consistent performance history
4. HALO_HORN_EFFECT: Letting one positive/negative trait dominate the entire assessment
5. ATTRIBUTION_BIAS: Attributing success to luck vs skill inconsistently, external factors vs personal ability
6. VAGUE_LANGUAGE: Non-specific language that lacks actionable feedback (e.g., "good attitude", "needs improvement")

For each issue found, provide:
- type: The bias type from above
- severity: "low", "medium", or "high"
- text: The exact problematic text
- suggestion: A specific, unbiased alternative
- position: {start, end} character positions in original text
- explanation: Brief explanation of why this is problematic

Calculate an overall fairness score (0-100):
- 100: No bias detected, specific and actionable
- 80-99: Minor vague language, easily fixable
- 60-79: Some bias present, needs revision
- 40-59: Significant bias, major revision needed
- 0-39: Severe bias, should not be published

Context: {context}

Text to analyze:
"{text}"

Return ONLY valid JSON with this exact structure:
{
  "overallScore": number,
  "issues": [
    {
      "type": "GENDER_BIAS" | "AGE_BIAS" | "RECENCY_BIAS" | "HALO_HORN_EFFECT" | "ATTRIBUTION_BIAS" | "VAGUE_LANGUAGE",
      "severity": "low" | "medium" | "high",
      "text": "exact text from input",
      "suggestion": "improved alternative",
      "position": {"start": number, "end": number},
      "explanation": "why this is problematic"
    }
  ],
  "suggestions": ["array of general improvement suggestions"],
  "summary": "brief overall assessment"
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, context = "performance review" } = await req.json();

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ 
          overallScore: 100, 
          issues: [], 
          suggestions: [],
          summary: "No text to analyze" 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = BIAS_ANALYSIS_PROMPT
      .replace("{context}", context)
      .replace("{text}", text.replace(/"/g, '\\"'));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a bias detection expert. Always respond with valid JSON only, no markdown or extra text." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "API credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from response, handling potential markdown code blocks
    let analysisResult;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      analysisResult = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Return a default response if parsing fails
      analysisResult = {
        overallScore: 85,
        issues: [],
        suggestions: ["Consider adding more specific examples to your feedback."],
        summary: "Analysis completed with limited results."
      };
    }

    // Validate and ensure proper structure
    const result = {
      overallScore: Math.max(0, Math.min(100, analysisResult.overallScore ?? 85)),
      issues: Array.isArray(analysisResult.issues) ? analysisResult.issues : [],
      suggestions: Array.isArray(analysisResult.suggestions) ? analysisResult.suggestions : [],
      summary: analysisResult.summary || "Analysis complete."
    };

    console.log("Bias analysis completed:", { 
      textLength: text.length, 
      score: result.overallScore, 
      issueCount: result.issues.length 
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in analyze-bias function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        overallScore: 85,
        issues: [],
        suggestions: [],
        summary: "Analysis failed, please try again."
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
