import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Loader2, 
  Upload, 
  Building2, 
  Palette, 
  Users, 
  Settings, 
  Check,
  ArrowRight,
  ArrowLeft,
  Mail,
  Copy,
  ExternalLink,
  Globe
} from 'lucide-react';

interface OrganizationOnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface WizardData {
  // Step 1: Basic Info
  name: string;
  slug: string;
  domain: string;
  plan: 'starter' | 'professional' | 'enterprise';
  billingEmail: string;
  maxUsers: number;
  // Step 2: Branding
  logoFile: File | null;
  logoPreview: string | null;
  primaryColor: string;
  secondaryColor: string;
  platformName: string;
  welcomeMessage: string;
  // Step 3: Invite Users
  inviteEmails: string;
  // Step 4: Settings
  enableEmailNotifications: boolean;
  feedbackReminderDays: number;
  timezone: string;
  dateFormat: string;
}

const INITIAL_DATA: WizardData = {
  name: '',
  slug: '',
  domain: '',
  plan: 'starter',
  billingEmail: '',
  maxUsers: 10,
  logoFile: null,
  logoPreview: null,
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6',
  platformName: '',
  welcomeMessage: '',
  inviteEmails: '',
  enableEmailNotifications: true,
  feedbackReminderDays: 7,
  timezone: 'America/New_York',
  dateFormat: 'MM/dd/yyyy',
};

const STEPS = [
  { id: 1, title: 'Organization', icon: Building2 },
  { id: 2, title: 'Branding', icon: Palette },
  { id: 3, title: 'Invite Users', icon: Users },
  { id: 4, title: 'Settings', icon: Settings },
  { id: 5, title: 'Complete', icon: Check },
];

