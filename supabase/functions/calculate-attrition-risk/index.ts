import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContributingFactor {
  factor: string;
  weight: number;
  trend: 'improving' | 'stable' | 'declining';
  description: string;
}

interface RecommendedAction {
  action: string;
  priority: 'high' | 'medium' | 'low';
  rationale: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all employees (profiles with employee role)
    const { data: employees, error: empError } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, team, org_unit, attrition_opt_out')
      .eq('attrition_opt_out', false);

    if (empError) {
      console.error('Error fetching employees:', empError);
      throw empError;
    }

    console.log(`Processing ${employees?.length || 0} employees for attrition risk`);

    const results = [];

    for (const employee of employees || []) {
      try {
        // Gather data points for analysis
        const analysisData = await gatherEmployeeData(supabase, employee.user_id);
        
        // Calculate risk using AI
        const riskAnalysis = await analyzeAttritionRisk(analysisData, employee);
        
        // Upsert prediction
        const { error: upsertError } = await supabase
          .from('attrition_predictions')
          .upsert({
            employee_id: employee.user_id,
            risk_score: riskAnalysis.riskScore,
            risk_level: riskAnalysis.riskLevel,
            contributing_factors: riskAnalysis.contributingFactors,
            predicted_timeframe: riskAnalysis.predictedTimeframe,
            confidence: riskAnalysis.confidence,
            recommended_actions: riskAnalysis.recommendedActions,
            last_calculated: new Date().toISOString(),
          }, {
            onConflict: 'employee_id'
          });

        if (upsertError) {
          console.error(`Error upserting prediction for ${employee.user_id}:`, upsertError);
          continue;
        }

        // Store in history for trend tracking
        await supabase.from('attrition_prediction_history').insert({
          employee_id: employee.user_id,
          risk_score: riskAnalysis.riskScore,
          risk_level: riskAnalysis.riskLevel,
        });

        // Send alerts for high/critical risk
        if (riskAnalysis.riskLevel === 'critical' || riskAnalysis.riskLevel === 'high') {
          await sendRiskAlert(supabase, employee, riskAnalysis);
        }

        results.push({
          employee_id: employee.user_id,
          risk_score: riskAnalysis.riskScore,
          risk_level: riskAnalysis.riskLevel,
        });
      } catch (err) {
        console.error(`Error processing employee ${employee.user_id}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in calculate-attrition-risk:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function gatherEmployeeData(supabase: any, employeeId: string) {
  // Get feedback entries for this employee
  const { data: sessions } = await supabase
    .from('voice_sessions')
    .select('id, status, created_at')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })
    .limit(10);

  const sessionIds = sessions?.map((s: any) => s.id) || [];
  
  let feedbackEntries: any[] = [];
  if (sessionIds.length > 0) {
    const { data } = await supabase
      .from('feedback_entries')
      .select('tone_analysis, is_published, created_at')
      .in('session_id', sessionIds);
    feedbackEntries = data || [];
  }

  // Get goals
  const { data: goals } = await supabase
    .from('goals')
    .select('status, progress, created_at')
    .eq('profile_id', employeeId);

  // Get quick feedback received
  const { data: quickFeedback } = await supabase
    .from('quick_feedback')
    .select('created_at, feedback_type')
    .eq('employee_profile_id', employeeId)
    .order('created_at', { ascending: false })
    .limit(20);

  // Get milestone completions
  const { data: milestones } = await supabase
    .from('milestone_completions')
    .select('milestone_key, completed_at')
    .eq('employee_id', employeeId);

  return {
    feedbackCount: feedbackEntries.length,
    feedbackSentiment: calculateAverageSentiment(feedbackEntries),
    goalsTotal: goals?.length || 0,
    goalsCompleted: goals?.filter((g: any) => g.status === 'completed').length || 0,
    goalsInProgress: goals?.filter((g: any) => g.status === 'active').length || 0,
    averageGoalProgress: calculateAverageProgress(goals || []),
    quickFeedbackCount: quickFeedback?.length || 0,
    lastQuickFeedback: quickFeedback?.[0]?.created_at,
    milestoneCount: milestones?.length || 0,
    lastMilestone: milestones?.[milestones.length - 1]?.completed_at,
    sessionCount: sessions?.length || 0,
    lastSession: sessions?.[0]?.created_at,
  };
}

function calculateAverageSentiment(feedbackEntries: any[]): number {
  if (!feedbackEntries.length) return 50;
  
  const sentiments = feedbackEntries
    .filter(f => f.tone_analysis?.sentiment_score !== undefined)
    .map(f => f.tone_analysis.sentiment_score);
  
  if (!sentiments.length) return 50;
  return Math.round(sentiments.reduce((a, b) => a + b, 0) / sentiments.length);
}

function calculateAverageProgress(goals: any[]): number {
  if (!goals.length) return 0;
  const total = goals.reduce((sum, g) => sum + (g.progress || 0), 0);
  return Math.round(total / goals.length);
}

async function analyzeAttritionRisk(data: any, employee: any) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    // Fallback to rule-based scoring
    return calculateRuleBasedRisk(data);
  }

  try {
    const prompt = `You are an HR analytics expert analyzing employee attrition risk. Based on the following data points, calculate an attrition risk score and provide analysis.

Employee Data:
- Feedback sessions received: ${data.sessionCount}
- Last feedback session: ${data.lastSession || 'Never'}
- Average feedback sentiment: ${data.feedbackSentiment}/100
- Total goals: ${data.goalsTotal}
- Completed goals: ${data.goalsCompleted}
- Average goal progress: ${data.averageGoalProgress}%
- Quick feedback/recognition received: ${data.quickFeedbackCount}
- Last recognition: ${data.lastQuickFeedback || 'Never'}
- Career milestones achieved: ${data.milestoneCount}
- Last milestone: ${data.lastMilestone || 'Never'}

Analyze this data and return a JSON object with:
1. riskScore: 0-100 (higher = more likely to leave)
2. riskLevel: "low" (0-39), "medium" (40-59), "high" (60-79), or "critical" (80-100)
3. predictedTimeframe: "0-30 days", "30-60 days", "60-90 days", or "90+ days"
4. confidence: 0-100 (how confident you are in this prediction)
5. contributingFactors: array of {factor, weight (0-100), trend ("improving"|"stable"|"declining"), description}
6. recommendedActions: array of {action, priority ("high"|"medium"|"low"), rationale}

Consider these risk factors:
- Low feedback sentiment indicates dissatisfaction
- Lack of recent recognition suggests feeling undervalued
- Stalled goal progress may indicate disengagement
- No milestone progress suggests career stagnation

Return ONLY valid JSON, no markdown or explanation.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an HR analytics AI. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status);
      return calculateRuleBasedRisk(data);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return calculateRuleBasedRisk(data);
  } catch (error) {
    console.error('AI analysis error:', error);
    return calculateRuleBasedRisk(data);
  }
}

function calculateRuleBasedRisk(data: any) {
  let riskScore = 50; // Base score
  const contributingFactors: ContributingFactor[] = [];
  const recommendedActions: RecommendedAction[] = [];

  // Low feedback sentiment
  if (data.feedbackSentiment < 40) {
    riskScore += 20;
    contributingFactors.push({
      factor: 'Low Feedback Sentiment',
      weight: 20,
      trend: 'declining',
      description: 'Recent feedback shows below-average sentiment scores'
    });
    recommendedActions.push({
      action: 'Schedule 1-on-1 to discuss concerns',
      priority: 'high',
      rationale: 'Address potential dissatisfaction early'
    });
  } else if (data.feedbackSentiment > 70) {
    riskScore -= 15;
  }

  // Lack of recognition
  if (data.quickFeedbackCount < 3) {
    riskScore += 15;
    contributingFactors.push({
      factor: 'Limited Recognition',
      weight: 15,
      trend: 'declining',
      description: 'Employee has received minimal recognition recently'
    });
    recommendedActions.push({
      action: 'Implement regular recognition practices',
      priority: 'medium',
      rationale: 'Recognition improves engagement and retention'
    });
  }

  // Goal progress stagnation
  if (data.averageGoalProgress < 30 && data.goalsTotal > 0) {
    riskScore += 15;
    contributingFactors.push({
      factor: 'Goal Progress Stagnation',
      weight: 15,
      trend: 'declining',
      description: 'Goals are showing minimal progress'
    });
    recommendedActions.push({
      action: 'Review and adjust goals collaboratively',
      priority: 'medium',
      rationale: 'Unachievable goals lead to frustration'
    });
  }

  // No career development
  if (data.milestoneCount === 0) {
    riskScore += 10;
    contributingFactors.push({
      factor: 'Career Stagnation',
      weight: 10,
      trend: 'stable',
      description: 'No career milestones achieved'
    });
    recommendedActions.push({
      action: 'Create career development plan',
      priority: 'high',
      rationale: 'Clear growth path improves retention'
    });
  }

  // Clamp score
  riskScore = Math.max(0, Math.min(100, riskScore));

  // Determine risk level
  let riskLevel: string;
  if (riskScore >= 80) riskLevel = 'critical';
  else if (riskScore >= 60) riskLevel = 'high';
  else if (riskScore >= 40) riskLevel = 'medium';
  else riskLevel = 'low';

  // Determine timeframe
  let predictedTimeframe: string;
  if (riskScore >= 80) predictedTimeframe = '0-30 days';
  else if (riskScore >= 60) predictedTimeframe = '30-60 days';
  else if (riskScore >= 40) predictedTimeframe = '60-90 days';
  else predictedTimeframe = '90+ days';

  return {
    riskScore,
    riskLevel,
    predictedTimeframe,
    confidence: 65, // Rule-based has moderate confidence
    contributingFactors,
    recommendedActions
  };
}

async function sendRiskAlert(supabase: any, employee: any, riskAnalysis: any) {
  // Get manager for this team
  const { data: managers } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('team', employee.team)
    .limit(5);

  // Get users with manager role
  const { data: managerRoles } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'manager');

