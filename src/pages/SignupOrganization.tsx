import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2, User, CreditCard, Globe, Check, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import logo from '@/assets/evalifyai-logo.png';

const STORAGE_KEY = 'evalifyai_signup_progress';

// Step 1: Organization Info
const orgInfoSchema = z.object({
  organizationName: z.string().min(2, 'Organization name is required').max(100),
  companySize: z.string().min(1, 'Please select company size'),
  industry: z.string().min(1, 'Please select industry'),
});

// Step 2: Admin Account
const adminAccountSchema = z.object({
  fullName: z.string().min(2, 'Full name is required').max(100),
  email: z.string().email('Please enter a valid email'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  phone: z.string().optional(),
});

// Step 3: Plan Selection
const planSchema = z.object({
  plan: z.enum(['starter', 'professional', 'enterprise']),
  billingCycle: z.enum(['monthly', 'annual']),
});

// Step 4: Workspace Setup
const workspaceSchema = z.object({
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed'),
  timezone: z.string().min(1, 'Please select a timezone'),
});

type OrgInfoForm = z.infer<typeof orgInfoSchema>;
type AdminAccountForm = z.infer<typeof adminAccountSchema>;
type PlanForm = z.infer<typeof planSchema>;
type WorkspaceForm = z.infer<typeof workspaceSchema>;

const companySizes = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-1000', label: '201-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
];

const industries = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance & Banking' },
  { value: 'retail', label: 'Retail & E-commerce' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'education', label: 'Education' },
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'government', label: 'Government' },
  { value: 'nonprofit', label: 'Nonprofit' },
  { value: 'other', label: 'Other' },
];

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { value: 'UTC', label: 'UTC' },
];

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 29,
    annualPrice: 23,
    description: 'For small teams',
    features: ['Up to 50 users', 'Voice feedback', 'Basic analytics'],
    recommended: ['1-10', '11-50'],
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyPrice: 49,
    annualPrice: 39,
    description: 'For growing teams',
    features: ['Up to 500 users', 'Bias detection', 'SSO', 'Advanced analytics'],
    recommended: ['51-200', '201-1000'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: null,
    annualPrice: null,
    description: 'For large organizations',
    features: ['Unlimited users', 'White-label', 'API access', 'Dedicated support'],
    recommended: ['1000+'],
  },
];

const steps = [
  { id: 1, title: 'Organization', icon: Building2 },
  { id: 2, title: 'Account', icon: User },
  { id: 3, title: 'Plan', icon: CreditCard },
  { id: 4, title: 'Workspace', icon: Globe },
];

