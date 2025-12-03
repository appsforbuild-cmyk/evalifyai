import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, User, Mail, Building2, Briefcase, Calendar, FileText, TrendingUp, Clock, Star, Target, BookOpen, Download, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { toast } from 'sonner';

interface Employee {
  id: string;
  email: string;
  full_name: string;
  team: string;
  org_unit: string | null;
  created_at: string;
}

// Sample feedback data generator based on employee
const generateFeedbackData = (employee: Employee) => {
  const feedbackTemplates = [
    {
      id: '1',
      title: 'Q3 2024 Performance Review',
      date: '2024-09-15',
      status: 'published',
      summary: `${employee.full_name} consistently delivers high-quality work and demonstrates strong technical expertise. Shows excellent collaboration skills and proactive communication with team members.`,
      strengths: [
        { title: 'Technical Excellence', description: 'Demonstrates deep understanding of core technologies and applies best practices consistently', impact: 'Reduced bug count by 30%' },
        { title: 'Team Collaboration', description: 'Actively supports team members and shares knowledge effectively', impact: 'Mentored 2 junior developers' },
        { title: 'Problem Solving', description: 'Approaches complex challenges with creative and efficient solutions', impact: 'Resolved critical issues within 2 hours' }
      ],
      improvements: [
        { title: 'Documentation', description: 'Could improve technical documentation for complex features', action: 'Dedicate 2 hours weekly' },
        { title: 'Presentation Skills', description: 'Would benefit from more practice presenting to larger audiences', action: 'Present at next team meeting' }
      ],
      competencies: [
        { name: 'Technical Skills', rating: 4.5 },
        { name: 'Communication', rating: 4.0 },
        { name: 'Leadership', rating: 3.5 },
        { name: 'Innovation', rating: 4.0 },
        { name: 'Reliability', rating: 4.5 }
      ]
    },
    {
      id: '2',
      title: 'Mid-Year Feedback Session',
      date: '2024-06-20',
      status: 'published',
      summary: `Shows strong initiative and consistently exceeds expectations in project delivery. Demonstrates excellent analytical skills and attention to detail in the ${employee.team} team.`,
      strengths: [
        { title: 'Analytical Thinking', description: 'Excels at breaking down complex problems into manageable components', impact: 'Identified cost-saving opportunities' },
        { title: 'Attention to Detail', description: 'Consistently produces error-free deliverables', impact: 'Zero critical bugs in releases' },
        { title: 'Initiative', description: 'Proactively identifies and addresses potential issues', impact: 'Prevented 3 escalations' }
      ],
      improvements: [
        { title: 'Delegation', description: 'Tends to take on too much work independently', action: 'Delegate at least 2 tasks per sprint' },
        { title: 'Work-Life Balance', description: 'Could benefit from better boundary setting', action: 'Limit after-hours work' }
      ],
      competencies: [
        { name: 'Technical Skills', rating: 4.0 },
        { name: 'Communication', rating: 4.5 },
        { name: 'Leadership', rating: 4.0 },
        { name: 'Innovation', rating: 3.5 },
        { name: 'Reliability', rating: 5.0 }
      ]
    },
    {
      id: '3',
      title: 'Q1 2024 Performance Review',
      date: '2024-03-15',
      status: 'published',
      summary: `Strong start to the year with notable improvements in key areas. ${employee.full_name} has shown dedication to professional development.`,
      strengths: [
        { title: 'Adaptability', description: 'Quickly adapted to new tools and processes', impact: 'Reduced onboarding time by 20%' },
        { title: 'Team Spirit', description: 'Positive attitude and willingness to help others', impact: 'Improved team morale' },
        { title: 'Quality Focus', description: 'Maintains high standards in all deliverables', impact: 'Client satisfaction increased' }
      ],
      improvements: [
        { title: 'Time Management', description: 'Could improve prioritization of tasks', action: 'Use time-blocking technique' },
        { title: 'Strategic Thinking', description: 'Would benefit from broader business perspective', action: 'Attend strategy sessions' }
      ],
      competencies: [
        { name: 'Technical Skills', rating: 3.5 },
        { name: 'Communication', rating: 3.5 },
        { name: 'Leadership', rating: 3.0 },
        { name: 'Innovation', rating: 3.5 },
        { name: 'Reliability', rating: 4.0 }
      ]
    },
    {
      id: '4',
      title: 'Q4 2023 Year-End Review',
      date: '2023-12-15',
      status: 'published',
      summary: `Solid performance throughout Q4. Demonstrated growth mindset and commitment to continuous improvement.`,
      strengths: [
        { title: 'Learning Agility', description: 'Quick to learn new technologies', impact: 'Completed 3 certifications' },
        { title: 'Reliability', description: 'Consistently meets deadlines', impact: '100% on-time delivery' }
      ],
      improvements: [
        { title: 'Cross-functional Collaboration', description: 'More engagement with other teams needed', action: 'Join cross-team projects' }
      ],
      competencies: [
        { name: 'Technical Skills', rating: 3.0 },
        { name: 'Communication', rating: 3.0 },
        { name: 'Leadership', rating: 2.5 },
        { name: 'Innovation', rating: 3.0 },
        { name: 'Reliability', rating: 4.0 }
      ]
    }
  ];

  return feedbackTemplates;
};

