import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { loginSchema, signupSchema } from '@/lib/validations';
import { Loader2 } from 'lucide-react';
import logo from '@/assets/evalifyai-logo.png';

interface OrganizationBranding {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  platformName: string;
  welcomeMessage?: string;
}

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#F25022" d="M1 1h10v10H1z" />
    <path fill="#00A4EF" d="M1 13h10v10H1z" />
    <path fill="#7FBA00" d="M13 1h10v10H13z" />
    <path fill="#FFB900" d="M13 13h10v10H13z" />
  </svg>
);

const BrandedLogin = () => {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const navigate = useNavigate();
  const { signIn, signUp, signInWithSSO } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [orgBranding, setOrgBranding] = useState<OrganizationBranding | null>(null);
  const [isLoadingOrg, setIsLoadingOrg] = useState(true);
  const [orgNotFound, setOrgNotFound] = useState(false);

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!orgSlug) {
        setOrgNotFound(true);
        setIsLoadingOrg(false);
        return;
      }

      try {
        const { data: org, error } = await supabase
          .from('organizations')
          .select(`
            id,
            name,
            slug,
            logo_url,
            primary_color,
            secondary_color
          `)
          .eq('slug', orgSlug)
          .single();

        if (error || !org) {
          setOrgNotFound(true);
          setIsLoadingOrg(false);
          return;
        }

        // Fetch organization settings for platform name
        const { data: settings } = await supabase
          .from('organization_settings')
          .select('custom_branding, platform_name')
          .eq('organization_id', org.id)
          .single();

        const customBranding = settings?.custom_branding as Record<string, unknown> || {};

        setOrgBranding({
          id: org.id,
          name: org.name,
          slug: org.slug,
          logoUrl: org.logo_url,
          primaryColor: org.primary_color || '#6366f1',
          secondaryColor: org.secondary_color || '#8b5cf6',
          platformName: (customBranding.platform_name as string) || settings?.platform_name || org.name,
          welcomeMessage: customBranding.welcome_message as string,
        });
      } catch (err) {
        console.error('Error fetching organization:', err);
        setOrgNotFound(true);
      } finally {
        setIsLoadingOrg(false);
      }
    };

    fetchOrganization();
  }, [orgSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const schema = isLogin ? loginSchema : signupSchema;
    const data = isLogin ? { email, password } : { email, password, fullName };
    
    const result = schema.safeParse(data);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error('Please fix the validation errors');
      return;
    }
    
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Welcome back!');
          navigate('/dashboard');
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Account created successfully!');
          navigate('/dashboard');
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSsoLoading('google');
    try {
      const { error } = await signInWithSSO('google');
      if (error) {
        toast.error(error.message);
      }
    } catch (err) {
      toast.error('Failed to initiate Google login');
    } finally {
      setSsoLoading(null);
    }
  };

  if (isLoadingOrg) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (orgNotFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Organization Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The organization you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/auth')}>
              Go to Main Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const styles = {
    '--brand-primary': orgBranding?.primaryColor || '#6366f1',
    '--brand-secondary': orgBranding?.secondaryColor || '#8b5cf6',
  } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4" style={styles}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {orgBranding?.logoUrl ? (
            <img src={orgBranding.logoUrl} alt={orgBranding.name} className="h-12 mx-auto mb-4 object-contain" />
          ) : (
            <img src={logo} alt="EvalifyAI" className="h-12 mx-auto mb-4" />
          )}
          <CardTitle 
            className="text-2xl font-bold"
            style={{ color: orgBranding?.primaryColor }}
          >
            {isLogin ? 'Welcome Back' : `Join ${orgBranding?.platformName}`}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? `Sign in to ${orgBranding?.platformName}` 
              : `Create your account to get started with ${orgBranding?.platformName}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* SSO Buttons */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-3 h-11"
              onClick={handleGoogleLogin}
              disabled={ssoLoading === 'google'}
            >
              {ssoLoading === 'google' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-3 h-11"
              onClick={() => toast.info('Microsoft SSO requires admin configuration')}
            >
              <MicrosoftIcon />
              Continue with Microsoft
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required={!isLogin}
                  className={errors.fullName ? 'border-destructive' : ''}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
              style={{ 
                backgroundColor: orgBranding?.primaryColor,
                borderColor: orgBranding?.primaryColor,
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Please wait...
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm hover:underline"
              style={{ color: orgBranding?.primaryColor }}
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <a href="/auth" className="hover:underline">
              Not part of {orgBranding?.name}? Go to main login
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrandedLogin;