  const managerUserIds = managerRoles?.map((r: any) => r.user_id) || [];
  const teamManagers = managers?.filter((m: any) => managerUserIds.includes(m.user_id)) || [];

  // Send notification to team managers
  for (const manager of teamManagers) {
    await supabase.from('notifications').insert({
      user_id: manager.user_id,
      title: 'Retention Alert',
      message: `${employee.full_name || 'A team member'} has a ${riskAnalysis.riskLevel} attrition risk (score: ${riskAnalysis.riskScore})`,
      type: 'retention_alert',
      action_url: '/manager/retention-alerts',
      metadata: {
        employee_id: employee.user_id,
        risk_score: riskAnalysis.riskScore,
        risk_level: riskAnalysis.riskLevel,
      }
    });
  }

  // If critical, also alert HR
  if (riskAnalysis.riskLevel === 'critical') {
    const { data: hrUsers } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'hr');

    for (const hr of hrUsers || []) {
      await supabase.from('notifications').insert({
        user_id: hr.user_id,
        title: 'Critical Retention Alert',
        message: `${employee.full_name || 'An employee'} has a CRITICAL attrition risk (score: ${riskAnalysis.riskScore}). Immediate action recommended.`,
        type: 'retention_alert',
        action_url: '/hr/attrition-overview',
        metadata: {
          employee_id: employee.user_id,
          risk_score: riskAnalysis.riskScore,
          risk_level: riskAnalysis.riskLevel,
        }
      });
    }
  }
}
