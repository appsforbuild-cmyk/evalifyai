import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, Provider } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'manager' | 'employee' | 'hr' | 'admin';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  loading: boolean;
  ssoProvider: string | null;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithSSO: (provider: Provider) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [ssoProvider, setSsoProvider] = useState<string | null>(null);

  const fetchRoles = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
    
    if (!error && data) {
      setRoles(data.map(r => r.role as AppRole));
    }
  };

  const detectSSOProvider = (user: User | null) => {
    if (!user) {
      setSsoProvider(null);
      return;
    }
    
    const provider = user.app_metadata?.provider;
    if (provider && provider !== 'email') {
      setSsoProvider(provider);
    } else {
      setSsoProvider(null);
    }
  };

  const logSSOEvent = async (userId: string, eventType: string, provider: string | null, details: Record<string, string | number | boolean> = {}) => {
    try {
      await supabase.from('sso_audit_log').insert([{
        user_id: userId,
        event_type: eventType,
        provider: provider,
        details: details as unknown as Record<string, never>,
      }]);
    } catch (error) {
      console.error('Failed to log SSO event:', error);
    }
  };

  const createProfileForSSOUser = async (user: User) => {
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!existingProfile) {
      // Create profile for new SSO user
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
      
      await supabase.from('profiles').insert({
        user_id: user.id,
        email: user.email,
        full_name: fullName,
        avatar_url: user.user_metadata?.avatar_url || null,
      });

      // Assign default employee role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!existingRole) {
        await supabase.from('user_roles').insert({
          user_id: user.id,
          role: 'employee'
        });
      }

      // Log SSO user creation
      await logSSOEvent(user.id, 'sso_user_created', user.app_metadata?.provider || null, {
        email: user.email,
        created_via: 'sso_login'
      });
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        detectSSOProvider(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchRoles(session.user.id);
            
            // Handle SSO user profile creation
            if (session.user.app_metadata?.provider && session.user.app_metadata.provider !== 'email') {
              createProfileForSSOUser(session.user);
              
              // Log SSO login event
              if (event === 'SIGNED_IN') {
                logSSOEvent(session.user.id, 'sso_login', session.user.app_metadata.provider, {
                  email: session.user.email
                });
              }
            }
          }, 0);
        } else {
          setRoles([]);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      detectSSOProvider(session?.user ?? null);
      if (session?.user) {
        fetchRoles(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName }
      }
    });

    if (!error && data.user) {
      // All new users default to 'employee' role for security
      // Admin must assign other roles through admin panel
      await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role: 'employee'
      });
    }

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signInWithSSO = async (provider: Provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      }
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    if (user && ssoProvider) {
      await logSSOEvent(user.id, 'sso_logout', ssoProvider, {});
    }
    await supabase.auth.signOut();
    setRoles([]);
    setSsoProvider(null);
  };

  const hasRole = (role: AppRole) => roles.includes(role);

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      roles, 
      loading, 
      ssoProvider,
      signUp, 
      signIn, 
      signInWithSSO,
      signOut, 
      hasRole 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
