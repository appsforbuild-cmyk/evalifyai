import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useBranding } from '@/contexts/BrandingContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { 
  ArrowLeft, 
  SplitSquareHorizontal, 
  Maximize2, 
  Home,
  Users,
  BarChart3,
  Settings,
  Bell,
  MessageSquare,
  Plus,
  Search,
  Check
} from 'lucide-react';
import logo from '@/assets/evalifyai-logo.png';

const BrandingPreview = () => {
  const navigate = useNavigate();
  const { branding } = useBranding();
  const { currentOrganization } = useOrganization();
  const [viewMode, setViewMode] = useState<'side-by-side' | 'full'>('side-by-side');
  const [activeTab, setActiveTab] = useState('dashboard');

  const defaultBranding = {
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    accentColor: '#10b981',
    errorColor: '#ef4444',
    backgroundColor: '#ffffff',
    logoUrl: null,
    fontHeading: 'Inter',
    fontBody: 'Inter',
    platformName: 'EvalifyAI',
  };

  const PreviewPanel = ({ 
    settings, 
    title 
  }: { 
    settings: typeof defaultBranding; 
    title: string;
  }) => {
    const panelStyles = {
      '--preview-primary': settings.primaryColor,
      '--preview-secondary': settings.secondaryColor,
      '--preview-accent': settings.accentColor,
      '--preview-bg': settings.backgroundColor,
      fontFamily: settings.fontBody,
    } as React.CSSProperties;

    return (
      <div 
        className="border rounded-lg overflow-hidden h-full flex flex-col"
        style={panelStyles}
      >
        <div className="bg-muted px-3 py-2 border-b flex items-center justify-between">
          <span className="text-sm font-medium">{title}</span>
          <Badge variant="outline" className="text-xs">Preview</Badge>
        </div>
        
        <div className="flex-1 overflow-auto" style={{ backgroundColor: settings.backgroundColor }}>
          {/* Simulated Header */}
          <header className="border-b px-4 py-3 flex items-center justify-between" style={{ backgroundColor: settings.backgroundColor }}>
            <div className="flex items-center gap-4">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-8" />
              ) : (
                <img src={logo} alt="EvalifyAI" className="h-8" />
              )}
              <span 
                className="font-semibold text-lg"
                style={{ fontFamily: settings.fontHeading, color: settings.primaryColor }}
              >
                {settings.platformName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="ghost"
                className="h-8 w-8 p-0"
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                className="h-8 w-8 p-0"
              >
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <div className="flex">
            {/* Simulated Sidebar */}
            <nav className="w-48 border-r p-3 space-y-1 min-h-[400px]" style={{ backgroundColor: settings.backgroundColor }}>
              {[
                { icon: Home, label: 'Dashboard', active: activeTab === 'dashboard' },
                { icon: Users, label: 'Team', active: activeTab === 'team' },
                { icon: BarChart3, label: 'Analytics', active: activeTab === 'analytics' },
                { icon: MessageSquare, label: 'Feedback', active: activeTab === 'feedback' },
                { icon: Settings, label: 'Settings', active: activeTab === 'settings' },
              ].map(({ icon: Icon, label, active }) => (
                <button
                  key={label}
                  onClick={() => setActiveTab(label.toLowerCase())}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm transition-colors"
                  style={{
                    backgroundColor: active ? `${settings.primaryColor}15` : 'transparent',
                    color: active ? settings.primaryColor : 'inherit',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </nav>

            {/* Simulated Content */}
            <main className="flex-1 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h1 
                  className="text-xl font-bold"
                  style={{ fontFamily: settings.fontHeading }}
                >
                  Dashboard
                </h1>
                <Button 
                  size="sm"
                  style={{ 
                    backgroundColor: settings.primaryColor,
                    color: '#ffffff',
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New Session
                </Button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total Sessions', value: '156', change: '+12%' },
                  { label: 'Pending Reviews', value: '23', change: '-5%' },
                  { label: 'Team Members', value: '12', change: '+2' },
                ].map(({ label, value, change }) => (
                  <div 
                    key={label}
                    className="border rounded-lg p-3"
                    style={{ backgroundColor: settings.backgroundColor }}
                  >
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p 
                      className="text-2xl font-bold"
                      style={{ fontFamily: settings.fontHeading }}
                    >
                      {value}
                    </p>
                    <p 
                      className="text-xs"
                      style={{ color: change.startsWith('+') ? settings.accentColor : settings.errorColor }}
                    >
                      {change}
                    </p>
                  </div>
                ))}
              </div>

              {/* Sample Form */}
              <div className="border rounded-lg p-4 space-y-3" style={{ backgroundColor: settings.backgroundColor }}>
                <h3 
                  className="font-semibold"
                  style={{ fontFamily: settings.fontHeading }}
                >
                  Quick Feedback
                </h3>
                <Input placeholder="Search employees..." className="text-sm" />
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    style={{ 
                      backgroundColor: settings.primaryColor,
                      color: '#ffffff',
                    }}
                  >
                    Submit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    style={{ 
                      borderColor: settings.secondaryColor,
                      color: settings.secondaryColor,
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>

              {/* Badges */}
              <div className="flex gap-2 flex-wrap">
                <span 
                  className="px-2 py-1 rounded text-xs text-white"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  Primary
                </span>
                <span 
                  className="px-2 py-1 rounded text-xs text-white"
                  style={{ backgroundColor: settings.secondaryColor }}
                >
                  Secondary
                </span>
                <span 
                  className="px-2 py-1 rounded text-xs text-white"
                  style={{ backgroundColor: settings.accentColor }}
                >
                  Success
                </span>
                <span 
                  className="px-2 py-1 rounded text-xs text-white"
                  style={{ backgroundColor: settings.errorColor }}
                >
                  Error
                </span>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/settings/branding')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>
            <h1 className="text-lg font-semibold">Branding Preview</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="view-mode" className="text-sm">Side-by-side</Label>
              <Switch
                id="view-mode"
                checked={viewMode === 'side-by-side'}
                onCheckedChange={(checked) => setViewMode(checked ? 'side-by-side' : 'full')}
              />
            </div>
            <Button onClick={() => navigate('/settings/branding')}>
              <Check className="h-4 w-4 mr-2" />
              Apply Branding
            </Button>
          </div>
        </div>
      </header>

      {/* Preview Content */}
      <div className="container mx-auto px-4 py-6">
        {viewMode === 'side-by-side' ? (
          <div className="grid md:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
            <PreviewPanel settings={defaultBranding} title="Before (Default)" />
            <PreviewPanel settings={branding} title="After (Your Branding)" />
          </div>
        ) : (
          <div className="h-[calc(100vh-200px)]">
            <PreviewPanel settings={branding} title="Full Preview" />
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="container mx-auto flex justify-center">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default BrandingPreview;
