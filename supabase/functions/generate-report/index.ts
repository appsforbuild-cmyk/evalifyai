import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportRequest {
  reportType: 'overview' | 'feedback' | 'engagement' | 'performance' | 'bias' | 'retention';
  format: 'pdf' | 'excel' | 'csv' | 'pptx';
  dateRange: {
    start: string;
    end: string;
  };
  filters?: {
    departments?: string[];
    teams?: string[];
    manager?: string;
  };
  emailTo?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { reportType, format, dateRange, filters, emailTo }: ReportRequest = await req.json();

    console.log(`Generating ${format} report for ${reportType}`, { dateRange, filters });

    // Fetch data based on report type
    let reportData: any = {};

    switch (reportType) {
      case 'overview':
        const [feedbackResult, sessionsResult, biasResult] = await Promise.all([
          supabase
            .from('feedback_entries')
            .select('*, voice_sessions!inner(*)')
            .gte('created_at', dateRange.start)
            .lte('created_at', dateRange.end),
          supabase
            .from('voice_sessions')
            .select('*')
            .gte('created_at', dateRange.start)
            .lte('created_at', dateRange.end),
          supabase
            .from('bias_audit_log')
            .select('bias_score')
            .gte('created_at', dateRange.start)
            .lte('created_at', dateRange.end)
        ]);

        reportData = {
          totalSessions: sessionsResult.data?.length || 0,
          completedSessions: sessionsResult.data?.filter(s => s.is_complete).length || 0,
          publishedFeedback: feedbackResult.data?.filter(f => f.is_published).length || 0,
          avgBiasScore: biasResult.data?.length 
            ? biasResult.data.reduce((acc, b) => acc + b.bias_score, 0) / biasResult.data.length 
            : 0,
        };
        break;

      case 'feedback':
        const feedbackData = await supabase
          .from('feedback_entries')
          .select('*, voice_sessions!inner(title, employee_id, manager_id, created_at)')
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);

        reportData = {
          entries: feedbackData.data || [],
          totalCount: feedbackData.data?.length || 0,
          publishedCount: feedbackData.data?.filter(f => f.is_published).length || 0,
        };
        break;

      case 'engagement':
        const [recognitionData, goalsData, pointsData] = await Promise.all([
          supabase
            .from('recognition_posts')
            .select('*')
            .gte('created_at', dateRange.start)
            .lte('created_at', dateRange.end),
          supabase
            .from('goals')
            .select('*')
            .gte('created_at', dateRange.start)
            .lte('created_at', dateRange.end),
          supabase
            .from('user_points')
            .select('total_points, level')
        ]);

        reportData = {
          recognitionCount: recognitionData.data?.length || 0,
          goalsCreated: goalsData.data?.length || 0,
          goalsCompleted: goalsData.data?.filter(g => g.status === 'completed').length || 0,
          avgPoints: pointsData.data?.length 
            ? pointsData.data.reduce((acc, p) => acc + p.total_points, 0) / pointsData.data.length 
            : 0,
        };
        break;

      case 'performance':
        const performanceData = await supabase
          .from('goals')
          .select('*, profiles!inner(full_name, team)')
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end);

        reportData = {
          goals: performanceData.data || [],
          completionRate: performanceData.data?.length 
            ? (performanceData.data.filter(g => g.status === 'completed').length / performanceData.data.length) * 100 
            : 0,
        };
        break;

      case 'bias':
        const biasData = await supabase
          .from('bias_audit_log')
          .select('*')
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end)
          .order('created_at', { ascending: false });

        const benchmarkData = await supabase
          .from('organization_bias_benchmarks')
          .select('*')
          .order('computed_at', { ascending: false })
          .limit(1);

        reportData = {
          audits: biasData.data || [],
          avgScore: biasData.data?.length 
            ? biasData.data.reduce((acc, b) => acc + b.bias_score, 0) / biasData.data.length 
            : 0,
          benchmark: benchmarkData.data?.[0] || null,
        };
        break;

      case 'retention':
        const [predictionsData, plansData] = await Promise.all([
          supabase
            .from('attrition_predictions')
            .select('*, profiles!inner(full_name, team)'),
          supabase
            .from('retention_action_plans')
            .select('*')
            .gte('created_at', dateRange.start)
            .lte('created_at', dateRange.end)
        ]);

        const riskDistribution = {
          low: predictionsData.data?.filter(p => p.risk_level === 'low').length || 0,
          medium: predictionsData.data?.filter(p => p.risk_level === 'medium').length || 0,
          high: predictionsData.data?.filter(p => p.risk_level === 'high').length || 0,
          critical: predictionsData.data?.filter(p => p.risk_level === 'critical').length || 0,
        };

        reportData = {
          predictions: predictionsData.data || [],
          actionPlans: plansData.data || [],
          riskDistribution,
        };
        break;
    }

    // Generate report content based on format
    let fileContent: string;
    let contentType: string;
    let fileName: string;

    const timestamp = new Date().toISOString().split('T')[0];

    switch (format) {
      case 'csv':
        fileContent = generateCSV(reportType, reportData);
        contentType = 'text/csv';
        fileName = `${reportType}-report-${timestamp}.csv`;
        break;

      case 'excel':
        // For Excel, we return JSON that the frontend will convert using xlsx library
        fileContent = JSON.stringify({
          type: 'excel',
          data: reportData,
          sheets: generateExcelSheets(reportType, reportData),
          reportType,
          dateRange,
        });
        contentType = 'application/json';
        fileName = `${reportType}-report-${timestamp}.xlsx`;
        break;

      case 'pptx':
        // For PPTX, we return JSON that the frontend will convert using pptxgenjs
        fileContent = JSON.stringify({
          type: 'pptx',
          data: reportData,
          slides: generatePPTXSlides(reportType, reportData, dateRange),
          reportType,
          dateRange,
        });
        contentType = 'application/json';
        fileName = `${reportType}-report-${timestamp}.pptx`;
        break;

      case 'pdf':
      default:
        // For PDF, we return JSON that the frontend will convert using jsPDF
        fileContent = JSON.stringify({
          type: 'pdf',
          data: reportData,
          sections: generatePDFSections(reportType, reportData, dateRange),
          reportType,
          dateRange,
        });
        contentType = 'application/json';
        fileName = `${reportType}-report-${timestamp}.pdf`;
        break;
    }

    // If email recipients specified, log it (Resend would be imported at top level in production)
    if (emailTo && emailTo.length > 0) {
      console.log(`Report would be emailed to: ${emailTo.join(', ')}`);
    }

    return new Response(fileContent, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generateCSV(reportType: string, data: any): string {
  const rows: string[][] = [];
  
  // Add header row
  rows.push(['EvalifyAI Report', reportType.toUpperCase()]);
  rows.push(['Generated', new Date().toISOString()]);
  rows.push([]);

  switch (reportType) {
    case 'overview':
      rows.push(['Metric', 'Value']);
      rows.push(['Total Sessions', data.totalSessions]);
      rows.push(['Completed Sessions', data.completedSessions]);
      rows.push(['Published Feedback', data.publishedFeedback]);
      rows.push(['Average Bias Score', data.avgBiasScore?.toFixed(1)]);
      break;

    case 'feedback':
      rows.push(['ID', 'Created At', 'Published', 'AI Draft Preview']);
      data.entries?.forEach((entry: any) => {
        rows.push([
          entry.id,
          entry.created_at,
          entry.is_published ? 'Yes' : 'No',
          (entry.ai_draft || '').substring(0, 100)
        ]);
      });
      break;

    case 'engagement':
      rows.push(['Metric', 'Value']);
      rows.push(['Recognition Count', data.recognitionCount]);
      rows.push(['Goals Created', data.goalsCreated]);
      rows.push(['Goals Completed', data.goalsCompleted]);
      rows.push(['Average Points', data.avgPoints?.toFixed(0)]);
      break;

    case 'bias':
      rows.push(['Metric', 'Value']);
      rows.push(['Total Audits', data.audits?.length || 0]);
      rows.push(['Average Score', data.avgScore?.toFixed(1)]);
      rows.push([]);
      rows.push(['Date', 'Score', 'Content Type']);
      data.audits?.slice(0, 50).forEach((audit: any) => {
        rows.push([audit.created_at, audit.bias_score, audit.content_type]);
      });
      break;

    case 'retention':
      rows.push(['Risk Level', 'Count']);
      rows.push(['Low', data.riskDistribution?.low || 0]);
      rows.push(['Medium', data.riskDistribution?.medium || 0]);
      rows.push(['High', data.riskDistribution?.high || 0]);
      rows.push(['Critical', data.riskDistribution?.critical || 0]);
      break;

    default:
      rows.push(['Data', JSON.stringify(data)]);
  }

  return rows.map(row => row.join(',')).join('\n');
}

function generateExcelSheets(reportType: string, data: any): any[] {
  const sheets = [];

  sheets.push({
    name: 'Summary',
    data: [
      ['Report Type', reportType],
      ['Generated', new Date().toISOString()],
    ]
  });

  switch (reportType) {
    case 'overview':
      sheets.push({
        name: 'Metrics',
        data: [
          ['Metric', 'Value'],
          ['Total Sessions', data.totalSessions],
          ['Completed Sessions', data.completedSessions],
          ['Published Feedback', data.publishedFeedback],
          ['Average Bias Score', data.avgBiasScore],
        ]
      });
      break;

    case 'feedback':
      sheets.push({
        name: 'Feedback Entries',
        data: [
          ['ID', 'Created At', 'Published', 'Session ID'],
          ...(data.entries || []).map((e: any) => [e.id, e.created_at, e.is_published, e.session_id])
        ]
      });
      break;

    case 'retention':
      sheets.push({
        name: 'Risk Distribution',
        data: [
          ['Risk Level', 'Count'],
          ['Low', data.riskDistribution?.low || 0],
          ['Medium', data.riskDistribution?.medium || 0],
          ['High', data.riskDistribution?.high || 0],
          ['Critical', data.riskDistribution?.critical || 0],
        ]
      });
      break;
  }

  return sheets;
}

function generatePDFSections(reportType: string, data: any, dateRange: any): any[] {
  const sections = [];

  sections.push({
    type: 'header',
    title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
    subtitle: `${dateRange.start} to ${dateRange.end}`,
  });

  sections.push({
    type: 'summary',
    title: 'Executive Summary',
    content: `This report covers the ${reportType} analytics for the specified period.`,
  });

  switch (reportType) {
    case 'overview':
      sections.push({
        type: 'metrics',
        title: 'Key Metrics',
        data: [
          { label: 'Total Sessions', value: data.totalSessions },
          { label: 'Completed Sessions', value: data.completedSessions },
          { label: 'Published Feedback', value: data.publishedFeedback },
          { label: 'Average Bias Score', value: data.avgBiasScore?.toFixed(1) },
        ]
      });
      break;

    case 'retention':
      sections.push({
        type: 'chart',
        chartType: 'pie',
        title: 'Risk Distribution',
        data: data.riskDistribution,
      });
      break;
  }

  return sections;
}

function generatePPTXSlides(reportType: string, data: any, dateRange: any): any[] {
  const slides = [];

  slides.push({
    type: 'title',
    title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
    subtitle: `${dateRange.start} to ${dateRange.end}`,
  });

  slides.push({
    type: 'summary',
    title: 'Key Findings',
    bullets: [
      `Report covers ${reportType} analytics`,
      `Date range: ${dateRange.start} to ${dateRange.end}`,
      `Generated on ${new Date().toLocaleDateString()}`,
    ],
  });

  switch (reportType) {
    case 'overview':
      slides.push({
        type: 'metrics',
        title: 'Overview Metrics',
        metrics: [
          { label: 'Total Sessions', value: data.totalSessions },
          { label: 'Completed', value: data.completedSessions },
          { label: 'Published', value: data.publishedFeedback },
        ],
      });
      break;

    case 'retention':
      slides.push({
        type: 'chart',
        title: 'Risk Distribution',
        data: data.riskDistribution,
      });
      break;
  }

  return slides;
}