export default function SignupOrganization() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  
  // Form data stored across steps
  const [formData, setFormData] = useState<{
    orgInfo?: OrgInfoForm;
    adminAccount?: AdminAccountForm;
    plan?: PlanForm;
    workspace?: WorkspaceForm;
  }>({});

  // Load saved progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed.formData || {});
        setCurrentStep(parsed.currentStep || 1);
      } catch (e) {
        console.error('Failed to parse saved progress');
      }
    }
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ formData, currentStep }));
  }, [formData, currentStep]);

  // Step 1 Form
  const orgInfoForm = useForm<OrgInfoForm>({
    resolver: zodResolver(orgInfoSchema),
    defaultValues: formData.orgInfo || {
      organizationName: '',
      companySize: '',
      industry: '',
    },
  });

  // Step 2 Form
  const adminForm = useForm<AdminAccountForm>({
    resolver: zodResolver(adminAccountSchema),
    defaultValues: formData.adminAccount || {
      fullName: '',
      email: '',
      password: '',
      phone: '',
    },
  });

  // Step 3 Form
  const planForm = useForm<PlanForm>({
    resolver: zodResolver(planSchema),
    defaultValues: formData.plan || {
      plan: 'professional',
      billingCycle: 'annual',
    },
  });

  // Step 4 Form
  const workspaceForm = useForm<WorkspaceForm>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: formData.workspace || {
      slug: '',
      timezone: 'UTC',
    },
  });

  // Generate slug from organization name
  useEffect(() => {
    if (formData.orgInfo?.organizationName && !workspaceForm.getValues('slug')) {
      const slug = formData.orgInfo.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
      workspaceForm.setValue('slug', slug);
    }
  }, [formData.orgInfo?.organizationName, workspaceForm]);

  // Check slug availability
  const checkSlugAvailability = async (slug: string) => {
    if (slug.length < 3) {
      setSlugAvailable(null);
      return;
    }
    
    setCheckingSlug(true);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      
      setSlugAvailable(!data);
    } catch (error) {
      console.error('Error checking slug:', error);
    } finally {
      setCheckingSlug(false);
    }
  };

  // Watch slug changes
  useEffect(() => {
    const subscription = workspaceForm.watch((value, { name }) => {
      if (name === 'slug' && value.slug) {
        const timeoutId = setTimeout(() => checkSlugAvailability(value.slug as string), 500);
        return () => clearTimeout(timeoutId);
      }
    });
    return () => subscription.unsubscribe();
  }, [workspaceForm]);

  const handleStep1Submit = (data: OrgInfoForm) => {
    setFormData(prev => ({ ...prev, orgInfo: data }));
    
    // Pre-select plan based on company size
    const recommendedPlan = plans.find(p => p.recommended.includes(data.companySize))?.id || 'professional';
    planForm.setValue('plan', recommendedPlan as 'starter' | 'professional' | 'enterprise');
    
    setCurrentStep(2);
  };

  const handleStep2Submit = (data: AdminAccountForm) => {
    setFormData(prev => ({ ...prev, adminAccount: data }));
    setCurrentStep(3);
  };

  const handleStep3Submit = (data: PlanForm) => {
    setFormData(prev => ({ ...prev, plan: data }));
    setCurrentStep(4);
  };

  const handleFinalSubmit = async (data: WorkspaceForm) => {
    if (!formData.orgInfo || !formData.adminAccount || !formData.plan) {
      toast.error('Please complete all previous steps');
      return;
    }

    if (slugAvailable === false) {
      toast.error('This workspace URL is already taken');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.adminAccount.email,
        password: formData.adminAccount.password,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`,
          data: {
            full_name: formData.adminAccount.fullName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // 2. Create organization using the RPC function
      const { data: orgId, error: orgError } = await supabase.rpc('create_organization_with_owner', {
        _name: formData.orgInfo.organizationName,
        _slug: data.slug,
        _owner_id: authData.user.id,
      });

      if (orgError) throw orgError;

      // 3. Update organization with additional details
      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          plan: formData.plan.plan,
          billing_email: formData.adminAccount.email,
        })
        .eq('id', orgId);

      if (updateError) console.error('Failed to update organization:', updateError);

      // 4. Update organization settings
      const { error: settingsError } = await supabase
        .from('organization_settings')
        .update({
          timezone: data.timezone,
          custom_branding: {
            industry: formData.orgInfo.industry,
            companySize: formData.orgInfo.companySize,
          },
        })
        .eq('organization_id', orgId);

      if (settingsError) console.error('Failed to update settings:', settingsError);

      // 5. Assign owner role
      await supabase.from('user_roles').insert({
        user_id: authData.user.id,
        role: 'admin',
        organization_id: orgId,
      });

      // Clear saved progress
      localStorage.removeItem(STORAGE_KEY);

      toast.success('Organization created successfully!');
      navigate('/onboarding');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Failed to create organization');
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    return strength;
  };

  const passwordStrength = getPasswordStrength(adminForm.watch('password') || '');

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Header */}
      <header className="p-6">
        <img src={logo} alt="EvalifyAI" className="h-10 w-auto" />
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div 
                    className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                      ${currentStep >= step.id 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : 'border-muted-foreground/30 text-muted-foreground'
                      }
                    `}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div 
                      className={`
                        w-16 md:w-24 h-0.5 mx-2
                        ${currentStep > step.id ? 'bg-primary' : 'bg-muted-foreground/30'}
                      `}
                    />
                  )}
                </div>
              ))}
            </div>
            <Progress value={(currentStep / steps.length) * 100} className="h-1" />
          </div>

          {/* Step 1: Organization Info */}
          {currentStep === 1 && (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Tell us about your organization</CardTitle>
                <CardDescription>This helps us customize your experience</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={orgInfoForm.handleSubmit(handleStep1Submit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="organizationName">Organization Name</Label>
                    <Input
                      id="organizationName"
                      placeholder="Acme Corporation"
                      {...orgInfoForm.register('organizationName')}
                    />
                    {orgInfoForm.formState.errors.organizationName && (
                      <p className="text-sm text-destructive">{orgInfoForm.formState.errors.organizationName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companySize">Company Size</Label>
                    <Select
                      value={orgInfoForm.watch('companySize')}
                      onValueChange={(value) => orgInfoForm.setValue('companySize', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select company size" />
                      </SelectTrigger>
                      <SelectContent>
                        {companySizes.map((size) => (
                          <SelectItem key={size.value} value={size.value}>
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {orgInfoForm.formState.errors.companySize && (
                      <p className="text-sm text-destructive">{orgInfoForm.formState.errors.companySize.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select
                      value={orgInfoForm.watch('industry')}
                      onValueChange={(value) => orgInfoForm.setValue('industry', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry.value} value={industry.value}>
                            {industry.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {orgInfoForm.formState.errors.industry && (
                      <p className="text-sm text-destructive">{orgInfoForm.formState.errors.industry.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" size="lg">
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Admin Account */}
          {currentStep === 2 && (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Create your admin account</CardTitle>
                <CardDescription>You'll be the owner of this organization</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={adminForm.handleSubmit(handleStep2Submit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      placeholder="John Smith"
                      {...adminForm.register('fullName')}
                    />
                    {adminForm.formState.errors.fullName && (
                      <p className="text-sm text-destructive">{adminForm.formState.errors.fullName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Work Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@company.com"
                      {...adminForm.register('email')}
                    />
                    {adminForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{adminForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        {...adminForm.register('password')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <Progress value={passwordStrength} className="h-1" />
                      <p className="text-xs text-muted-foreground">
                        {passwordStrength < 50 && 'Weak'}
                        {passwordStrength >= 50 && passwordStrength < 100 && 'Getting stronger...'}
                        {passwordStrength === 100 && 'Strong password!'}
                      </p>
                    </div>
                    {adminForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{adminForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      {...adminForm.register('phone')}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button type="button" variant="outline" onClick={goBack} className="flex-1">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button type="submit" className="flex-1">
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Plan Selection */}
          {currentStep === 3 && (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Choose your plan</CardTitle>
                <CardDescription>Start with a 14-day free trial. No credit card required.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={planForm.handleSubmit(handleStep3Submit)} className="space-y-6">
                  {/* Billing Toggle */}
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <button
                      type="button"
                      className={`text-sm font-medium ${planForm.watch('billingCycle') === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}
                      onClick={() => planForm.setValue('billingCycle', 'monthly')}
                    >
                      Monthly
                    </button>
                    <div 
                      className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${planForm.watch('billingCycle') === 'annual' ? 'bg-primary' : 'bg-muted'}`}
                      onClick={() => planForm.setValue('billingCycle', planForm.watch('billingCycle') === 'annual' ? 'monthly' : 'annual')}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${planForm.watch('billingCycle') === 'annual' ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </div>
                    <button
                      type="button"
                      className={`text-sm font-medium ${planForm.watch('billingCycle') === 'annual' ? 'text-foreground' : 'text-muted-foreground'}`}
                      onClick={() => planForm.setValue('billingCycle', 'annual')}
                    >
                      Annual
                    </button>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">Save 20%</Badge>
                  </div>

                  <div className="grid gap-4">
                    {plans.map((plan) => {
                      const isRecommended = plan.recommended.includes(formData.orgInfo?.companySize || '');
                      const isSelected = planForm.watch('plan') === plan.id;
                      const price = planForm.watch('billingCycle') === 'annual' ? plan.annualPrice : plan.monthlyPrice;

                      return (
                        <div
                          key={plan.id}
                          className={`
                            relative p-4 rounded-lg border-2 cursor-pointer transition-all
                            ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                          `}
                          onClick={() => planForm.setValue('plan', plan.id as 'starter' | 'professional' | 'enterprise')}
                        >
                          {isRecommended && (
                            <Badge className="absolute -top-2 right-4 bg-primary">Recommended</Badge>
                          )}
                          <div className="flex items-start gap-4">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                              {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold">{plan.name}</h3>
                                <div>
                                  {price ? (
                                    <>
                                      <span className="text-2xl font-bold">${price}</span>
                                      <span className="text-muted-foreground">/user/mo</span>
                                    </>
                                  ) : (
                                    <span className="text-lg font-semibold">Custom</span>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{plan.description}</p>
                              <div className="flex flex-wrap gap-2">
                                {plan.features.map((feature) => (
                                  <Badge key={feature} variant="secondary" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-4">
                    <Button type="button" variant="outline" onClick={goBack} className="flex-1">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button type="submit" className="flex-1">
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Workspace Setup */}
          {currentStep === 4 && (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Set up your workspace</CardTitle>
                <CardDescription>Choose your workspace URL and timezone</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={workspaceForm.handleSubmit(handleFinalSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="slug">Workspace URL</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm whitespace-nowrap">evalifyai.com/</span>
                      <div className="relative flex-1">
                        <Input
                          id="slug"
                          placeholder="your-company"
                          {...workspaceForm.register('slug')}
                          className={`${slugAvailable === false ? 'border-destructive' : slugAvailable === true ? 'border-green-500' : ''}`}
                        />
                        {checkingSlug && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        {!checkingSlug && slugAvailable === true && (
                          <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>
                    {workspaceForm.formState.errors.slug && (
                      <p className="text-sm text-destructive">{workspaceForm.formState.errors.slug.message}</p>
                    )}
                    {slugAvailable === false && (
                      <p className="text-sm text-destructive">This URL is already taken</p>
                    )}
                    {slugAvailable === true && (
                      <p className="text-sm text-green-600">This URL is available!</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={workspaceForm.watch('timezone')}
                      onValueChange={(value) => workspaceForm.setValue('timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Your workspace will be ready at:</p>
                    <p className="font-semibold text-lg">
                      {workspaceForm.watch('slug') || 'your-company'}.evalifyai.com
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <Button type="button" variant="outline" onClick={goBack} className="flex-1" disabled={isLoading}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isLoading || slugAvailable === false}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          Create Workspace
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Sign in link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <a href="/auth" className="text-primary hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
