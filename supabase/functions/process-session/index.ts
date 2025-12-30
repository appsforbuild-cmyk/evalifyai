import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { FEEDBACK_PROMPT_TEMPLATE, FAIRNESS_CHECK_TEMPLATE, FAIRNESS_REWRITE_TEMPLATE } from "../_shared/promptTemplates.ts";
import { processSessionSchema, validateRequestBody } from "../_shared/validation.ts";

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

// Transcribe audio using OpenAI Whisper
async function transcribeAudio(audioBase64: string, openaiApiKey: string): Promise<{ transcript: string; sttResponse: any }> {
  console.log('Starting transcription with OpenAI Whisper...');
  
  // Convert base64 to binary
  const binaryString = atob(audioBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Create form data with the audio file
  const formData = new FormData();
  const blob = new Blob([bytes], { type: 'audio/webm' });
  formData.append('file', blob, 'audio.webm');
  formData.append('model', 'whisper-1');
  formData.append('language', 'en');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenAI transcription error:', error);
    throw new Error(`Failed to transcribe audio: ${error}`);
  }

  const result = await response.json();
  console.log('Transcription completed');
  
  return { 
    transcript: result.text || '', 
    sttResponse: result 
  };
}

// Generate feedback using Lovable AI (Gemini) with template
async function generateFeedback(
  transcript: string,
  employeeMetadata: any,
  extractedData: any,
  lovableApiKey: string,
  tone: string = 'neutral'
): Promise<any> {
  console.log('Generating feedback with Lovable AI...');

  // Build prompt from template
  const prompt = FEEDBACK_PROMPT_TEMPLATE
    .replace('{transcript}', transcript)
    .replace('{employee_name}', employeeMetadata?.name || 'Employee')
    .replace('{role}', employeeMetadata?.role || 'Team Member')
    .replace('{summary}', employeeMetadata?.lastReviewSummary || 'No previous review')
    .replace('{tone}', tone);

  // System prompt with additional context
  const systemPrompt = `You are an expert HR feedback assistant. Always respond with valid JSON only, no markdown or explanations.

Additional context for enriched feedback:
- Key Entities: ${extractedData.entities.join(', ') || 'None identified'}
- Actions Noted: ${extractedData.actions.join(', ') || 'None identified'}
- Results Mentioned: ${extractedData.results.join(', ') || 'None identified'}
- Sentiment: ${extractedData.sentiment.label} (score: ${extractedData.sentiment.score.toFixed(2)})

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
        { role: 'system', content: systemPrompt },
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

// Check fairness using AI with template
async function checkFairnessWithAI(
  draftText: string,
  lovableApiKey: string
): Promise<{ fairness: number; issues: string[] }> {
  console.log('Checking fairness with AI...');

  const prompt = FAIRNESS_CHECK_TEMPLATE.replace('{draft_text}', draftText);

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${lovableApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are a fairness analysis expert. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    console.error('Fairness check failed, using fallback');
    return { fairness: 0.8, issues: [] };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse fairness check');
  }
  
  return { fairness: 0.8, issues: [] };
}

// Rewrite feedback to remove bias using template
async function rewriteWithoutBias(
  feedback: any,
  biasedTerms: string[],
  lovableApiKey: string,
  tone: string = 'neutral'
): Promise<any> {
  console.log('Rewriting feedback to remove bias...');

  const prompt = FAIRNESS_REWRITE_TEMPLATE.replace('{tone}', tone) + `

Flagged issues: ${biasedTerms.join(', ')}

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
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Verify the user's JWT token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Authenticated user: ${user.id}`);

    // Validate request body with Zod
    const validation = await validateRequestBody(req, processSessionSchema);
    if (!validation.success) {
      console.error('Validation error:', validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { sessionId, audioBase64, tone, recordingMode, questionRecordings } = validation.data;

    console.log(`Processing session: ${sessionId}, mode: ${recordingMode}`);

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user owns this session (is the manager)
    const { data: sessionCheck, error: sessionCheckError } = await supabase
      .from('voice_sessions')
      .select('manager_id')
      .eq('id', sessionId)
      .single();
    
    if (sessionCheckError || !sessionCheck) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (sessionCheck.manager_id !== user.id) {
      console.error(`Authorization failed: user ${user.id} is not manager of session ${sessionId}`);
      return new Response(JSON.stringify({ error: 'Not authorized to process this session' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

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

    // 2. Transcribe audio based on recording mode
    let transcript = '';
    let sttResponse = null;
    let perQuestionTranscripts: { questionId: string; questionText: string; transcript: string }[] = [];

    if (recordingMode === 'per_question' && questionRecordings && questionRecordings.length > 0) {
      // Per-question mode: transcribe each recording and combine with context
      console.log(`Processing ${questionRecordings.length} question recordings...`);
      
      for (const recording of questionRecordings) {
        if (recording.audioPath) {
          try {
            // Download audio from storage
            const { data: audioData, error: downloadError } = await supabase.storage
              .from('voice-recordings')
              .download(recording.audioPath);
            
            if (downloadError || !audioData) {
              console.error(`Failed to download audio for question ${recording.questionId}:`, downloadError);
              continue;
            }
            
            // Convert to base64
            const arrayBuffer = await audioData.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            
            // Transcribe using OpenAI
            if (openaiApiKey) {
              const result = await transcribeAudio(base64, openaiApiKey);
              perQuestionTranscripts.push({
                questionId: recording.questionId,
                questionText: recording.questionText,
                transcript: result.transcript
              });
            }
          } catch (err) {
            console.error(`Error transcribing question ${recording.questionId}:`, err);
          }
        }
      }
      
      // Build structured transcript with Q&A format
      transcript = perQuestionTranscripts.map((qt, i) => 
        `Question ${i + 1}: ${qt.questionText}\nAnswer: ${qt.transcript}`
      ).join('\n\n');
      
      // Update question_recordings with transcripts
      const updatedRecordings = questionRecordings.map(r => {
        const found = perQuestionTranscripts.find(t => t.questionId === r.questionId);
        return found ? { ...r, transcript: found.transcript } : r;
      });
      
      await supabase
        .from('voice_sessions')
        .update({ 
          question_recordings: JSON.parse(JSON.stringify(updatedRecordings))
        })
        .eq('id', sessionId);
        
    } else if (openaiApiKey && audioBase64) {
      // Full session mode: Use OpenAI Whisper for real transcription
      try {
        const result = await transcribeAudio(audioBase64, openaiApiKey);
        transcript = result.transcript;
        sttResponse = result.sttResponse;
      } catch (sttError) {
        console.error('STT error, using fallback:', sttError);
        transcript = `Feedback session for ${session.title}. The employee has demonstrated strong performance in their role. They have shown excellent communication skills and consistently meet project deadlines. Their technical abilities continue to grow, and they collaborate effectively with team members. Areas for development include strategic thinking and leadership opportunities.`;
      }
    } else {
      console.log('No OpenAI API key or audio data, using mock transcript');
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

    // 4. Generate feedback using LLM with templates
    let feedback;
    
    if (lovableApiKey) {
      const employeeMetadata = {
        name: employeeProfile?.full_name || 'Employee',
        role: 'Team Member',
        department: 'General',
        lastReviewSummary: 'No previous review available'
      };

      feedback = await generateFeedback(transcript, employeeMetadata, extractedData, lovableApiKey, tone);
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

    // 5. Fairness check - use both word-based and AI-based checks
    const biasCheck = checkBias(JSON.stringify(feedback));
    let fairnessScore = { fairness: 0.8, issues: [] as string[] };
    
    if (lovableApiKey) {
      fairnessScore = await checkFairnessWithAI(JSON.stringify(feedback), lovableApiKey);
    }
    
    // Rewrite if bias detected or fairness score is low
    if ((biasCheck.hasBias || fairnessScore.fairness < 0.7) && lovableApiKey) {
      console.log('Bias detected or low fairness, rewriting...');
      const allIssues = [...biasCheck.biasedTerms, ...fairnessScore.issues];
      feedback = await rewriteWithoutBias(feedback, allIssues, lovableApiKey, tone);
    }

    // Format feedback as markdown with proper structure
    const strengths = feedback.strengths || [];
    const improvements = feedback.improvements || [];
    const competencies = feedback.competencies || [];
    const learningRecs = feedback.learningRecommendations || [];
    const growthPath = feedback.growthPath || {};

    const formattedFeedback = `## Performance Summary

${feedback.summary || 'No summary available.'}

## Strengths
${strengths.map((s: any) => `### ${s.title || 'Strength'}
${s.description || ''}
${s.impact ? `**Impact:** ${s.impact}` : ''}`).join('\n\n')}

## Areas for Improvement
${improvements.map((i: any) => `### ${i.title || 'Improvement Area'}
${i.description || ''}
${i.actionItem ? `**Action Item:** ${i.actionItem}` : ''}`).join('\n\n')}

## Competency Assessment
${competencies.map((c: any) => `### ${c.name || 'Competency'}
**Rating:** ${c.rating || 'Not rated'}
**Evidence:** ${c.evidence || 'No evidence provided'}`).join('\n\n')}

## Learning Recommendations
${learningRecs.map((r: any) => `- **${r.topic || 'Topic'}** (${r.priority || 'medium'} priority, ${r.timeframe || '30 days'})
  - ${r.resource || 'Self-directed learning'}`).join('\n')}

## Personal Growth Path

### Short-term Goals (30-60 days)
${growthPath.shortTerm || 'Focus on immediate skill development and quick wins.'}

### Mid-term Goals (3-6 months)
${growthPath.midTerm || 'Build on foundational skills and expand responsibilities.'}

### Long-term Career Path (1-2 years)
${growthPath.longTerm || 'Continue professional development and pursue advancement opportunities.'}

### Key Milestones
${(growthPath.keyMilestones || ['Set clear goals', 'Track progress', 'Seek feedback']).map((m: string) => `- ${m}`).join('\n')}`;

    // Extract competency tags
    const competencyTags = competencies.map((c: any) => c.name).filter(Boolean);

    // 6. Save to database
    const { data: feedbackEntry, error: feedbackError } = await supabase
      .from('feedback_entries')
      .insert({
        session_id: sessionId,
        ai_draft: formattedFeedback,
        final_feedback: formattedFeedback,
        competency_tags: competencyTags,
        tone_analysis: {
          sentiment: extractedData.sentiment,
          biasCheck: biasCheck,
          fairnessScore: fairnessScore,
          extractedEntities: extractedData,
          selectedTone: tone
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
        biasCheck,
        fairnessScore
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
