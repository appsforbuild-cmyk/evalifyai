import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useBranding, type BrandingSettings as BrandingSettingsType } from '@/contexts/BrandingContext';
import { supabase } from '@/integrations/supabase/client';
import ColorPicker from '@/components/branding/ColorPicker';
import BrandingPreview from '@/components/branding/BrandingPreview';
import LogoUpload from '@/components/branding/LogoUpload';
import UpgradePrompt from '@/components/branding/UpgradePrompt';
import { 
  Palette, 
  Type, 
  Image, 
  Mail, 
  Globe, 
  Settings,
  Loader2,
  RotateCcw,
  Save,
  Eye
} from 'lucide-react';

const GOOGLE_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
  'Nunito', 'Raleway', 'Work Sans', 'DM Sans', 'Plus Jakarta Sans',
  'Source Sans Pro', 'Ubuntu', 'Mulish', 'Quicksand', 'Karla',
  'Barlow', 'Manrope', 'Space Grotesk', 'Outfit',
  'Playfair Display', 'Merriweather', 'Lora', 'PT Serif', 'Crimson Text',
];

const BrandingSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentOrganization, organizationSettings, refreshOrganization, isOrgOwner, isOrgAdmin } = useOrganization();
  const { branding: currentBranding, resetToDefaults } = useBranding();
  
  const [branding, setBranding] = useState<BrandingSettingsType>(currentBranding);
  const [emailFooter, setEmailFooter] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [domainStatus, setDomainStatus] = useState<'none' | 'pending' | 'verified' | 'active'>('none');
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const isEnterprise = currentOrganization?.plan === 'enterprise';
  const canEdit = isOrgOwner || isOrgAdmin;

  useEffect(() => {
    if (currentBranding) {
      setBranding(currentBranding);
    }
    if (organizationSettings) {
      const customBrandingData = organizationSettings.custom_branding as Record<string, unknown> || {};
      setEmailFooter((customBrandingData.email_footer_content as string) || '');
    }
    if (currentOrganization?.domain) {
      setCustomDomain(currentOrganization.domain);
      setDomainStatus('active');
    }
  }, [currentBranding, organizationSettings, currentOrganization]);

  const updateBrandingField = <K extends keyof BrandingSettingsType>(field: K, value: BrandingSettingsType[K]) => {
    setBranding(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!currentOrganization) return;
    
    setIsSaving(true);
    try {
      // Update organization branding
      const { error: orgError } = await supabase
        .from('organizations')
        .update({
          logo_url: branding.logoUrl,
          primary_color: branding.primaryColor,
          secondary_color: branding.secondaryColor,
        })
        .eq('id', currentOrganization.id);

      if (orgError) throw orgError;

      // Update organization settings with full branding
      const customBrandingData = {
        primary_color: branding.primaryColor,
        secondary_color: branding.secondaryColor,
        accent_color: branding.accentColor,
        error_color: branding.errorColor,
        background_color: branding.backgroundColor,
        logo_icon_url: branding.logoIconUrl,
        font_heading: branding.fontHeading,
        font_body: branding.fontBody,
        platform_name: branding.platformName,
        powered_by_enabled: branding.poweredByEnabled,
        email_footer_content: emailFooter,
      };

      const { error: settingsError } = await supabase
        .from('organization_settings')
        .update({ custom_branding: customBrandingData })
        .eq('organization_id', currentOrganization.id);

      if (settingsError) throw settingsError;

      await refreshOrganization();
      toast({ title: 'Branding saved successfully!' });
    } catch (error: any) {
      toast({
        title: 'Failed to save branding',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!customDomain) return;
    
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-custom-domain', {
        body: { domain: customDomain, organizationId: currentOrganization?.id },
      });

      if (error) throw error;
      
      if (data.verified) {
        setDomainStatus('verified');
        toast({ title: 'Domain verified successfully!' });
      } else {
        toast({
          title: 'Domain verification pending',
          description: 'DNS records not found. Please check your settings.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Verification failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReset = () => {
    resetToDefaults();
    setBranding({
      primaryColor: '#6366f1',
      secondaryColor: '#8b5cf6',
      accentColor: '#10b981',
      errorColor: '#ef4444',
      backgroundColor: '#ffffff',
      logoUrl: null,
      logoIconUrl: null,
      fontHeading: 'Inter',
      fontBody: 'Inter',
      platformName: 'EvalifyAI',
      poweredByEnabled: true,
    });
    toast({ title: 'Branding reset to defaults' });
  };

  if (!canEdit) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                You don't have permission to edit branding settings.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Branding Settings</h1>
            <p className="text-muted-foreground">
              Customize the look and feel of your {branding.platformName} instance
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button variant="outline" onClick={() => navigate('/settings/branding/preview')}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="logo" className="space-y-4">
              <TabsList className="grid grid-cols-6 w-full">
                <TabsTrigger value="logo" className="gap-1">
                  <Image className="w-4 h-4" />
                  <span className="hidden sm:inline">Logo</span>
                </TabsTrigger>
                <TabsTrigger value="colors" className="gap-1">
                  <Palette className="w-4 h-4" />
                  <span className="hidden sm:inline">Colors</span>
                </TabsTrigger>
                <TabsTrigger value="typography" className="gap-1">
                  <Type className="w-4 h-4" />
                  <span className="hidden sm:inline">Fonts</span>
                </TabsTrigger>
                <TabsTrigger value="email" className="gap-1">
                  <Mail className="w-4 h-4" />
                  <span className="hidden sm:inline">Email</span>
                </TabsTrigger>
                <TabsTrigger value="domain" className="gap-1">
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">Domain</span>
                </TabsTrigger>
                <TabsTrigger value="platform" className="gap-1">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Platform</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="logo">
                <Card>
                  <CardHeader>
                    <CardTitle>Logo & Favicon</CardTitle>
                    <CardDescription>
                      Upload your company logo and favicon
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <LogoUpload
                      label="Primary Logo"
                      value={branding.logoUrl}
                      onChange={(url) => updateBrandingField('logoUrl', url)}
                      organizationId={currentOrganization?.id || ''}
                      type="logo"
                      maxSize={2048}
                      recommendedSize="200x50px"
                    />
                    
                    <LogoUpload
                      label="Logo Icon (Favicon)"
                      value={branding.logoIconUrl}
                      onChange={(url) => updateBrandingField('logoIconUrl', url)}
                      organizationId={currentOrganization?.id || ''}
                      type="icon"
                      maxSize={500}
                      recommendedSize="192x192px"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="colors">
                <Card>
                  <CardHeader>
                    <CardTitle>Color Scheme</CardTitle>
                    <CardDescription>
                      Customize your brand colors. Accessibility compliance is shown for each color.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <ColorPicker
                        label="Primary Color"
                        value={branding.primaryColor}
                        onChange={(v) => updateBrandingField('primaryColor', v)}
                        description="Used for buttons, links, and main accents"
                        contrastAgainst="#ffffff"
                      />
                      <ColorPicker
                        label="Secondary Color"
                        value={branding.secondaryColor}
                        onChange={(v) => updateBrandingField('secondaryColor', v)}
                        description="Used for hover states and secondary actions"
                        contrastAgainst="#ffffff"
                      />
                      <ColorPicker
                        label="Accent Color"
                        value={branding.accentColor}
                        onChange={(v) => updateBrandingField('accentColor', v)}
                        description="Used for success states and highlights"
                        contrastAgainst="#ffffff"
                      />
                      <ColorPicker
                        label="Error Color"
                        value={branding.errorColor}
                        onChange={(v) => updateBrandingField('errorColor', v)}
                        description="Used for errors and destructive actions"
                        contrastAgainst="#ffffff"
                      />
                      <ColorPicker
                        label="Background Color"
                        value={branding.backgroundColor}
                        onChange={(v) => updateBrandingField('backgroundColor', v)}
                        description="Page background color"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="typography">
                <Card>
                  <CardHeader>
                    <CardTitle>Typography</CardTitle>
                    <CardDescription>
                      Choose fonts for headings and body text
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Heading Font</Label>
                        <Select
                          value={branding.fontHeading}
                          onValueChange={(v) => updateBrandingField('fontHeading', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {GOOGLE_FONTS.map(font => (
                              <SelectItem key={font} value={font}>
                                <span style={{ fontFamily: font }}>{font}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p 
                          className="text-xl font-semibold mt-2"
                          style={{ fontFamily: branding.fontHeading }}
                        >
                          The quick brown fox
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Body Font</Label>
                        <Select
                          value={branding.fontBody}
                          onValueChange={(v) => updateBrandingField('fontBody', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {GOOGLE_FONTS.map(font => (
                              <SelectItem key={font} value={font}>
                                <span style={{ fontFamily: font }}>{font}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p 
                          className="text-sm mt-2"
                          style={{ fontFamily: branding.fontBody }}
                        >
                          The quick brown fox jumps over the lazy dog. 
                          This text previews your body font at normal size.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="email">
                <Card>
                  <CardHeader>
                    <CardTitle>Email Branding</CardTitle>
                    <CardDescription>
                      Customize how emails from your platform look
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <LogoUpload
                      label="Email Header Logo"
                      value={branding.logoUrl}
                      onChange={(url) => updateBrandingField('logoUrl', url)}
                      organizationId={currentOrganization?.id || ''}
                      type="email"
                      maxSize={1024}
                      recommendedSize="400x100px"
                    />
                    
                    <div className="space-y-2">
                      <Label>Email Footer Content</Label>
                      <Textarea
                        value={emailFooter}
                        onChange={(e) => setEmailFooter(e.target.value)}
                        placeholder="Company address, social links, etc."
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground">
                        Unsubscribe link is automatically added to all emails.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="domain">
                {!isEnterprise ? (
                  <UpgradePrompt 
                    feature="Custom Domain" 
                    description="Use your own domain like feedback.yourcompany.com"
                  />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Custom Domain</CardTitle>
                      <CardDescription>
                        Use your own domain for a fully branded experience
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="bg-muted rounded-lg p-4">
                        <p className="text-sm font-medium">Current Domain</p>
                        <p className="text-muted-foreground">
                          {currentOrganization?.slug}.evalifyai.com
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Custom Domain</Label>
                        <div className="flex gap-2">
                          <Input
                            value={customDomain}
                            onChange={(e) => setCustomDomain(e.target.value)}
                            placeholder="feedback.yourcompany.com"
                          />
                          <Button 
                            onClick={handleVerifyDomain}
                            disabled={isVerifying || !customDomain}
                          >
                            {isVerifying ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Verify'
                            )}
                          </Button>
                        </div>
                      </div>

                      {customDomain && (
                        <div className="bg-muted rounded-lg p-4 space-y-3">
                          <p className="text-sm font-medium">DNS Configuration</p>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <code className="bg-background px-2 py-1 rounded">CNAME</code>
                              <span className="text-muted-foreground">→</span>
                              <code className="bg-background px-2 py-1 rounded">
                                cname.evalifyai.com
                              </code>
                            </div>
                            <div className="flex items-center gap-2">
                              <code className="bg-background px-2 py-1 rounded">TXT</code>
                              <span className="text-muted-foreground">_evalify →</span>
                              <code className="bg-background px-2 py-1 rounded text-xs">
                                verify={currentOrganization?.id?.slice(0, 8)}
                              </code>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="platform">
                <Card>
                  <CardHeader>
                    <CardTitle>Platform Settings</CardTitle>
                    <CardDescription>
                      Customize platform name and branding visibility
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label>Platform Name</Label>
                      <Input
                        value={branding.platformName}
                        onChange={(e) => updateBrandingField('platformName', e.target.value)}
                        placeholder="EvalifyAI"
                      />
                      <p className="text-xs text-muted-foreground">
                        Used in emails, page titles, and throughout the app
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Show "Powered by EvalifyAI"</p>
                        <p className="text-sm text-muted-foreground">
                          {isEnterprise 
                            ? 'Display attribution in footer' 
                            : 'Enterprise plan required to hide'}
                        </p>
                      </div>
                      <Switch
                        checked={branding.poweredByEnabled}
                        onCheckedChange={(v) => updateBrandingField('poweredByEnabled', v)}
                        disabled={!isEnterprise}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-sm">Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <BrandingPreview branding={branding} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BrandingSettings;
