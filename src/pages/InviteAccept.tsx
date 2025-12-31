import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle, Mail, Building2, UserPlus } from 'lucide-react';
import { z } from 'zod';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

interface Invitation {
  id: string;
  email: string;
  role: string;
  organization_id: string;
  expires_at: string;
  accepted_at: string | null;
  organizations: {
    name: string;
    logo_url: string | null;
  };
  inviter: {
    email: string;
  } | null;
}

const InviteAccept = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp } = useAuth();
  
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'check' | 'signin' | 'signup'>('check');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (token) {
      fetchInvitation();
    }
  }, [token]);

  useEffect(() => {
    // If user is logged in and invitation is valid, accept it
    if (user && invitation && !invitation.accepted_at) {
      acceptInvitation();
    }
  }, [user, invitation]);

  const fetchInvitation = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          id,
          email,
          role,
          organization_id,
          expires_at,
          accepted_at,
          organizations:organization_id (
            name,
            logo_url
          )
        `)
        .eq('token', token)
        .single();

      if (error || !data) {
        setError('Invitation not found');
        return;
      }

      const inv = data as unknown as Invitation;
      
      // Check if expired
      if (new Date(inv.expires_at) < new Date()) {
        setError('This invitation has expired');
        return;
      }

      // Check if already accepted
      if (inv.accepted_at) {
        setError('This invitation has already been accepted');
        return;
      }

      setInvitation(inv);
      setEmail(inv.email);
      
      // Check if user exists with this email
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', inv.email)
        .maybeSingle();
      
      if (existingUser) {
        setMode('signin');
      } else {
        setMode('signup');
      }
    } catch (err) {
      setError('Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    if (!invitation || !token) return;
    
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('accept_invitation', {
        _token: token,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; organization_id?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to accept invitation');
      }

      toast({
        title: 'Welcome to the team!',
        description: `You've joined ${invitation.organizations.name}`,
      });

      navigate('/dashboard');
    } catch (err: any) {
      toast({
        title: 'Error accepting invitation',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});

    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      // User effect will trigger acceptInvitation
    } catch (err: any) {
      setFormErrors({ submit: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});

    try {
      const validation = signupSchema.safeParse({ fullName, password });
      if (!validation.success) {
        const errors: Record<string, string> = {};
        validation.error.errors.forEach(err => {
          if (err.path[0]) errors[err.path[0] as string] = err.message;
        });
        setFormErrors(errors);
        return;
      }

      const { error } = await signUp(email, password, fullName);
      if (error) throw error;
      // User effect will trigger acceptInvitation
    } catch (err: any) {
      setFormErrors({ submit: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/">Go to Homepage</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
            {invitation.organizations.logo_url ? (
              <img 
                src={invitation.organizations.logo_url} 
                alt={invitation.organizations.name}
                className="w-10 h-10 object-contain"
              />
            ) : (
              <Building2 className="w-8 h-8 text-primary" />
            )}
          </div>
          <CardTitle>You're Invited!</CardTitle>
          <CardDescription>
            You've been invited to join <strong>{invitation.organizations.name}</strong> as a {invitation.role}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {user ? (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Accepting invitation...</span>
              </div>
            </div>
          ) : mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="bg-muted rounded-lg p-3 flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{email}</p>
                  <p className="text-xs text-muted-foreground">Sign in to accept this invitation</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              
              {formErrors.submit && (
                <p className="text-sm text-destructive">{formErrors.submit}</p>
              )}
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Sign In & Join
              </Button>
              
              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-primary hover:underline"
                >
                  Create one
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="bg-muted rounded-lg p-3 flex items-center gap-3">
                <UserPlus className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Create your account</p>
                  <p className="text-xs text-muted-foreground">{email}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
                {formErrors.fullName && (
                  <p className="text-sm text-destructive">{formErrors.fullName}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password (min. 8 characters)"
                  required
                />
                {formErrors.password && (
                  <p className="text-sm text-destructive">{formErrors.password}</p>
                )}
              </div>
              
              {formErrors.submit && (
                <p className="text-sm text-destructive">{formErrors.submit}</p>
              )}
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Account & Join
              </Button>
              
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-primary hover:underline"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InviteAccept;
