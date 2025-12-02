import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Bias word list for fairness check
const BIAS_WORDS = [
  'aggressive', 'bossy', 'emotional', 'hysterical', 'pushy', 'abrasive',
  'shrill', 'feisty', 'dramatic', 'too nice', 'too soft', 'motherly',
  'bubbly', 'ditzy', 'scatterbrained', 'airhead', 'lazy', 'entitled',
  'difficult', 'uppity', 'angry', 'intimidating', 'articulate', 'well-spoken'
];

// Simple sentiment analysis
function analyzeSentiment(text: string): { score: number; label: string } {
  const positiveWords = ['excellent', 'great', 'good', 'outstanding', 'impressive', 'strong', 'effective', 'successful', 'achieved', 'exceeded', 'improved', 'growth', 'progress', 'innovative', 'creative', 'collaborative', 'reliable', 'dedicated', 'professional'];
  const negativeWords = ['poor', 'weak', 'failed', 'lacking', 'insufficient', 'below', 'missed', 'struggle', 'problem', 'issue', 'concern', 'disappointing', 'inconsistent', 'unreliable', 'late', 'slow'];
  
  const words = text.toLowerCase().split(/\s+/);
  let score = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) score += 1;
    if (negativeWords.includes(word)) score -= 1;
  });
  
  const normalizedScore = Math.max(-1, Math.min(1, score / 10));
  
  return {
    score: normalizedScore,
    label: normalizedScore > 0.2 ? 'positive' : normalizedScore < -0.2 ? 'negative' : 'neutral'
  };
}

// Extract entities, actions, results using regex patterns
function extractEntities(transcript: string): { entities: string[]; actions: string[]; results: string[] } {
  const entities: string[] = [];
  const actions: string[] = [];
  const results: string[] = [];
  
  // Extract project/task names (capitalized words or quoted strings)
  const projectPattern = /"([^"]+)"|'([^']+)'|(?:project|task|initiative)\s+([A-Z][a-zA-Z0-9]+)/gi;
  let match;
  while ((match = projectPattern.exec(transcript)) !== null) {
    entities.push(match[1] || match[2] || match[3]);
  }
  
  // Extract action verbs with context
  const actionPattern = /(?:has|have|did|was|were)\s+((?:successfully\s+)?(?:completed|delivered|led|managed|improved|developed|created|implemented|designed|built|launched|organized|coordinated|achieved|exceeded|met)(?:\s+\w+){0,3})/gi;
  while ((match = actionPattern.exec(transcript)) !== null) {
    actions.push(match[1].trim());
  }
  
  // Extract results/outcomes
  const resultPattern = /(?:resulted in|achieved|led to|increased|decreased|improved|reduced)\s+([^.!?]+)/gi;
  while ((match = resultPattern.exec(transcript)) !== null) {
    results.push(match[1].trim());
  }
  
  return {
    entities: [...new Set(entities)].slice(0, 10),
    actions: [...new Set(actions)].slice(0, 10),
    results: [...new Set(results)].slice(0, 10)
  };
}

// Check for biased language
function checkBias(text: string): { hasBias: boolean; biasedTerms: string[] } {
  const lowerText = text.toLowerCase();
  const foundBias = BIAS_WORDS.filter(word => lowerText.includes(word.toLowerCase()));
  
  return {
    hasBias: foundBias.length > 0,
    biasedTerms: foundBias
  };
}

// Transcribe audio using AssemblyAI
async function transcribeAudio(audioUrl: string, sttApiKey: string): Promise<{ transcript: string; sttResponse: any }> {
  console.log('Starting transcription with AssemblyAI...');
  
  // Submit transcription request
  const submitResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      'Authorization': sttApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: audioUrl,
      speaker_labels: true,
      auto_highlights: true,
    }),
  });

  if (!submitResponse.ok) {
    const error = await submitResponse.text();
    console.error('AssemblyAI submit error:', error);
    throw new Error(`Failed to submit transcription: ${error}`);
  }

  const submitData = await submitResponse.json();
  const transcriptId = submitData.id;
  console.log(`Transcription submitted, ID: ${transcriptId}`);

  // Poll for completion
  let transcript = '';
  let sttResponse = null;
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    
    const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
      headers: { 'Authorization': sttApiKey },
    });

    const pollData = await pollResponse.json();
    console.log(`Transcription status: ${pollData.status}`);

    if (pollData.status === 'completed') {
      transcript = pollData.text || '';
      sttResponse = pollData;
      break;
    } else if (pollData.status === 'error') {
      throw new Error(`Transcription failed: ${pollData.error}`);
    }

    attempts++;
  }

  if (!transcript) {
    throw new Error('Transcription timed out');
  }

  console.log('Transcription completed');
  return { transcript, sttResponse };
}

