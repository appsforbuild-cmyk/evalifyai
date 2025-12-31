import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Play, 
  Palette, 
  Users, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Upload,
  Loader2,
  X,
  Sparkles
} from 'lucide-react';

interface TemplateQuestion {
  id: string;
  text: string;
  type: string;
  required: boolean;
  voiceEnabled: boolean;
}

interface PresetTemplate {
  id: string;
  title: string;
  description: string;
  questions: TemplateQuestion[];
}

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: Play },
  { id: 'branding', title: 'Branding', icon: Palette },
  { id: 'team', title: 'Team', icon: Users },
  { id: 'templates', title: 'Templates', icon: FileText },
  { id: 'complete', title: 'Complete', icon: CheckCircle2 },
];

const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: 'performance',
    title: 'General Performance Review',
    description: 'Comprehensive review covering goals, skills, and growth areas',
    questions: [
      { id: '1', text: 'What were the key accomplishments this period?', type: 'text', required: true, voiceEnabled: true },
      { id: '2', text: 'What challenges were faced and how were they addressed?', type: 'text', required: true, voiceEnabled: true },
      { id: '3', text: 'What skills would benefit from further development?', type: 'text', required: true, voiceEnabled: true },
      { id: '4', text: 'What are the goals for the next period?', type: 'text', required: true, voiceEnabled: true },
    ],
  },
  {
    id: 'quarterly',
    title: 'Quarterly Check-in',
    description: 'Quick quarterly pulse check on progress and blockers',
    questions: [
      { id: '1', text: 'How would you rate your progress on Q goals?', type: 'text', required: true, voiceEnabled: true },
      { id: '2', text: 'What support do you need from your manager?', type: 'text', required: true, voiceEnabled: true },
      { id: '3', text: 'Any concerns about the team or work environment?', type: 'text', required: false, voiceEnabled: true },
    ],
  },
  {
    id: 'project',
    title: 'Project Retrospective',
    description: 'End-of-project reflection on wins and learnings',
    questions: [
      { id: '1', text: 'What went well in this project?', type: 'text', required: true, voiceEnabled: true },
      { id: '2', text: 'What could be improved for future projects?', type: 'text', required: true, voiceEnabled: true },
      { id: '3', text: 'What learnings should be shared with the team?', type: 'text', required: true, voiceEnabled: true },
    ],
  },
  {
    id: 'one-on-one',
    title: '1-on-1 Template',
    description: 'Regular 1-on-1 meeting structure for managers',
    questions: [
      { id: '1', text: "What's top of mind for you right now?", type: 'text', required: true, voiceEnabled: true },
      { id: '2', text: 'How are you feeling about your workload?', type: 'text', required: true, voiceEnabled: true },
      { id: '3', text: 'Is there anything blocking your progress?', type: 'text', required: true, voiceEnabled: true },
      { id: '4', text: 'What can I do to better support you?', type: 'text', required: true, voiceEnabled: true },
    ],
  },
  {
    id: 'custom',
    title: 'Custom Template',
    description: 'Start from scratch with your own questions',
    questions: [],
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentOrganization, refreshOrganization } = useOrganization();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Branding state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  
  // Team invites state
  const [emailsInput, setEmailsInput] = useState('');
  const [defaultRole, setDefaultRole] = useState<'employee' | 'manager'>('employee');
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [sendingInvites, setSendingInvites] = useState(false);
  
  // Template state
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  // Completion checklist
  const [completedSteps, setCompletedSteps] = useState({
    branding: false,
    team: false,
    templates: false,
  });

  // Load saved progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('onboarding_progress');
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      setCurrentStep(progress.step || 0);
      setCompletedSteps(progress.completedSteps || { branding: false, team: false, templates: false });
      setPrimaryColor(progress.primaryColor || '#6366f1');
      setSelectedTemplate(progress.selectedTemplate || null);
      setInvitedEmails(progress.invitedEmails || []);
    }
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem('onboarding_progress', JSON.stringify({
      step: currentStep,
      completedSteps,
      primaryColor,
      selectedTemplate,
      invitedEmails,
    }));
  }, [currentStep, completedSteps, primaryColor, selectedTemplate, invitedEmails]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBranding = async () => {
    if (!currentOrganization) return;
    
    setIsLoading(true);
    try {
      let logoUrl = currentOrganization.logo_url;
      
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const filePath = `${currentOrganization.id}/logo.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('voice-recordings')
          .upload(filePath, logoFile, { upsert: true });
        
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('voice-recordings')
            .getPublicUrl(filePath);
          logoUrl = publicUrl;
        }
      }
      
      const { error } = await supabase
        .from('organizations')
        .update({
          logo_url: logoUrl,
          primary_color: primaryColor,
        })
        .eq('id', currentOrganization.id);
      
      if (error) throw error;
      
      setCompletedSteps(prev => ({ ...prev, branding: true }));
      toast({ title: 'Branding saved successfully!' });
      await refreshOrganization();
    } catch (error: any) {
      toast({ title: 'Error saving branding', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInvitations = async () => {
    if (!currentOrganization || !user) return;
    
    const emails = emailsInput.split(/[,\n]/).map(e => e.trim()).filter(e => e && e.includes('@'));
    if (emails.length === 0) {
      toast({ title: 'Please enter valid email addresses', variant: 'destructive' });
      return;
    }
    
    setSendingInvites(true);
    try {
      const invitations = emails.map(email => ({
        organization_id: currentOrganization.id,
        email,
        role: defaultRole,
        invited_by: user.id,
      }));
      
      const { error } = await supabase
        .from('invitations')
        .insert(invitations);
      
      if (error) throw error;
      
      // Call edge function to send emails
      await supabase.functions.invoke('send-invitation-emails', {
        body: { 
          invitations: invitations.map(inv => ({ 
            email: inv.email, 
            organizationName: currentOrganization.name,
            invitedByName: user.email,
          })),
        },
      });
      
      setInvitedEmails(prev => [...prev, ...emails]);
      setEmailsInput('');
      setCompletedSteps(prev => ({ ...prev, team: true }));
      toast({ title: `Invitations sent to ${emails.length} team members!` });
    } catch (error: any) {
      toast({ title: 'Error sending invitations', description: error.message, variant: 'destructive' });
    } finally {
      setSendingInvites(false);
    }
  };

  const handleImportTemplate = async () => {
    if (!currentOrganization || !selectedTemplate) return;
    
    const template = PRESET_TEMPLATES.find(t => t.id === selectedTemplate);
    if (!template) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('feedback_question_templates')
        .insert([{
          organization_id: currentOrganization.id,
          title: template.title,
          description: template.description,
          questions: JSON.parse(JSON.stringify(template.questions)),
          is_default: true,
          is_active: true,
          category: 'performance',
        }]);
      
      if (error) throw error;
      
      setCompletedSteps(prev => ({ ...prev, templates: true }));
      toast({ title: 'Template imported successfully!' });
    } catch (error: any) {
      toast({ title: 'Error importing template', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    localStorage.removeItem('onboarding_progress');
    navigate('/dashboard');
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Welcome to EvalifyAI, {user?.user_metadata?.full_name || 'there'}!
              </h2>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                Let's set up your workspace in just a few minutes. You can always customize these settings later.
              </p>
            </div>
            
            <div className="bg-muted rounded-xl aspect-video max-w-lg mx-auto flex items-center justify-center">
              <div className="text-center">
                <Play className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Quick tour video</p>
                <p className="text-xs text-muted-foreground/70">2 min watch</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto text-left">
              <div className="p-4 bg-muted/50 rounded-lg">
                <Palette className="w-5 h-5 text-primary mb-2" />
                <p className="text-sm font-medium">Brand It</p>
                <p className="text-xs text-muted-foreground">Add your logo & colors</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <Users className="w-5 h-5 text-primary mb-2" />
                <p className="text-sm font-medium">Invite Team</p>
                <p className="text-xs text-muted-foreground">Add your colleagues</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <FileText className="w-5 h-5 text-primary mb-2" />
                <p className="text-sm font-medium">Templates</p>
                <p className="text-xs text-muted-foreground">Choose feedback forms</p>
              </div>
            </div>
          </div>
        );

      case 1: // Branding
        return (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold">Customize Your Branding</h2>
              <p className="text-muted-foreground text-sm">Make EvalifyAI feel like your own</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Company Logo</Label>
                  <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center">
                    {logoPreview ? (
                      <div className="relative inline-block">
                        <img src={logoPreview} alt="Logo preview" className="max-h-24 mx-auto" />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload logo</p>
                        <p className="text-xs text-muted-foreground/70">PNG, JPG up to 2MB</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="color"
                      id="primaryColor"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#6366f1"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm font-medium mb-3">Preview</p>
                <div className="bg-background rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="h-8" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs">Logo</div>
                    )}
                    <span className="font-semibold">{currentOrganization?.name || 'Your Company'}</span>
                  </div>
                  <Button style={{ backgroundColor: primaryColor }} className="text-white">
                    Sample Button
                  </Button>
                  <div className="flex gap-2">
                    <Badge style={{ backgroundColor: primaryColor }} className="text-white">Tag</Badge>
                    <Badge variant="outline" style={{ borderColor: primaryColor, color: primaryColor }}>Outline</Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setCurrentStep(prev => prev + 1)}>
                Skip for now
              </Button>
              <Button onClick={handleSaveBranding} disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save & Continue
              </Button>
            </div>
          </div>
        );

      case 2: // Team Invites
        return (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold">Invite Your Team</h2>
              <p className="text-muted-foreground text-sm">Add team members to start giving feedback</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Email Addresses</Label>
                <Textarea
                  placeholder="Enter emails separated by commas or new lines:&#10;john@company.com, jane@company.com"
                  value={emailsInput}
                  onChange={(e) => setEmailsInput(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label>Default Role</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      checked={defaultRole === 'employee'}
                      onChange={() => setDefaultRole('employee')}
                      className="text-primary"
                    />
                    <span className="text-sm">Employee</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      checked={defaultRole === 'manager'}
                      onChange={() => setDefaultRole('manager')}
                      className="text-primary"
                    />
                    <span className="text-sm">Manager</span>
                  </label>
                </div>
              </div>
              
              <Button 
                onClick={handleSendInvitations} 
                disabled={sendingInvites || !emailsInput.trim()}
                className="w-full"
              >
                {sendingInvites && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Send Invitations
              </Button>
              
              {invitedEmails.length > 0 && (
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">Invitations Sent ({invitedEmails.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {invitedEmails.map((email, i) => (
                      <Badge key={i} variant="secondary">{email}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setCurrentStep(prev => prev + 1)}>
                Skip - I'll do this later
              </Button>
              <Button 
                onClick={() => setCurrentStep(prev => prev + 1)} 
                disabled={invitedEmails.length === 0}
              >
                Continue
              </Button>
            </div>
          </div>
        );

      case 3: // Templates
        return (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold">Choose a Feedback Template</h2>
              <p className="text-muted-foreground text-sm">Start with a pre-built template or create your own</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {PRESET_TEMPLATES.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all ${
                    selectedTemplate === template.id 
                      ? 'ring-2 ring-primary border-primary' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{template.title}</CardTitle>
                      {selectedTemplate === template.id && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <CardDescription className="text-sm">{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      {template.questions.length} questions
                    </p>
                    {template.questions.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {template.questions.slice(0, 2).map((q, i) => (
                          <li key={i} className="text-xs text-muted-foreground truncate">
                            • {q.text}
                          </li>
                        ))}
                        {template.questions.length > 2 && (
                          <li className="text-xs text-muted-foreground">
                            + {template.questions.length - 2} more
                          </li>
                        )}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setCurrentStep(prev => prev + 1)}>
                Skip for now
              </Button>
              <Button onClick={handleImportTemplate} disabled={!selectedTemplate || isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Import Template
              </Button>
            </div>
          </div>
        );

      case 4: // Complete
        return (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-foreground">You're All Set!</h2>
              <p className="text-muted-foreground mt-2">
                Your workspace is ready. Here's what you've accomplished:
              </p>
            </div>
            
            <div className="max-w-md mx-auto space-y-3 text-left">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${completedSteps.branding ? 'bg-green-500' : 'bg-muted-foreground/30'}`}>
                  {completedSteps.branding ? <CheckCircle2 className="w-4 h-4 text-white" /> : <span className="w-2 h-2 bg-muted-foreground rounded-full" />}
                </div>
                <span className={completedSteps.branding ? 'text-foreground' : 'text-muted-foreground'}>
                  Branding customized
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${completedSteps.team ? 'bg-green-500' : 'bg-muted-foreground/30'}`}>
                  {completedSteps.team ? <CheckCircle2 className="w-4 h-4 text-white" /> : <span className="w-2 h-2 bg-muted-foreground rounded-full" />}
                </div>
                <span className={completedSteps.team ? 'text-foreground' : 'text-muted-foreground'}>
                  Team invitations sent {invitedEmails.length > 0 && `(${invitedEmails.length})`}
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${completedSteps.templates ? 'bg-green-500' : 'bg-muted-foreground/30'}`}>
                  {completedSteps.templates ? <CheckCircle2 className="w-4 h-4 text-white" /> : <span className="w-2 h-2 bg-muted-foreground rounded-full" />}
                </div>
                <span className={completedSteps.templates ? 'text-foreground' : 'text-muted-foreground'}>
                  Feedback template imported
                </span>
              </div>
            </div>
            
            <div className="bg-muted rounded-lg p-4 max-w-md mx-auto">
              <p className="font-medium mb-2">Next Steps</p>
              <ul className="text-sm text-muted-foreground space-y-1 text-left">
                <li>• Import users via CSV for bulk onboarding</li>
                <li>• Schedule your first feedback session</li>
                <li>• Explore analytics and insights</li>
              </ul>
            </div>
            
            <Button size="lg" onClick={handleComplete} className="mt-4">
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <img src="/evalifyai-logo.png" alt="EvalifyAI" className="h-8" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <span className="font-semibold text-lg">EvalifyAI</span>
            </div>
            <Badge variant="secondary">Step {currentStep + 1} of {STEPS.length}</Badge>
          </div>
          
          <div className="flex items-center justify-between gap-2">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              return (
                <div key={step.id} className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isActive ? 'bg-primary text-primary-foreground' :
                    isCompleted ? 'bg-primary/20 text-primary' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
          
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        
        <CardContent className="p-6">
          {renderStepContent()}
          
          {currentStep > 0 && currentStep < 4 && (
            <div className="mt-6 pt-4 border-t">
              <Button variant="ghost" onClick={() => setCurrentStep(prev => prev - 1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
