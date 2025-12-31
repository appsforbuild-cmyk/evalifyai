import { useOrganization } from '@/contexts/OrganizationContext';
import { useCallback } from 'react';

/**
 * Hook to get the current organization ID for queries.
 * Returns null if user has no organization yet.
 */
export function useOrganizationId(): string | null {
  const { currentOrganization } = useOrganization();
  return currentOrganization?.id ?? null;
}

/**
 * Hook that provides the organization ID and helper for adding it to queries.
 */
export function useOrganizationQuery() {
  const organizationId = useOrganizationId();

  /**
   * Adds organization_id to a data object for inserts/updates.
   */
  const addOrgId = useCallback(<T extends Record<string, unknown>>(data: T): T & { organization_id: string | null } => {
    return { ...data, organization_id: organizationId };
  }, [organizationId]);

  /**
   * Adds organization_id to an array of data objects.
   */
  const addOrgIdToArray = useCallback(<T extends Record<string, unknown>>(data: T[]): (T & { organization_id: string | null })[] => {
    return data.map(item => ({ ...item, organization_id: organizationId }));
  }, [organizationId]);

  /**
   * Creates a filter object for organization-scoped queries.
   * Use with .match() in Supabase queries.
   */
  const orgFilter = useCallback((): Record<string, string> => {
    return organizationId ? { organization_id: organizationId } : {};
  }, [organizationId]);

  /**
   * Check if user has an organization.
   */
  const hasOrganization = organizationId !== null;

  return {
    organizationId,
    hasOrganization,
    addOrgId,
    addOrgIdToArray,
    orgFilter,
  };
}

/**
 * Helper type for organization-aware data.
 */
export interface WithOrganization {
  organization_id: string;
}
