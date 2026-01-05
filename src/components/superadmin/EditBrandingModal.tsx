import React, { useState, useCallback, useEffect } from 'react';
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
import { toast } from 'sonner';
import { Loader2, Upload, Palette, Save } from 'lucide-react';

interface EditBrandingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onSuccess: () => void;
}

interface BrandingData {
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  platformName: string;
  welcomeMessage: string;
  emailFooterContent: string;
}

export default function EditBrandingModal({
  open,
  onOpenChange,
  organizationId,
  onSuccess,
}: EditBrandingModalProps) {
  const { logAction } = useSuperAdmin();
  const [branding, setBranding] = useState<BrandingData>({
    logoUrl: null,
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    platformName: '',
    welcomeMessage: '',
    emailFooterContent: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && organizationId) {
      fetchBranding();
    }
  }, [open, organizationId]);

  const fetchBranding = async () => {
    setIsLoading(true);
    try {
      // Fetch organization data
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('logo_url, primary_color, secondary_color, name')
        .eq('id', organizationId)
        .single();

      if (orgError) throw orgError;

      // Fetch settings
      const { data: settings, error: settingsError } = await supabase
        .from('organization_settings')
        .select('platform_name, custom_branding, email_footer_content')
        .eq('organization_id', organizationId)
        .single();

      const customBranding = (settings?.custom_branding as Record<string, string>) || {};

      setBranding({
        logoUrl: org.logo_url,
        primaryColor: org.primary_color || '#6366f1',
        secondaryColor: org.secondary_color || '#8b5cf6',
        platformName: settings?.platform_name || org.name || '',
        welcomeMessage: customBranding.welcome_message || '',
        emailFooterContent: settings?.email_footer_content || '',
      });

      if (org.logo_url) {
        setLogoPreview(org.logo_url);
      }
    } catch (error) {
      console.error('Error fetching branding:', error);
      toast.error('Failed to load branding settings');
    } finally {
      setIsLoading(false);
    }
  };

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
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  const handleSave = async () => {
    setIsSaving(true);

    try {
      let logoUrl = branding.logoUrl;

      // Upload new logo if provided
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${organizationId}-logo-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('branding')
          .upload(fileName, logoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('branding')
          .getPublicUrl(fileName);
        
        logoUrl = publicUrl;
      }

      // Update organization
      const { error: orgError } = await supabase
        .from('organizations')
        .update({
          logo_url: logoUrl,
          primary_color: branding.primaryColor,
          secondary_color: branding.secondaryColor,
        })
        .eq('id', organizationId);

      if (orgError) throw orgError;

      // Update organization settings
      const { error: settingsError } = await supabase
        .from('organization_settings')
        .update({
          platform_name: branding.platformName,
          primary_color: branding.primaryColor,
          secondary_color: branding.secondaryColor,
          email_footer_content: branding.emailFooterContent,
          custom_branding: {
            welcome_message: branding.welcomeMessage,
          },
        })
        .eq('organization_id', organizationId);

      if (settingsError) throw settingsError;

      await logAction('update_branding', 'organization', organizationId, {
        changes: ['logo', 'colors', 'platform_name'],
      });

      toast.success('Branding updated successfully!');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving branding:', error);
      toast.error('Failed to save branding');
    } finally {
      setIsSaving(false);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setBranding(prev => ({ ...prev, logoUrl: null }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Palette className="h-5 w-5 text-amber-500" />
            Edit Branding
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Update the organization's branding settings.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {/* Logo Upload */}
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
                    <div className="flex gap-2">
                      <span className="text-sm text-slate-400">Click or drag to replace</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeLogo();
                        }}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
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

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Primary Color
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={branding.primaryColor}
                    onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-10 h-10 rounded cursor-pointer border-0"
                  />
                  <Input
                    value={branding.primaryColor}
                    onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="bg-slate-800 border-slate-600 font-mono"
                    maxLength={7}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Secondary Color
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={branding.secondaryColor}
                    onChange={(e) => setBranding(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="w-10 h-10 rounded cursor-pointer border-0"
                  />
                  <Input
                    value={branding.secondaryColor}
                    onChange={(e) => setBranding(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="bg-slate-800 border-slate-600 font-mono"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>

            {/* Platform Name */}
            <div className="space-y-2">
              <Label htmlFor="platformName">Platform Name</Label>
              <Input
                id="platformName"
                value={branding.platformName}
                onChange={(e) => setBranding(prev => ({ ...prev, platformName: e.target.value }))}
                placeholder="Your Platform Name"
                className="bg-slate-800 border-slate-600"
              />
              <p className="text-xs text-slate-400">
                This name appears in the login page and emails.
              </p>
            </div>

            {/* Welcome Message */}
            <div className="space-y-2">
              <Label htmlFor="welcomeMessage">Welcome Message</Label>
              <Textarea
                id="welcomeMessage"
                value={branding.welcomeMessage}
                onChange={(e) => setBranding(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                placeholder="Welcome to your feedback platform..."
                className="bg-slate-800 border-slate-600 resize-none"
                rows={2}
              />
            </div>

            {/* Email Footer */}
            <div className="space-y-2">
              <Label htmlFor="emailFooter">Email Footer Content</Label>
              <Textarea
                id="emailFooter"
                value={branding.emailFooterContent}
                onChange={(e) => setBranding(prev => ({ ...prev, emailFooterContent: e.target.value }))}
                placeholder="Questions? Contact us at support@company.com"
                className="bg-slate-800 border-slate-600 resize-none"
                rows={2}
              />
            </div>

            {/* Preview */}
            <div className="p-4 rounded-lg border border-slate-700 bg-slate-800/50">
              <p className="text-sm text-slate-400 mb-3">Preview</p>
              <div 
                className="p-4 rounded-lg text-white text-center"
                style={{ 
                  background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})` 
                }}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="h-8 mx-auto mb-2 object-contain" />
                ) : (
                  <span className="font-bold text-lg">{branding.platformName || 'Your Platform'}</span>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-600 text-slate-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="bg-amber-500 hover:bg-amber-600 text-black"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
