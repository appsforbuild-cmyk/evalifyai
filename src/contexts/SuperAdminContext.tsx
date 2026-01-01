import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface SuperAdminPermissions {
  manageOrgs: boolean;
  viewAnalytics: boolean;
  billing: boolean;
  support: boolean;
  systemConfig: boolean;
}

interface SuperAdmin {
  id: string;
  user_id: string;
  email: string;
  permissions: SuperAdminPermissions;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

interface ImpersonationSession {
  id: string;
  impersonated_user_id: string;
  organization_id: string;
  organization_name?: string;
  user_name?: string;
  expires_at: string;
}

interface SuperAdminContextType {
  user: User | null;
  session: Session | null;
  superAdmin: SuperAdmin | null;
  isLoading: boolean;
  isSuperAdmin: boolean;
  impersonationSession: ImpersonationSession | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasPermission: (permission: keyof SuperAdminPermissions) => boolean;
  startImpersonation: (userId: string, orgId: string, reason?: string) => Promise<{ error: Error | null }>;
  endImpersonation: () => Promise<void>;
  logAction: (action: string, targetType: string, targetId?: string, details?: Record<string, unknown>) => Promise<void>;
}

const SuperAdminContext = createContext<SuperAdminContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function SuperAdminProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [superAdmin, setSuperAdmin] = useState<SuperAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [impersonationSession, setImpersonationSession] = useState<ImpersonationSession | null>(null);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const fetchSuperAdmin = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('super_admins')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching super admin:', error);
      return null;
    }

    if (!data) return null;
    
    return {
      ...data,
      permissions: data.permissions as unknown as SuperAdminPermissions
    } as SuperAdmin;
  }, []);

  const checkImpersonation = useCallback(async (superAdminId: string) => {
    const { data } = await supabase
      .from('impersonation_sessions')
      .select('*')
      .eq('super_admin_id', superAdminId)
      .is('ended_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (data) {
      // Fetch org and user names
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', data.organization_id)
        .maybeSingle();

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', data.impersonated_user_id)
        .maybeSingle();

      setImpersonationSession({
        ...data,
        organization_name: org?.name,
        user_name: profile?.full_name
      });
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchSuperAdmin(session.user.id).then(admin => {
              setSuperAdmin(admin);
              if (admin) {
                checkImpersonation(admin.id);
              }
              setIsLoading(false);
            });
          }, 0);
        } else {
          setSuperAdmin(null);
          setImpersonationSession(null);
          setIsLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchSuperAdmin(session.user.id).then(admin => {
          setSuperAdmin(admin);
          if (admin) {
            checkImpersonation(admin.id);
          }
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchSuperAdmin, checkImpersonation]);

  // Inactivity timeout
  useEffect(() => {
    if (!superAdmin) return;

    const handleActivity = () => setLastActivity(Date.now());

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    const interval = setInterval(() => {
      if (Date.now() - lastActivity > INACTIVITY_TIMEOUT) {
        signOut();
      }
    }, 60000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      clearInterval(interval);
    };
  }, [superAdmin, lastActivity]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) return { error };

      // Verify super admin status
      const admin = await fetchSuperAdmin(data.user.id);
      if (!admin) {
        await supabase.auth.signOut();
        return { error: new Error('Not authorized as super admin') };
      }

      // Update last login
      await supabase
        .from('super_admins')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', admin.id);

      // Log the login
      await supabase.from('admin_audit_logs').insert({
        super_admin_id: admin.id,
        action: 'login',
        target_type: 'system',
        details: { email }
      });

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    if (superAdmin) {
      await supabase.from('admin_audit_logs').insert({
        super_admin_id: superAdmin.id,
        action: 'logout',
        target_type: 'system'
      });
    }
    await supabase.auth.signOut();
    setSuperAdmin(null);
    setImpersonationSession(null);
  };

  const hasPermission = (permission: keyof SuperAdminPermissions) => {
    if (!superAdmin) return false;
    const perms = superAdmin.permissions as SuperAdminPermissions;
    return perms[permission] === true;
  };

  const startImpersonation = async (userId: string, orgId: string, reason?: string) => {
    if (!superAdmin) return { error: new Error('Not authenticated') };

    try {
      const { data, error } = await supabase
        .from('impersonation_sessions')
        .insert({
          super_admin_id: superAdmin.id,
          impersonated_user_id: userId,
          organization_id: orgId,
          reason
        })
        .select()
        .single();

      if (error) return { error };

      // Fetch org and user names
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', orgId)
        .maybeSingle();

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', userId)
        .maybeSingle();

      setImpersonationSession({
        ...data,
        organization_name: org?.name,
        user_name: profile?.full_name
      });

      await logAction('start_impersonation', 'user', userId, { organization_id: orgId, reason });

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const endImpersonation = async () => {
    if (!impersonationSession || !superAdmin) return;

    await supabase
      .from('impersonation_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', impersonationSession.id);

    await logAction('end_impersonation', 'user', impersonationSession.impersonated_user_id);

    setImpersonationSession(null);
  };

  const logAction = async (
    action: string,
    targetType: string,
    targetId?: string,
    details?: Record<string, unknown>
  ) => {
    if (!superAdmin) return;

    await supabase.from('admin_audit_logs').insert([{
      super_admin_id: superAdmin.id,
      action,
      target_type: targetType,
      target_id: targetId,
      details: details ? JSON.parse(JSON.stringify(details)) : null,
      user_agent: navigator.userAgent
    }]);
  };

  return (
    <SuperAdminContext.Provider
      value={{
        user,
        session,
        superAdmin,
        isLoading,
        isSuperAdmin: !!superAdmin,
        impersonationSession,
        signIn,
        signOut,
        hasPermission,
        startImpersonation,
        endImpersonation,
        logAction
      }}
    >
      {children}
    </SuperAdminContext.Provider>
  );
}

export function useSuperAdmin() {
  const context = useContext(SuperAdminContext);
  if (context === undefined) {
    throw new Error('useSuperAdmin must be used within a SuperAdminProvider');
  }
  return context;
}
