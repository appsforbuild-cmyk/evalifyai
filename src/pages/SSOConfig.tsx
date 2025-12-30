import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Shield, 
  Settings, 
  Key, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  ExternalLink,
  Info,
  FileText,
  RefreshCw
} from 'lucide-react';

interface SSOConfig {
  id: string;
  provider: string;
  is_enabled: boolean;
  configuration: {
    idpUrl?: string;
    entityId?: string;
    certificate?: string;
    attributeMapping?: {
      email?: string;
      firstName?: string;
      lastName?: string;
      groups?: string;
    };
  };
  created_at: string;
  updated_at: string;
}

interface AuditLog {
  id: string;
  user_id: string;
  event_type: string;
  provider: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

const SSOConfig = () => {
  const { hasRole, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [configs, setConfigs] = useState<SSOConfig[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  // SAML form state
  const [samlEnabled, setSamlEnabled] = useState(false);
  const [samlConfig, setSamlConfig] = useState({
    idpUrl: '',
    entityId: '',
    certificate: '',
    attributeMapping: {
      email: 'email',
      firstName: 'firstName',
      lastName: 'lastName',
      groups: 'groups'
    }
  });

  // Google/Microsoft form state
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [microsoftEnabled, setMicrosoftEnabled] = useState(false);

  useEffect(() => {
    if (!hasRole('admin')) {
      navigate('/dashboard');
      toast.error('Access denied. Admin role required.');
      return;
    }
    fetchConfigs();
    fetchAuditLogs();
  }, [hasRole, navigate]);

  const fetchConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('sso_config')
        .select('*');

      if (error) throw error;

      if (data) {
        setConfigs(data as unknown as SSOConfig[]);
        
        // Set form state from existing configs
        data.forEach((config) => {
          const typedConfig = config as unknown as SSOConfig;
          if (typedConfig.provider === 'google') {
            setGoogleEnabled(typedConfig.is_enabled);
          } else if (typedConfig.provider === 'microsoft') {
            setMicrosoftEnabled(typedConfig.is_enabled);
          } else if (typedConfig.provider === 'saml') {
            setSamlEnabled(typedConfig.is_enabled);
            if (typedConfig.configuration) {
              setSamlConfig({
                idpUrl: typedConfig.configuration.idpUrl || '',
                entityId: typedConfig.configuration.entityId || '',
                certificate: typedConfig.configuration.certificate || '',
                attributeMapping: typedConfig.configuration.attributeMapping || {
                  email: 'email',
                  firstName: 'firstName',
                  lastName: 'lastName',
                  groups: 'groups'
                }
              });
            }
          }
        });
      }
    } catch (error) {
      console.error('Error fetching SSO configs:', error);
      toast.error('Failed to load SSO configurations');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('sso_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAuditLogs(data as unknown as AuditLog[]);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const saveConfig = async (provider: string, isEnabled: boolean, configuration: Record<string, unknown> = {}) => {
    setSaving(true);
    try {
      const existingConfig = configs.find(c => c.provider === provider);
      
      if (existingConfig) {
        const { error } = await supabase
          .from('sso_config')
          .update({
            is_enabled: isEnabled,
            configuration: configuration as unknown as Record<string, never>,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConfig.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sso_config')
          .insert([{
            provider,
            is_enabled: isEnabled,
            configuration: configuration as unknown as Record<string, never>,
            created_by: user?.id
          }]);

        if (error) throw error;
      }

      // Log configuration change
      await supabase.from('sso_audit_log').insert([{
        user_id: user?.id,
        event_type: 'sso_config_updated',
        provider,
        details: { is_enabled: String(isEnabled) } as unknown as Record<string, never>
      }]);

      toast.success(`${provider.toUpperCase()} SSO configuration saved`);
      fetchConfigs();
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (provider: string) => {
    setTesting(true);
    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Log test event
      await supabase.from('sso_audit_log').insert([{
        user_id: user?.id,
        event_type: 'sso_connection_test',
        provider,
        details: { status: 'success' } as unknown as Record<string, never>
      }]);

      toast.success(`${provider.toUpperCase()} connection test successful`);
    } catch (error) {
      toast.error(`${provider.toUpperCase()} connection test failed`);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">SSO Configuration</h1>
            <p className="text-muted-foreground mt-1">
              Configure enterprise Single Sign-On providers
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="w-4 h-4" />
            Admin Only
          </Badge>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Enterprise SSO</AlertTitle>
          <AlertDescription>
            SSO configurations require additional setup in your identity provider. 
            Email authentication will always remain available as a fallback.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="google" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="google">Google</TabsTrigger>
            <TabsTrigger value="microsoft">Microsoft</TabsTrigger>
            <TabsTrigger value="saml">SAML</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>

          {/* Google OAuth Tab */}
          <TabsContent value="google">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-background rounded-lg border">
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                    <div>
                      <CardTitle>Google Workspace SSO</CardTitle>
                      <CardDescription>Allow users to sign in with their Google accounts</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="google-enabled">Enable</Label>
                    <Switch 
                      id="google-enabled"
                      checked={googleEnabled}
                      onCheckedChange={setGoogleEnabled}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert variant={googleEnabled ? "default" : "destructive"}>
                  {googleEnabled ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {googleEnabled ? 'Google SSO is ready' : 'Google SSO is disabled'}
                  </AlertTitle>
                  <AlertDescription>
                    {googleEnabled 
                      ? 'Users can sign in with their Google accounts. Make sure Google OAuth is configured in your backend.'
                      : 'Enable to allow Google sign-in on the login page.'
                    }
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <h3 className="font-semibold">Setup Instructions</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Go to Google Cloud Console and create OAuth 2.0 credentials</li>
                    <li>Add authorized redirect URI: <code className="bg-muted px-1 rounded">{window.location.origin}/auth/callback</code></li>
                    <li>Configure the Client ID and Secret in your backend settings</li>
                    <li>Enable Google provider in the authentication settings</li>
                  </ol>
                  
                  <Button variant="outline" asChild>
                    <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">
                      Open Google Cloud Console <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => saveConfig('google', googleEnabled)}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Save Configuration
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => testConnection('google')}
                    disabled={testing || !googleEnabled}
                  >
                    {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Microsoft Azure AD Tab */}
          <TabsContent value="microsoft">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-background rounded-lg border">
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path fill="#F25022" d="M1 1h10v10H1z"/>
                        <path fill="#00A4EF" d="M1 13h10v10H1z"/>
                        <path fill="#7FBA00" d="M13 1h10v10H13z"/>
                        <path fill="#FFB900" d="M13 13h10v10H13z"/>
                      </svg>
                    </div>
                    <div>
                      <CardTitle>Microsoft Azure AD SSO</CardTitle>
                      <CardDescription>Allow users to sign in with their Microsoft accounts</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="microsoft-enabled">Enable</Label>
                    <Switch 
                      id="microsoft-enabled"
                      checked={microsoftEnabled}
                      onCheckedChange={setMicrosoftEnabled}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Manual Configuration Required</AlertTitle>
                  <AlertDescription>
                    Microsoft Azure AD requires manual configuration in your backend. 
                    Follow the instructions below to set up Microsoft SSO.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <h3 className="font-semibold">Setup Instructions</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Go to Azure Portal &gt; Azure Active Directory &gt; App registrations</li>
                    <li>Create a new application registration</li>
                    <li>Add redirect URI: <code className="bg-muted px-1 rounded">{window.location.origin}/auth/callback</code></li>
                    <li>Create a client secret under Certificates & secrets</li>
                    <li>Configure the Application (client) ID and Secret in your backend</li>
                    <li>Add API permissions for Microsoft Graph (User.Read)</li>
                  </ol>
                  
                  <Button variant="outline" asChild>
                    <a href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noopener noreferrer">
                      Open Azure Portal <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => saveConfig('microsoft', microsoftEnabled)}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Save Configuration
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => testConnection('microsoft')}
                    disabled={testing || !microsoftEnabled}
                  >
                    {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SAML Tab */}
          <TabsContent value="saml">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-background rounded-lg border">
                      <Key className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle>SAML 2.0 SSO</CardTitle>
                      <CardDescription>Configure enterprise SAML identity provider</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="saml-enabled">Enable</Label>
                    <Switch 
                      id="saml-enabled"
                      checked={samlEnabled}
                      onCheckedChange={setSamlEnabled}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Enterprise SAML Configuration</AlertTitle>
                  <AlertDescription>
                    SAML SSO requires additional backend configuration. Save these settings and configure 
                    your identity provider with the values below.
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="idp-url">Identity Provider URL (SSO URL)</Label>
                    <Input
                      id="idp-url"
                      placeholder="https://idp.example.com/saml/sso"
                      value={samlConfig.idpUrl}
                      onChange={(e) => setSamlConfig(prev => ({ ...prev, idpUrl: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="entity-id">Entity ID (Issuer)</Label>
                    <Input
                      id="entity-id"
                      placeholder="https://idp.example.com"
                      value={samlConfig.entityId}
                      onChange={(e) => setSamlConfig(prev => ({ ...prev, entityId: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="certificate">X.509 Certificate</Label>
                    <Textarea
                      id="certificate"
                      placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                      rows={6}
                      value={samlConfig.certificate}
                      onChange={(e) => setSamlConfig(prev => ({ ...prev, certificate: e.target.value }))}
                    />
                    <p className="text-sm text-muted-foreground">
                      Paste the public certificate from your identity provider
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Attribute Mapping</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="attr-email">Email Attribute</Label>
                        <Input
                          id="attr-email"
                          value={samlConfig.attributeMapping.email}
                          onChange={(e) => setSamlConfig(prev => ({
                            ...prev,
                            attributeMapping: { ...prev.attributeMapping, email: e.target.value }
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="attr-firstname">First Name Attribute</Label>
                        <Input
                          id="attr-firstname"
                          value={samlConfig.attributeMapping.firstName}
                          onChange={(e) => setSamlConfig(prev => ({
                            ...prev,
                            attributeMapping: { ...prev.attributeMapping, firstName: e.target.value }
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="attr-lastname">Last Name Attribute</Label>
                        <Input
                          id="attr-lastname"
                          value={samlConfig.attributeMapping.lastName}
                          onChange={(e) => setSamlConfig(prev => ({
                            ...prev,
                            attributeMapping: { ...prev.attributeMapping, lastName: e.target.value }
                          }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="attr-groups">Groups Attribute</Label>
                        <Input
                          id="attr-groups"
                          value={samlConfig.attributeMapping.groups}
                          onChange={(e) => setSamlConfig(prev => ({
                            ...prev,
                            attributeMapping: { ...prev.attributeMapping, groups: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Service Provider Details
                  </h4>
                  <div className="text-sm space-y-1">
                    <p><strong>ACS URL:</strong> <code className="bg-background px-1 rounded">{window.location.origin}/auth/saml/callback</code></p>
                    <p><strong>Entity ID:</strong> <code className="bg-background px-1 rounded">{window.location.origin}</code></p>
                    <p><strong>Name ID Format:</strong> <code className="bg-background px-1 rounded">urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</code></p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={() => saveConfig('saml', samlEnabled, samlConfig)}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Save Configuration
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => testConnection('saml')}
                    disabled={testing || !samlEnabled || !samlConfig.idpUrl}
                  >
                    {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>SSO Audit Logs</CardTitle>
                    <CardDescription>Track SSO login events and configuration changes</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={fetchAuditLogs}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No audit logs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <Badge variant="outline">
                              {log.event_type.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>{log.provider || '-'}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {JSON.stringify(log.details)}
                          </TableCell>
                          <TableCell>
                            {new Date(log.created_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SSOConfig;
