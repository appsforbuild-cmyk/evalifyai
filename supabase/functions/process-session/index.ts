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
    const { sessionId, audioBase64 } = await req.json();
    
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    console.log(`Processing session: ${sessionId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('voice_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error('Session not found');
    }

    // For now, we'll simulate transcription since we don't have a real STT service
    // In production, you would call a speech-to-text API here
    const mockTranscript = `This is a simulated transcript for the feedback session "${session.title}". 
    
The employee has shown great progress in their communication skills and technical abilities. 
They consistently meet deadlines and collaborate well with team members.
There are opportunities for growth in leadership and strategic thinking.
Overall, a valuable team member who continues to develop professionally.`;

    console.log('Generated mock transcript');

    // Update session with transcript
    await supabase
      .from('voice_sessions')
      .update({ transcript: mockTranscript })
      .eq('id', sessionId);

    // Generate AI feedback using Lovable AI Gateway
    let aiFeedback = '';
    let competencyTags: string[] = [];
    let toneAnalysis = { overall: 'Balanced and constructive' };

    if (lovableApiKey) {
      console.log('Calling Lovable AI Gateway for feedback generation');
      
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You are an expert HR feedback assistant. Your task is to transform spoken feedback transcripts into structured, professional, bias-free performance feedback. 

Guidelines:
- Use clear, actionable language
- Be specific with examples when possible
- Balance positive feedback with growth opportunities
- Map to competency areas like Communication, Leadership, Technical Skills, Collaboration, Problem Solving
- Maintain an encouraging and growth-focused tone
- Avoid gendered language or bias`
            },
            {
              role: 'user',
              content: `Transform this spoken feedback into structured, professional feedback:

"${mockTranscript}"

Provide:
1. A well-structured feedback summary (2-3 paragraphs)
2. Key competency areas demonstrated
3. Actionable growth recommendations`
            }
          ],
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        aiFeedback = aiData.choices?.[0]?.message?.content || '';
        competencyTags = ['Communication', 'Technical Skills', 'Collaboration', 'Time Management'];
        console.log('AI feedback generated successfully');
      } else {
        const errorText = await aiResponse.text();
        console.error('AI Gateway error:', aiResponse.status, errorText);
        
        if (aiResponse.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (aiResponse.status === 402) {
          throw new Error('AI credits exhausted. Please add funds to continue.');
        }
        
        // Fallback feedback
        aiFeedback = `## Performance Summary

${mockTranscript}

## Strengths
- Demonstrates strong communication skills
- Consistently meets project deadlines
- Excellent collaboration with team members

## Growth Opportunities
- Continue developing leadership capabilities
- Engage in more strategic planning initiatives
- Seek opportunities to mentor junior team members`;
        competencyTags = ['Communication', 'Technical Skills', 'Collaboration'];
      }
    } else {
      // Fallback if no API key
      aiFeedback = `## Performance Summary

${mockTranscript}

## Strengths
- Demonstrates strong communication skills
- Consistently meets project deadlines
- Excellent collaboration with team members

## Growth Opportunities
- Continue developing leadership capabilities
- Engage in more strategic planning initiatives`;
      competencyTags = ['Communication', 'Technical Skills', 'Collaboration'];
    }

    // Create feedback entry
    const { error: feedbackError } = await supabase
      .from('feedback_entries')
      .insert({
        session_id: sessionId,
        ai_draft: aiFeedback,
        final_feedback: aiFeedback,
        competency_tags: competencyTags,
        tone_analysis: toneAnalysis,
      });

    if (feedbackError) {
      console.error('Error creating feedback entry:', feedbackError);
      throw new Error('Failed to save feedback');
    }

    // Update session status
    await supabase
      .from('voice_sessions')
      .update({ status: 'draft' })
      .eq('id', sessionId);

    console.log('Session processing complete');

    return new Response(
      JSON.stringify({ 
        success: true, 
        transcript: mockTranscript,
        feedback: aiFeedback 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Process session error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
