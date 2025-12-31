import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

// Types for organization data
export interface OrganizationFeatures {
  voiceRecording: boolean;
  biasDetection: boolean;
  sso: boolean;
  api: boolean;
  whiteLabel: boolean;
}

export interface OrganizationBranding {
  logoUrl?: string;
  favicon?: string;
  colors?: {
    primary?: string;
    secondary?: string;
  };
  fonts?: {
    heading?: string;
    body?: string;
  };
}

export interface OrganizationSettings {
  id: string;
  organization_id: string;
  company_name: string | null;
  timezone: string;
  language: string;
  date_format: string;
  email_notifications: boolean;
  feedback_reminder_days: number;
  custom_branding: OrganizationBranding;
  email_templates: Record<string, unknown>;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  status: 'trial' | 'active' | 'suspended' | 'cancelled';
  plan: 'starter' | 'professional' | 'enterprise';
  max_users: number;
  max_storage_gb: number;
  features: OrganizationFeatures;
  billing_email: string | null;
  trial_ends_at: string | null;
  subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMembership {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'manager' | 'employee';
  is_primary_owner: boolean;
  joined_at: string;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizationSettings: OrganizationSettings | null;
  organizations: Organization[];
  membership: OrganizationMembership | null;
  isLoading: boolean;
  error: string | null;
  switchOrganization: (orgId: string) => Promise<void>;
  isFeatureEnabled: (featureName: keyof OrganizationFeatures) => boolean;
  hasOrgRole: (role: 'owner' | 'admin' | 'manager' | 'employee') => boolean;
  isOrgOwner: () => boolean;
  isOrgAdmin: () => boolean;
  refreshOrganization: () => Promise<void>;
  createOrganization: (name: string, slug: string) => Promise<string | null>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user, session } = useAuth();
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizationSettings, setOrganizationSettings] = useState<OrganizationSettings | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [membership, setMembership] = useState<OrganizationMembership | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's organizations
  const fetchOrganizations = useCallback(async () => {
    if (!user) {
      setOrganizations([]);
      setCurrentOrganization(null);
      setMembership(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch user's organization memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('organization_users')
        .select('*')
        .eq('user_id', user.id);

      if (membershipError) {
        console.error('Error fetching memberships:', membershipError);
        setError('Failed to load organization memberships');
        setIsLoading(false);
        return;
      }

      if (!memberships || memberships.length === 0) {
        // User has no organization - they need to create one or be invited
        setOrganizations([]);
        setCurrentOrganization(null);
        setMembership(null);
        setIsLoading(false);
        return;
      }

      // Fetch all organizations the user belongs to
      const orgIds = memberships.map(m => m.organization_id);
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .in('id', orgIds);

      if (orgsError) {
        console.error('Error fetching organizations:', orgsError);
        setError('Failed to load organizations');
        setIsLoading(false);
        return;
      }

      // Parse organizations with proper typing
      const defaultFeatures: OrganizationFeatures = { 
        voiceRecording: true, 
        biasDetection: true, 
        sso: false, 
        api: false, 
        whiteLabel: false 
      };
      
      const parsedOrgs: Organization[] = (orgs || []).map(org => ({
        ...org,
        features: (typeof org.features === 'object' && org.features !== null && !Array.isArray(org.features)
          ? { ...defaultFeatures, ...(org.features as Record<string, unknown>) }
          : defaultFeatures
        ) as OrganizationFeatures,
        status: org.status as Organization['status'],
        plan: org.plan as Organization['plan'],
      }));

      setOrganizations(parsedOrgs);

      // Get stored org ID or use first organization
      const storedOrgId = localStorage.getItem('currentOrganizationId');
      const targetOrg = storedOrgId 
        ? parsedOrgs.find(o => o.id === storedOrgId) || parsedOrgs[0]
        : parsedOrgs[0];

      if (targetOrg) {
        setCurrentOrganization(targetOrg);
        localStorage.setItem('currentOrganizationId', targetOrg.id);

        // Set current membership
        const currentMembership = memberships.find(m => m.organization_id === targetOrg.id);
        if (currentMembership) {
          setMembership({
            ...currentMembership,
            role: currentMembership.role as OrganizationMembership['role'],
          });
        }

        // Fetch organization settings
        const { data: settings, error: settingsError } = await supabase
          .from('organization_settings')
          .select('*')
          .eq('organization_id', targetOrg.id)
          .maybeSingle();

        if (!settingsError && settings) {
          setOrganizationSettings({
            ...settings,
            custom_branding: (settings.custom_branding || {}) as OrganizationBranding,
            email_templates: (settings.email_templates || {}) as Record<string, unknown>,
          });
        }
      }
    } catch (err) {
      console.error('Error in fetchOrganizations:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Switch to a different organization
  const switchOrganization = useCallback(async (orgId: string) => {
    if (!user) return;

    const targetOrg = organizations.find(o => o.id === orgId);
    if (!targetOrg) {
      setError('Organization not found');
      return;
    }

    setCurrentOrganization(targetOrg);
    localStorage.setItem('currentOrganizationId', orgId);

    // Fetch membership for this org
    const { data: membershipData } = await supabase
      .from('organization_users')
      .select('*')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipData) {
      setMembership({
        ...membershipData,
        role: membershipData.role as OrganizationMembership['role'],
      });
    }

    // Fetch settings for this org
    const { data: settings } = await supabase
      .from('organization_settings')
      .select('*')
      .eq('organization_id', orgId)
      .maybeSingle();

    if (settings) {
      setOrganizationSettings({
        ...settings,
        custom_branding: (settings.custom_branding || {}) as OrganizationBranding,
        email_templates: (settings.email_templates || {}) as Record<string, unknown>,
      });
    }
  }, [user, organizations]);

  // Check if a feature is enabled for current organization
  const isFeatureEnabled = useCallback((featureName: keyof OrganizationFeatures): boolean => {
    if (!currentOrganization?.features) return false;
    return currentOrganization.features[featureName] === true;
  }, [currentOrganization]);

  // Check user's organization role
  const hasOrgRole = useCallback((role: 'owner' | 'admin' | 'manager' | 'employee'): boolean => {
    if (!membership) return false;
    
    const roleHierarchy = ['employee', 'manager', 'admin', 'owner'];
    const userRoleIndex = roleHierarchy.indexOf(membership.role);
    const requiredRoleIndex = roleHierarchy.indexOf(role);
    
    return userRoleIndex >= requiredRoleIndex;
  }, [membership]);

  const isOrgOwner = useCallback(() => membership?.role === 'owner', [membership]);
  const isOrgAdmin = useCallback(() => hasOrgRole('admin'), [hasOrgRole]);

  // Refresh organization data
  const refreshOrganization = useCallback(async () => {
    await fetchOrganizations();
  }, [fetchOrganizations]);

  // Create a new organization
  const createOrganization = useCallback(async (name: string, slug: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .rpc('create_organization_with_owner', {
          _name: name,
          _slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          _owner_id: user.id,
        });

      if (error) {
        console.error('Error creating organization:', error);
        setError(error.message);
        return null;
      }

      // Refresh organizations list
      await fetchOrganizations();
      
      return data as string;
    } catch (err) {
      console.error('Error in createOrganization:', err);
      setError('Failed to create organization');
      return null;
    }
  }, [user, fetchOrganizations]);

  // Load organizations when user changes
  useEffect(() => {
    if (session) {
      fetchOrganizations();
    } else {
      setOrganizations([]);
      setCurrentOrganization(null);
      setMembership(null);
      setOrganizationSettings(null);
      setIsLoading(false);
    }
  }, [session, fetchOrganizations]);

  const value: OrganizationContextType = {
    currentOrganization,
    organizationSettings,
    organizations,
    membership,
    isLoading,
    error,
    switchOrganization,
    isFeatureEnabled,
    hasOrgRole,
    isOrgOwner,
    isOrgAdmin,
    refreshOrganization,
    createOrganization,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
