import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Upload, Building2, Palette, Globe, Copy, ExternalLink } from 'lucide-react';

interface CreateOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  slug: string;
  domain: string;
  plan: 'starter' | 'professional' | 'enterprise';
  status: 'trial' | 'active';
  maxUsers: number;
  billingEmail: string;
  primaryColor: string;
  secondaryColor: string;
  platformName: string;
  welcomeMessage: string;
}

const DEFAULT_FORM_DATA: FormData = {
  name: '',
  slug: '',
  domain: '',
  plan: 'starter',
  status: 'trial',
  maxUsers: 10,
  billingEmail: '',
  primaryColor: '#6366f1',
  secondaryColor: '#8b5cf6',
  platformName: '',
  welcomeMessage: '',
};

export default function CreateOrganizationModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateOrganizationModalProps) {
  const { logAction } = useSuperAdmin();
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.svg', '.webp'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
      platformName: prev.platformName || name,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }

    if (formData.billingEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.billingEmail)) {
      newErrors.billingEmail = 'Invalid email format';
    }

    if (formData.maxUsers < 1) {
      newErrors.maxUsers = 'Must have at least 1 user seat';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      let logoUrl: string | null = null;

      // Upload logo if provided
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${formData.slug}-logo-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('branding')
          .upload(fileName, logoFile);

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
          name: formData.name,
          slug: formData.slug,
          domain: formData.domain || null,
          plan: formData.plan,
          status: formData.status,
          max_users: formData.maxUsers,
          billing_email: formData.billingEmail || null,
          logo_url: logoUrl,
          primary_color: formData.primaryColor,
          secondary_color: formData.secondaryColor,
        })
        .select()
        .single();

      if (orgError) {
        if (orgError.code === '23505') {
          toast.error('An organization with this slug already exists');
          setErrors({ slug: 'This slug is already taken' });
          return;
        }
        throw orgError;
      }

      // Create organization settings
      const { error: settingsError } = await supabase
        .from('organization_settings')
        .insert({
          organization_id: org.id,
          platform_name: formData.platformName || formData.name,
          primary_color: formData.primaryColor,
          secondary_color: formData.secondaryColor,
          company_name: formData.name,
          custom_branding: {
            welcome_message: formData.welcomeMessage,
          },
        });

      if (settingsError) throw settingsError;

      await logAction('create_organization', 'organization', org.id, {
        name: formData.name,
        slug: formData.slug,
        plan: formData.plan,
      });

      toast.success('Organization created successfully!');
      
      // Reset form
      setFormData(DEFAULT_FORM_DATA);
      setLogoFile(null);
      setLogoPreview(null);
      setErrors({});
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error('Failed to create organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loginUrl = formData.slug 
    ? `${window.location.origin}/login/${formData.slug}`
    : '';

  const copyLoginUrl = () => {
    navigator.clipboard.writeText(loginUrl);
    toast.success('Login URL copied to clipboard');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-5 w-5 text-amber-500" />
            Create New Organization
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Set up a new client with their own branded login page and settings.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="mt-4">
          <TabsList className="bg-slate-800 border border-slate-700 w-full">
            <TabsTrigger 
              value="basic" 
              className="flex-1 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500"
            >
              Basic Info
            </TabsTrigger>
            <TabsTrigger 
              value="branding"
              className="flex-1 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500"
            >
              Branding
            </TabsTrigger>
            <TabsTrigger 
              value="settings"
              className="flex-1 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500"
            >
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                value={formData.name}
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
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                  placeholder="acme-corp"
                  className={`bg-slate-800 border-slate-600 ${errors.slug ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.slug && <p className="text-sm text-red-400">{errors.slug}</p>}
            </div>

            {loginUrl && (
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-sm text-slate-400 mb-1">White-labeled Login URL</p>
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
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan">Plan</Label>
                <Select
                  value={formData.plan}
                  onValueChange={(value: FormData['plan']) => setFormData(prev => ({ ...prev, plan: value }))}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="starter">Starter ($29/mo)</SelectItem>
                    <SelectItem value="professional">Professional ($49/mo)</SelectItem>
                    <SelectItem value="enterprise">Enterprise (Custom)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: FormData['status']) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="trial">Trial (14 days)</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxUsers">Max Users</Label>
                <Input
                  id="maxUsers"
                  type="number"
                  value={formData.maxUsers}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxUsers: parseInt(e.target.value) || 10 }))}
                  min={1}
                  className={`bg-slate-800 border-slate-600 ${errors.maxUsers ? 'border-red-500' : ''}`}
                />
                {errors.maxUsers && <p className="text-sm text-red-400">{errors.maxUsers}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="billingEmail">Billing Email</Label>
                <Input
                  id="billingEmail"
                  type="email"
                  value={formData.billingEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, billingEmail: e.target.value }))}
                  placeholder="billing@acme.com"
                  className={`bg-slate-800 border-slate-600 ${errors.billingEmail ? 'border-red-500' : ''}`}
                />
                {errors.billingEmail && <p className="text-sm text-red-400">{errors.billingEmail}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Custom Domain (optional)</Label>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-slate-400" />
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                  placeholder="feedback.acme.com"
                  className="bg-slate-800 border-slate-600"
                />
              </div>
            </div>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Logo</Label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-amber-500 bg-amber-500/10' 
                    : 'border-slate-600 hover:border-slate-500'
                }`}
              >
                <input {...getInputProps()} />
                {logoPreview ? (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-16 max-w-48 object-contain"
                    />
                    <p className="text-sm text-slate-400">Click or drag to replace</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-slate-400" />
                    <p className="text-sm text-slate-400">
                      Drop logo here or click to upload
                    </p>
                    <p className="text-xs text-slate-500">PNG, JPG, SVG up to 5MB</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Primary Color
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="primaryColor"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-10 h-10 rounded cursor-pointer border-0"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="bg-slate-800 border-slate-600 font-mono"
                    maxLength={7}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryColor" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Secondary Color
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="secondaryColor"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="w-10 h-10 rounded cursor-pointer border-0"
                  />
                  <Input
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="bg-slate-800 border-slate-600 font-mono"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>

            {/* Live Preview */}
            <div className="space-y-2">
              <Label>Login Page Preview</Label>
              <div className="bg-slate-950 rounded-lg p-6 border border-slate-700">
                <div className="max-w-xs mx-auto bg-slate-900 rounded-lg p-4 shadow-lg">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Preview" className="h-8 mx-auto mb-3 object-contain" />
                  ) : (
                    <div 
                      className="h-8 w-8 mx-auto mb-3 rounded flex items-center justify-center"
                      style={{ backgroundColor: formData.primaryColor }}
                    >
                      <Building2 className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <h3 
                    className="text-center text-sm font-semibold mb-1"
                    style={{ color: formData.primaryColor }}
                  >
                    Welcome Back
                  </h3>
                  <p className="text-center text-xs text-slate-400 mb-3">
                    Sign in to {formData.platformName || formData.name || 'Your Platform'}
                  </p>
                  <div className="space-y-2">
                    <div className="h-8 bg-slate-800 rounded border border-slate-700" />
                    <div className="h-8 bg-slate-800 rounded border border-slate-700" />
                    <div 
                      className="h-8 rounded flex items-center justify-center text-xs text-white font-medium"
                      style={{ backgroundColor: formData.primaryColor }}
                    >
                      Sign In
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="platformName">Platform Name</Label>
              <Input
                id="platformName"
                value={formData.platformName}
                onChange={(e) => setFormData(prev => ({ ...prev, platformName: e.target.value }))}
                placeholder="Acme Feedback Portal"
                className="bg-slate-800 border-slate-600"
              />
              <p className="text-xs text-slate-500">
                Displayed on the login page and throughout the platform
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="welcomeMessage">Welcome Message (optional)</Label>
              <Textarea
                id="welcomeMessage"
                value={formData.welcomeMessage}
                onChange={(e) => setFormData(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                placeholder="Welcome to our feedback platform. Sign in to get started."
                className="bg-slate-800 border-slate-600 min-h-[80px]"
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-600 text-slate-300"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Organization'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