export default function OrganizationOnboardingWizard({
  open,
  onOpenChange,
  onSuccess,
}: OrganizationOnboardingWizardProps) {
  const { logAction } = useSuperAdmin();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
      platformName: prev.platformName || name,
    }));
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setData(prev => ({ ...prev, logoFile: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setData(prev => ({ ...prev, logoPreview: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.svg', '.webp'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  const validateStep = (stepNum: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNum === 1) {
      if (!data.name.trim()) newErrors.name = 'Organization name is required';
      if (!data.slug.trim()) {
        newErrors.slug = 'Slug is required';
      } else if (!/^[a-z0-9-]+$/.test(data.slug)) {
        newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
      }
      if (data.billingEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.billingEmail)) {
        newErrors.billingEmail = 'Invalid email format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep(step)) return;

    if (step === 4) {
      await handleComplete();
    } else {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleComplete = async () => {
    setIsSubmitting(true);

    try {
      let logoUrl: string | null = null;

      // Upload logo if provided
      if (data.logoFile) {
        const fileExt = data.logoFile.name.split('.').pop();
        const fileName = `${data.slug}-logo-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('branding')
          .upload(fileName, data.logoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('branding')
          .getPublicUrl(fileName);
        
        logoUrl = publicUrl;
      }

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: data.name,
          slug: data.slug,
          domain: data.domain || null,
          plan: data.plan,
          status: 'trial',
          max_users: data.maxUsers,
          billing_email: data.billingEmail || null,
          logo_url: logoUrl,
          primary_color: data.primaryColor,
          secondary_color: data.secondaryColor,
        })
        .select()
        .single();

      if (orgError) {
        if (orgError.code === '23505') {
          toast.error('An organization with this slug already exists');
          setErrors({ slug: 'This slug is already taken' });
          setStep(1);
          return;
        }
        throw orgError;
      }

      // Create organization settings
      await supabase
        .from('organization_settings')
        .insert({
          organization_id: org.id,
          platform_name: data.platformName || data.name,
          primary_color: data.primaryColor,
          secondary_color: data.secondaryColor,
          company_name: data.name,
          email_notifications: data.enableEmailNotifications,
          feedback_reminder_days: data.feedbackReminderDays,
          timezone: data.timezone,
          date_format: data.dateFormat,
          custom_branding: {
            welcome_message: data.welcomeMessage,
          },
        });

      // Send invitations if emails provided
      if (data.inviteEmails.trim()) {
        const emails = data.inviteEmails
          .split(/[,\n]/)
          .map(e => e.trim())
          .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

        if (emails.length > 0) {
          for (const email of emails) {
            await supabase.from('invitations').insert({
              organization_id: org.id,
              email,
              role: 'employee',
              invited_by: (await supabase.auth.getUser()).data.user?.id || '',
            });
          }
        }
      }

      // Send welcome email to billing email
      if (data.billingEmail) {
        try {
          await supabase.functions.invoke('send-branded-email', {
            body: {
              toEmail: data.billingEmail,
              subject: `Welcome to ${data.platformName || data.name}!`,
              templateName: 'organization_welcome',
              variables: {
                organization_name: data.name,
                login_url: `${window.location.origin}/login/${data.slug}`,
                admin_name: 'Admin',
              },
              organizationId: org.id,
            },
          });
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
        }
      }

      await logAction('create_organization_wizard', 'organization', org.id, {
        name: data.name,
        slug: data.slug,
        plan: data.plan,
        invites_sent: data.inviteEmails.split(/[,\n]/).filter(e => e.trim()).length,
      });

      setCreatedOrgId(org.id);
      setStep(5);
      toast.success('Organization created successfully!');
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error('Failed to create organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (step === 5) {
      onSuccess();
    }
    setStep(1);
    setData(INITIAL_DATA);
    setCreatedOrgId(null);
    setErrors({});
    onOpenChange(false);
  };

  const loginUrl = data.slug ? `${window.location.origin}/login/${data.slug}` : '';

  const copyLoginUrl = () => {
    navigator.clipboard.writeText(loginUrl);
    toast.success('Login URL copied to clipboard');
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-5 w-5 text-amber-500" />
            New Organization Setup
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Follow the wizard to set up a new client organization.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="mt-4">
          <Progress value={progress} className="h-2 bg-slate-700" />
          <div className="flex justify-between mt-3">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={`flex flex-col items-center gap-1 ${
                  s.id <= step ? 'text-amber-500' : 'text-slate-500'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    s.id < step
                      ? 'bg-amber-500 text-black'
                      : s.id === step
                      ? 'bg-amber-500/20 border-2 border-amber-500'
                      : 'bg-slate-700'
                  }`}
                >
                  {s.id < step ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <s.icon className="h-4 w-4" />
                  )}
                </div>
                <span className="text-xs hidden sm:block">{s.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="mt-6 min-h-[300px]">
          {/* Step 1: Organization Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Acme Corporation"
                  className={`bg-slate-800 border-slate-600 ${errors.name ? 'border-red-500' : ''}`}
                />
                {errors.name && <p className="text-sm text-red-400">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">/login/</span>
                  <Input
                    id="slug"
                    value={data.slug}
                    onChange={(e) => setData(prev => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                    placeholder="acme-corp"
                    className={`bg-slate-800 border-slate-600 ${errors.slug ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.slug && <p className="text-sm text-red-400">{errors.slug}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plan">Plan</Label>
                  <Select
                    value={data.plan}
                    onValueChange={(value: WizardData['plan']) => setData(prev => ({ ...prev, plan: value }))}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxUsers">Max Users</Label>
                  <Input
                    id="maxUsers"
                    type="number"
                    value={data.maxUsers}
                    onChange={(e) => setData(prev => ({ ...prev, maxUsers: parseInt(e.target.value) || 10 }))}
                    min={1}
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="billingEmail">Billing Email</Label>
                <Input
                  id="billingEmail"
                  type="email"
                  value={data.billingEmail}
                  onChange={(e) => setData(prev => ({ ...prev, billingEmail: e.target.value }))}
                  placeholder="billing@acme.com"
                  className={`bg-slate-800 border-slate-600 ${errors.billingEmail ? 'border-red-500' : ''}`}
                />
                {errors.billingEmail && <p className="text-sm text-red-400">{errors.billingEmail}</p>}
                <p className="text-xs text-slate-400">A welcome email with login URL will be sent here</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Custom Domain (optional)</Label>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <Input
                    id="domain"
                    value={data.domain}
                    onChange={(e) => setData(prev => ({ ...prev, domain: e.target.value }))}
                    placeholder="feedback.acme.com"
                    className="bg-slate-800 border-slate-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Branding */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Logo</Label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-amber-500 bg-amber-500/10' : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <input {...getInputProps()} />
                  {data.logoPreview ? (
                    <div className="flex flex-col items-center gap-3">
                      <img src={data.logoPreview} alt="Logo preview" className="h-16 max-w-48 object-contain" />
                      <p className="text-sm text-slate-400">Click or drag to replace</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-slate-400" />
                      <p className="text-sm text-slate-400">Drop logo here or click to upload</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={data.primaryColor}
                      onChange={(e) => setData(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-10 h-10 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={data.primaryColor}
                      onChange={(e) => setData(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="bg-slate-800 border-slate-600 font-mono"
                      maxLength={7}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={data.secondaryColor}
                      onChange={(e) => setData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-10 h-10 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={data.secondaryColor}
                      onChange={(e) => setData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="bg-slate-800 border-slate-600 font-mono"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="platformName">Platform Name</Label>
                <Input
                  id="platformName"
                  value={data.platformName}
                  onChange={(e) => setData(prev => ({ ...prev, platformName: e.target.value }))}
                  placeholder={data.name || 'Your Platform Name'}
                  className="bg-slate-800 border-slate-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">Welcome Message</Label>
                <Textarea
                  id="welcomeMessage"
                  value={data.welcomeMessage}
                  onChange={(e) => setData(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                  placeholder="Welcome to your feedback platform..."
                  className="bg-slate-800 border-slate-600 resize-none"
                  rows={2}
                />
              </div>

              {/* Preview */}
              <div className="p-4 rounded-lg border border-slate-700 bg-slate-800/50">
                <p className="text-sm text-slate-400 mb-3">Login Page Preview</p>
                <div 
                  className="p-4 rounded-lg text-white text-center"
                  style={{ background: `linear-gradient(135deg, ${data.primaryColor}, ${data.secondaryColor})` }}
                >
                  {data.logoPreview ? (
                    <img src={data.logoPreview} alt="Logo" className="h-8 mx-auto mb-2 object-contain" />
                  ) : (
                    <span className="font-bold text-lg">{data.platformName || data.name || 'Your Platform'}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Invite Users */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteEmails">Invite Users</Label>
                <Textarea
                  id="inviteEmails"
                  value={data.inviteEmails}
                  onChange={(e) => setData(prev => ({ ...prev, inviteEmails: e.target.value }))}
                  placeholder="Enter email addresses, one per line or comma-separated&#10;john@company.com&#10;jane@company.com"
                  className="bg-slate-800 border-slate-600 resize-none"
                  rows={6}
                />
                <p className="text-xs text-slate-400">
                  Invitations will be sent after the organization is created.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-slate-700 bg-slate-800/50">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-white font-medium">Invitation Email Preview</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Invited users will receive a branded email with a link to join {data.name || 'the organization'} and set up their account.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-400">
                Tip: You can skip this step and invite users later from the organization management page.
              </p>
            </div>
          )}

          {/* Step 4: Settings */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <div>
                  <p className="text-white font-medium">Email Notifications</p>
                  <p className="text-sm text-slate-400">Send email notifications for feedback</p>
                </div>
                <Button
                  variant={data.enableEmailNotifications ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setData(prev => ({ ...prev, enableEmailNotifications: !prev.enableEmailNotifications }))}
                  className={data.enableEmailNotifications ? 'bg-amber-500 hover:bg-amber-600 text-black' : 'border-slate-600'}
                >
                  {data.enableEmailNotifications ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="feedbackReminder">Feedback Reminder (days)</Label>
                  <Input
                    id="feedbackReminder"
                    type="number"
                    value={data.feedbackReminderDays}
                    onChange={(e) => setData(prev => ({ ...prev, feedbackReminderDays: parseInt(e.target.value) || 7 }))}
                    min={1}
                    max={30}
                    className="bg-slate-800 border-slate-600"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={data.timezone}
                    onValueChange={(value) => setData(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select
                  value={data.dateFormat}
                  onValueChange={(value) => setData(prev => ({ ...prev, dateFormat: value }))}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="MM/dd/yyyy">MM/DD/YYYY (US)</SelectItem>
                    <SelectItem value="dd/MM/yyyy">DD/MM/YYYY (EU)</SelectItem>
                    <SelectItem value="yyyy-MM-dd">YYYY-MM-DD (ISO)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {step === 5 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Organization Created!</h3>
              <p className="text-slate-400 mb-6">
                {data.name} has been successfully set up.
              </p>

              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 max-w-md mx-auto">
                <p className="text-sm text-slate-400 mb-2">White-labeled Login URL</p>
                <div className="flex items-center gap-2">
                  <code className="text-amber-400 text-sm flex-1 truncate">{loginUrl}</code>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-400 hover:text-white"
                    onClick={copyLoginUrl}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-400 hover:text-white"
                    onClick={() => window.open(loginUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {data.billingEmail && (
                <p className="text-sm text-slate-400 mt-4">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Welcome email sent to {data.billingEmail}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between mt-6 pt-4 border-t border-slate-700">
          {step > 1 && step < 5 ? (
            <Button
              variant="outline"
              onClick={handleBack}
              className="border-slate-600 text-slate-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <Button
              onClick={handleNext}
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : step === 4 ? (
                <>
                  Complete Setup
                  <Check className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleClose}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              Done
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
