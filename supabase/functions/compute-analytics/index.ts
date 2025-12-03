import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting analytics computation...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    // Fetch all published feedback entries with related data
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('feedback_entries')
      .select(`
        id,
        tone_analysis,
        competency_tags,
        is_published,
        created_at,
        session_id,
        voice_sessions!inner (
          employee_id,
          manager_id
        )
      `)
      .eq('is_published', true)
      .gte('created_at', ninetyDaysAgo.toISOString());

    if (feedbackError) {
      console.error('Error fetching feedback:', feedbackError);
      throw feedbackError;
    }

    console.log(`Found ${feedbackData?.length || 0} published feedback entries`);

    // Fetch profiles for team/org_unit grouping
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, team, org_unit');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw profilesError;
    }

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    // Compute aggregates by team
    const teamAggregates: Record<string, { sentiments: number[], fairness: number[], count: number, skills: Record<string, number> }> = {};
    const orgUnitAggregates: Record<string, number> = {};
    const skillGaps: Record<string, number> = {};

    for (const feedback of feedbackData || []) {
      const session = feedback.voice_sessions as any;
      const employeeProfile = profileMap.get(session?.employee_id);
      const team = employeeProfile?.team || 'Unassigned';
      const orgUnit = employeeProfile?.org_unit || 'Unassigned';

      // Initialize team aggregate
      if (!teamAggregates[team]) {
        teamAggregates[team] = { sentiments: [], fairness: [], count: 0, skills: {} };
      }

      teamAggregates[team].count++;

      // Extract sentiment from tone_analysis
      const toneAnalysis = feedback.tone_analysis as Record<string, any> | null;
      if (toneAnalysis?.sentiment?.score !== undefined) {
        teamAggregates[team].sentiments.push(toneAnalysis.sentiment.score);
      }
      
      // Use a fairness score (placeholder - could be computed from bias detection)
      if (toneAnalysis?.fairnessScore !== undefined) {
        teamAggregates[team].fairness.push(toneAnalysis.fairnessScore);
      } else {
        // Default fairness score based on sentiment neutrality
        const fairness = toneAnalysis?.sentiment?.score 
          ? Math.abs(0.5 - Math.abs(toneAnalysis.sentiment.score)) * 2 
          : 0.8;
        teamAggregates[team].fairness.push(fairness);
      }

      // Track competency/skill gaps
      const tags = feedback.competency_tags || [];
      for (const tag of tags) {
        skillGaps[tag] = (skillGaps[tag] || 0) + 1;
        teamAggregates[team].skills[tag] = (teamAggregates[team].skills[tag] || 0) + 1;
      }

      // Count by org unit
      orgUnitAggregates[orgUnit] = (orgUnitAggregates[orgUnit] || 0) + 1;
    }

    // Prepare aggregates for storage
    const periodStart = ninetyDaysAgo.toISOString().split('T')[0];
    const periodEnd = now.toISOString().split('T')[0];

    // Delete old aggregates for this period
    await supabase
      .from('analytics_feedback_aggregate')
      .delete()
      .gte('period_start', periodStart);

    // Insert team aggregates
    const aggregatesToInsert = [];
    
    for (const [team, data] of Object.entries(teamAggregates)) {
      const avgSentiment = data.sentiments.length > 0 
        ? data.sentiments.reduce((a, b) => a + b, 0) / data.sentiments.length 
        : null;
      const avgFairness = data.fairness.length > 0 
        ? data.fairness.reduce((a, b) => a + b, 0) / data.fairness.length 
        : null;
      
      // Find top skill gaps for this team
      const teamSkillGaps = Object.entries(data.skills)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([skill, count]) => ({ skill, count }));

      aggregatesToInsert.push({
        period_start: periodStart,
        period_end: periodEnd,
        team,
        org_unit: null,
        avg_sentiment: avgSentiment,
        avg_fairness: avgFairness,
        feedback_count: data.count,
        skill_gaps: teamSkillGaps,
        metadata: { type: 'team' }
      });
    }

    // Insert org unit aggregates
    for (const [orgUnit, count] of Object.entries(orgUnitAggregates)) {
      aggregatesToInsert.push({
        period_start: periodStart,
        period_end: periodEnd,
        team: null,
        org_unit: orgUnit,
        avg_sentiment: null,
        avg_fairness: null,
        feedback_count: count,
        skill_gaps: [],
        metadata: { type: 'org_unit' }
      });
    }

    // Insert global skill gaps
    const globalSkillGaps = Object.entries(skillGaps)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([skill, count]) => ({ skill, count }));

    aggregatesToInsert.push({
      period_start: periodStart,
      period_end: periodEnd,
      team: null,
      org_unit: null,
      avg_sentiment: null,
      avg_fairness: null,
      feedback_count: feedbackData?.length || 0,
      skill_gaps: globalSkillGaps,
      metadata: { type: 'global' }
    });

    const { error: insertError } = await supabase
      .from('analytics_feedback_aggregate')
      .insert(aggregatesToInsert);

    if (insertError) {
      console.error('Error inserting aggregates:', insertError);
      throw insertError;
    }

    console.log(`Successfully computed and stored ${aggregatesToInsert.length} aggregate records`);

    return new Response(JSON.stringify({ 
      success: true, 
      recordsComputed: aggregatesToInsert.length,
      periodStart,
      periodEnd
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Analytics computation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