const generateGrowthPath = (employee: Employee) => ({
  shortTerm: [
    'Complete current project deliverables with high quality',
    'Improve documentation practices for team knowledge sharing',
    'Participate in at least 2 cross-functional meetings'
  ],
  midTerm: [
    'Lead a small feature team of 2-3 members',
    'Present at company tech talk or knowledge sharing session',
    'Complete advanced certification in core domain'
  ],
  longTerm: [
    'Transition to senior technical or leadership role',
    'Mentor 3+ junior developers successfully',
    'Drive at least one major organizational initiative'
  ],
  milestones: [
    { quarter: 'Q1 2025', goal: 'Complete advanced certification', status: 'in-progress' },
    { quarter: 'Q2 2025', goal: 'Lead first project independently', status: 'upcoming' },
    { quarter: 'Q4 2025', goal: 'Promotion readiness review', status: 'upcoming' }
  ],
  learningRecommendations: [
    { topic: 'Public Speaking', priority: 'Medium', timeframe: '3 months', resource: 'Toastmasters or internal workshops' },
    { topic: 'System Design', priority: 'High', timeframe: '6 months', resource: 'Advanced architecture course' },
    { topic: 'Leadership Development', priority: 'High', timeframe: '6 months', resource: 'Internal leadership program' }
  ]
});

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchEmployee();
    }
  }, [id]);

  const fetchEmployee = async () => {
    const { data, error } = await supabase
      .from('employees_directory')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!error && data) {
      setEmployee(data);
    }
    setLoading(false);
  };

  const getTeamColor = (team: string) => {
    const colors: Record<string, string> = {
      'Engineering': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Product': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Design': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'Marketing': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Sales': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Finance': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Human Resources': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'Operations': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      'Customer Support': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      'Data Science': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'Legal': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      'IT Support': 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
      'Administration': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    };
    return colors[team] || 'bg-muted text-muted-foreground';
  };

  const exportReport = () => {
    if (!employee) return;

    const feedbackHistory = generateFeedbackData(employee);
    const growthPath = generateGrowthPath(employee);
    
    // Generate report content
    let reportContent = `
EMPLOYEE FEEDBACK REPORT
========================
Generated: ${new Date().toLocaleDateString()}

EMPLOYEE INFORMATION
--------------------
Name: ${employee.full_name}
Email: ${employee.email}
Team: ${employee.team}
Department: ${employee.org_unit || 'Not assigned'}

PERFORMANCE SUMMARY
-------------------
Total Feedback Sessions: ${feedbackHistory.length}
Average Rating: ${(feedbackHistory.reduce((acc, f) => acc + f.competencies.reduce((a, c) => a + c.rating, 0) / f.competencies.length, 0) / feedbackHistory.length).toFixed(2)}/5.0

FEEDBACK HISTORY
----------------
`;

    feedbackHistory.forEach((feedback, index) => {
      reportContent += `
${index + 1}. ${feedback.title}
   Date: ${new Date(feedback.date).toLocaleDateString()}
   Status: ${feedback.status}
   
   Summary: ${feedback.summary}
   
   Strengths:
${feedback.strengths.map(s => `   - ${s.title}: ${s.description} (Impact: ${s.impact})`).join('\n')}
   
   Areas for Improvement:
${feedback.improvements.map(i => `   - ${i.title}: ${i.description} (Action: ${i.action})`).join('\n')}
   
   Competency Ratings:
${feedback.competencies.map(c => `   - ${c.name}: ${c.rating}/5`).join('\n')}

`;
    });

    reportContent += `
GROWTH PATH
-----------
Short-term Goals:
${growthPath.shortTerm.map(g => `- ${g}`).join('\n')}

Mid-term Goals (3-6 months):
${growthPath.midTerm.map(g => `- ${g}`).join('\n')}

Long-term Goals (12+ months):
${growthPath.longTerm.map(g => `- ${g}`).join('\n')}

Key Milestones:
${growthPath.milestones.map(m => `- ${m.quarter}: ${m.goal} (${m.status})`).join('\n')}

Learning Recommendations:
${growthPath.learningRecommendations.map(r => `- ${r.topic} (${r.priority} priority, ${r.timeframe}): ${r.resource}`).join('\n')}
`;

    // Download as text file
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${employee.full_name.replace(/\s+/g, '_')}_Feedback_Report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Report downloaded successfully');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Loading employee profile...</div>
      </DashboardLayout>
    );
  }

  if (!employee) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Employee not found</h2>
          <Button onClick={() => navigate('/employees')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const feedbackHistory = generateFeedbackData(employee);
  const growthPath = generateGrowthPath(employee);
  const latestFeedback = feedbackHistory[0];
  const avgRating = latestFeedback.competencies.reduce((acc, c) => acc + c.rating, 0) / latestFeedback.competencies.length;

  // Prepare trend data for charts
  const trendData = feedbackHistory.map(f => ({
    period: new Date(f.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    avgRating: (f.competencies.reduce((a, c) => a + c.rating, 0) / f.competencies.length).toFixed(1),
    technical: f.competencies.find(c => c.name === 'Technical Skills')?.rating || 0,
    communication: f.competencies.find(c => c.name === 'Communication')?.rating || 0,
    leadership: f.competencies.find(c => c.name === 'Leadership')?.rating || 0,
    innovation: f.competencies.find(c => c.name === 'Innovation')?.rating || 0,
    reliability: f.competencies.find(c => c.name === 'Reliability')?.rating || 0,
  })).reverse();

  // Radar chart data for latest vs previous comparison
  const radarData = latestFeedback.competencies.map(comp => ({
    competency: comp.name,
    current: comp.rating,
    previous: feedbackHistory[1]?.competencies.find(c => c.name === comp.name)?.rating || 0,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6" ref={reportRef}>
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={() => navigate('/employees')} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Directory
          </Button>
          <Button onClick={exportReport} className="gap-2">
            <Download className="w-4 h-4" /> Export Report
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                <User className="w-12 h-12 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-primary mb-2">{employee.full_name}</h1>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={getTeamColor(employee.team)} variant="secondary">{employee.team}</Badge>
                  {employee.org_unit && <Badge variant="outline">{employee.org_unit}</Badge>}
                </div>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" /><span>{employee.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="w-4 h-4" /><span>{employee.team}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="w-4 h-4" /><span>{employee.org_unit || 'Not assigned'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" /><span>Added {new Date(employee.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Performance Trends</TabsTrigger>
            <TabsTrigger value="feedback">Feedback History</TabsTrigger>
            <TabsTrigger value="growth">Growth Path</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Total Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{feedbackHistory.length}</div>
                  <p className="text-sm text-muted-foreground">Sessions received</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Star className="w-4 h-4" /> Avg. Rating
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{avgRating.toFixed(1)}</div>
                  <p className="text-sm text-muted-foreground">Out of 5.0</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Last Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{new Date(latestFeedback.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  <p className="text-sm text-muted-foreground">{latestFeedback.title}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Latest Performance Summary</CardTitle>
                <CardDescription>{latestFeedback.title}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">{latestFeedback.summary}</p>
                
                <div>
                  <h4 className="font-semibold mb-3">Competency Ratings</h4>
                  <div className="space-y-3">
                    {latestFeedback.competencies.map((comp) => (
                      <div key={comp.name} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{comp.name}</span>
                          <span className="font-medium">{comp.rating}/5</span>
                        </div>
                        <Progress value={comp.rating * 20} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" /> Key Strengths
                  </h4>
                  <div className="grid md:grid-cols-3 gap-3">
                    {latestFeedback.strengths.map((s, i) => (
                      <div key={i} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <h5 className="font-medium text-green-800 dark:text-green-200">{s.title}</h5>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">{s.description}</p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2">Impact: {s.impact}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-amber-600" /> Areas for Improvement
                  </h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {latestFeedback.improvements.map((imp, i) => (
                      <div key={i} className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <h5 className="font-medium text-amber-800 dark:text-amber-200">{imp.title}</h5>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{imp.description}</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">Action: {imp.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" /> Overall Rating Trend
                  </CardTitle>
                  <CardDescription>Average rating progression over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="period" className="text-xs" />
                        <YAxis domain={[0, 5]} className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="avgRating" 
                          name="Avg Rating"
                          stroke="hsl(var(--primary))" 
                          strokeWidth={3}
                          dot={{ fill: 'hsl(var(--primary))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Current vs Previous Quarter</CardTitle>
                  <CardDescription>Competency comparison radar chart</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="competency" className="text-xs" />
                        <PolarRadiusAxis domain={[0, 5]} />
                        <Radar 
                          name="Current" 
                          dataKey="current" 
                          stroke="hsl(var(--primary))" 
                          fill="hsl(var(--primary))" 
                          fillOpacity={0.3} 
                        />
                        <Radar 
                          name="Previous" 
                          dataKey="previous" 
                          stroke="hsl(var(--muted-foreground))" 
                          fill="hsl(var(--muted-foreground))" 
                          fillOpacity={0.2} 
                        />
                        <Legend />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Competency Breakdown Over Time</CardTitle>
                <CardDescription>Individual competency progression</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="period" className="text-xs" />
                      <YAxis domain={[0, 5]} className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Legend />
                      <Line type="monotone" dataKey="technical" name="Technical Skills" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="communication" name="Communication" stroke="#10b981" strokeWidth={2} />
                      <Line type="monotone" dataKey="leadership" name="Leadership" stroke="#f59e0b" strokeWidth={2} />
                      <Line type="monotone" dataKey="innovation" name="Innovation" stroke="#8b5cf6" strokeWidth={2} />
                      <Line type="monotone" dataKey="reliability" name="Reliability" stroke="#ef4444" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-5 gap-4">
              {latestFeedback.competencies.map((comp, i) => {
                const prevRating = feedbackHistory[1]?.competencies.find(c => c.name === comp.name)?.rating || comp.rating;
                const change = comp.rating - prevRating;
                return (
                  <Card key={comp.name}>
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground mb-1">{comp.name}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">{comp.rating}</span>
                        <span className={`text-sm ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                          {change > 0 ? `+${change.toFixed(1)}` : change < 0 ? change.toFixed(1) : '—'}
                        </span>
                      </div>
                      <Progress value={comp.rating * 20} className="h-1.5 mt-2" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Feedback History</CardTitle>
                <CardDescription>All feedback sessions for this employee</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {feedbackHistory.map((session) => (
                    <div key={session.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold">{session.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                        <Badge variant={session.status === 'published' ? 'default' : 'secondary'}>{session.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{session.summary}</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-green-600" />
                          <span>{session.strengths.length} Strengths</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3 text-amber-600" />
                          <span>{session.improvements.length} Areas to Improve</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-primary" />
                          <span>Avg: {(session.competencies.reduce((a, c) => a + c.rating, 0) / session.competencies.length).toFixed(1)}/5</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="growth" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Short-term Goals</CardTitle>
                  <CardDescription>Immediate priorities</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {growthPath.shortTerm.map((goal, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                        {goal}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Mid-term Goals</CardTitle>
                  <CardDescription>3-6 month horizon</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {growthPath.midTerm.map((goal, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                        {goal}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Long-term Goals</CardTitle>
                  <CardDescription>12+ month vision</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {growthPath.longTerm.map((goal, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                        {goal}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Key Milestones</CardTitle>
                <CardDescription>Tracking progress toward career goals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {growthPath.milestones.map((milestone, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        milestone.status === 'completed' ? 'bg-green-100 text-green-600' :
                        milestone.status === 'in-progress' ? 'bg-blue-100 text-blue-600' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        <Target className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{milestone.goal}</p>
                        <p className="text-sm text-muted-foreground">{milestone.quarter}</p>
                      </div>
                      <Badge variant={
                        milestone.status === 'completed' ? 'default' :
                        milestone.status === 'in-progress' ? 'secondary' : 'outline'
                      }>
                        {milestone.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" /> Learning Recommendations
                </CardTitle>
                <CardDescription>Suggested development areas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {growthPath.learningRecommendations.map((rec, i) => (
                    <div key={i} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{rec.topic}</h4>
                        <Badge variant={rec.priority === 'High' ? 'destructive' : 'secondary'} className="text-xs">{rec.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{rec.resource}</p>
                      <p className="text-xs text-muted-foreground">Timeframe: {rec.timeframe}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeProfile;