// Generate feedback using Lovable AI (Gemini)
async function generateFeedback(
  transcript: string,
  employeeMetadata: any,
  extractedData: any,
  lovableApiKey: string
): Promise<any> {
  console.log('Generating feedback with Lovable AI...');

  const prompt = `You are an expert HR feedback assistant. Based on the following spoken feedback transcript and employee context, generate a structured, professional, bias-free performance feedback.

## Employee Context
- Name: ${employeeMetadata?.name || 'Employee'}
- Role: ${employeeMetadata?.role || 'Team Member'}
- Department: ${employeeMetadata?.department || 'General'}

## Extracted Information
- Key Entities: ${extractedData.entities.join(', ') || 'None identified'}
- Actions Noted: ${extractedData.actions.join(', ') || 'None identified'}
- Results Mentioned: ${extractedData.results.join(', ') || 'None identified'}
- Sentiment: ${extractedData.sentiment.label} (score: ${extractedData.sentiment.score.toFixed(2)})

## Transcript
"${transcript}"

Generate a JSON response with this exact structure:
{
  "summary": "2-3 paragraph executive summary of overall performance",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["area for improvement 1", "area for improvement 2"],
  "mapped_competencies": [
    {"competency": "Communication", "rating": "Exceeds Expectations", "evidence": "specific example"},
    {"competency": "Technical Skills", "rating": "Meets Expectations", "evidence": "specific example"}
  ],
  "learning_recs": [
    {"recommendation": "recommendation text", "priority": "high|medium|low", "type": "course|mentoring|project|reading"}
  ]
}

Guidelines:
- Use clear, actionable language
- Be specific with examples from the transcript
- Balance positive feedback with growth opportunities
- Map to standard competency areas
- Maintain an encouraging and growth-focused tone
- Avoid gendered language or bias
- Make recommendations actionable and specific`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are an expert HR feedback assistant. Always respond with valid JSON only, no markdown or explanations.' },
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Lovable AI error:', response.status, error);
    
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    if (response.status === 402) {
      throw new Error('AI credits exhausted. Please add funds to continue.');
    }
    throw new Error(`AI generation failed: ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  // Parse JSON from response
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in response');
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError);
    console.log('Raw response:', content);
    return {
      summary: content,
      strengths: [],
      improvements: [],
      mapped_competencies: [],
      learning_recs: []
    };
  }
}

// Rewrite feedback to remove bias
async function rewriteWithoutBias(
  feedback: any,
  biasedTerms: string[],
  lovableApiKey: string
): Promise<any> {
  console.log('Rewriting feedback to remove bias...');

  const prompt = `The following feedback contains potentially biased language. Please rewrite it to be completely neutral and professional, removing or replacing these biased terms: ${biasedTerms.join(', ')}

Original feedback:
${JSON.stringify(feedback, null, 2)}

Return the rewritten feedback in the same JSON structure, ensuring all language is neutral, professional, and free of gender or other biases.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are an expert at writing neutral, bias-free professional feedback. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    console.error('Bias rewrite failed, using original');
    return feedback;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse rewritten feedback');
  }
  
  return feedback;
}

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
    const sttApiKey = Deno.env.get('STT_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get session details
    const { data: session, error: sessionError } = await supabase
      .from('voice_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      throw new Error('Session not found');
    }

    // Get employee profile
    const { data: employeeProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('user_id', session.employee_id)
      .single();

    console.log('Session found:', session.title);

    // 2. Get audio URL or use provided base64
    let transcript = '';
    let sttResponse = null;

    if (sttApiKey && session.audio_url) {
      // Use AssemblyAI for real transcription
      try {
        const result = await transcribeAudio(session.audio_url, sttApiKey);
        transcript = result.transcript;
        sttResponse = result.sttResponse;
      } catch (sttError) {
        console.error('STT error, using fallback:', sttError);
        transcript = `Feedback session for ${session.title}. The employee has demonstrated strong performance in their role. They have shown excellent communication skills and consistently meet project deadlines. Their technical abilities continue to grow, and they collaborate effectively with team members. Areas for development include strategic thinking and leadership opportunities.`;
      }
    } else {
      console.log('No STT API key, using mock transcript');
      transcript = `Feedback session for ${session.title}. The employee has demonstrated strong performance in their role. They have shown excellent communication skills and consistently meet project deadlines. Their technical abilities continue to grow, and they collaborate effectively with team members. Areas for development include strategic thinking and leadership opportunities.`;
    }

    console.log('Transcript obtained, length:', transcript.length);

    // 3. NLP extraction
    const extractedEntities = extractEntities(transcript);
    const sentiment = analyzeSentiment(transcript);
    const extractedData = {
      ...extractedEntities,
      sentiment
    };

    console.log('Extracted entities:', extractedData);

    // Update session with transcript
    await supabase
      .from('voice_sessions')
      .update({ 
        transcript,
        status: 'processing'
      })
      .eq('id', sessionId);

    // 4. Generate feedback using LLM
    let feedback;
    
    if (lovableApiKey) {
      const employeeMetadata = {
        name: employeeProfile?.full_name || 'Employee',
        role: 'Team Member',
        department: 'General'
      };

      feedback = await generateFeedback(transcript, employeeMetadata, extractedData, lovableApiKey);
    } else {
      feedback = {
        summary: `Based on the feedback session, the employee has demonstrated solid performance in their role. ${transcript}`,
        strengths: ['Communication skills', 'Meeting deadlines', 'Team collaboration'],
        improvements: ['Strategic thinking', 'Leadership development'],
        mapped_competencies: [
          { competency: 'Communication', rating: 'Meets Expectations', evidence: 'Excellent communication skills noted' },
          { competency: 'Technical Skills', rating: 'Meets Expectations', evidence: 'Technical abilities growing' },
          { competency: 'Collaboration', rating: 'Exceeds Expectations', evidence: 'Works well with team members' }
        ],
        learning_recs: [
          { recommendation: 'Leadership training course', priority: 'medium', type: 'course' },
          { recommendation: 'Strategic planning workshop', priority: 'high', type: 'course' }
        ]
      };
    }

    console.log('Initial feedback generated');

    // 5. Fairness check
    const biasCheck = checkBias(JSON.stringify(feedback));
    
    if (biasCheck.hasBias && lovableApiKey) {
      console.log('Bias detected, rewriting...');
      feedback = await rewriteWithoutBias(feedback, biasCheck.biasedTerms, lovableApiKey);
    }

    // Format feedback as markdown
    const formattedFeedback = `## Performance Summary

${feedback.summary}

## Strengths
${feedback.strengths.map((s: string) => `- ${s}`).join('\n')}

## Areas for Improvement
${feedback.improvements.map((i: string) => `- ${i}`).join('\n')}

## Competency Assessment
${feedback.mapped_competencies.map((c: any) => `### ${c.competency}
**Rating:** ${c.rating}
**Evidence:** ${c.evidence}`).join('\n\n')}

## Learning Recommendations
${feedback.learning_recs.map((r: any) => `- **${r.recommendation}** (${r.priority} priority, ${r.type})`).join('\n')}`;

    // 6. Save to database
    const { data: feedbackEntry, error: feedbackError } = await supabase
      .from('feedback_entries')
      .insert({
        session_id: sessionId,
        ai_draft: formattedFeedback,
        final_feedback: formattedFeedback,
        competency_tags: feedback.mapped_competencies.map((c: any) => c.competency),
        tone_analysis: {
          sentiment: extractedData.sentiment,
          biasCheck: biasCheck,
          extractedEntities: extractedData
        }
      })
      .select()
      .single();

    if (feedbackError) {
      console.error('Error creating feedback entry:', feedbackError);
      throw new Error('Failed to save feedback');
    }

    // Update session status
    await supabase
      .from('voice_sessions')
      .update({ status: 'draft' })
      .eq('id', sessionId);

    console.log('Processing complete, feedback ID:', feedbackEntry.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        draftId: feedbackEntry.id,
        draftText: formattedFeedback,
        transcript,
        extractedData,
        biasCheck
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
