import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const organizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').max(100),
  slug: z.string().min(2, 'Slug must be at least 2 characters').max(50).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
});

const invitationSchema = z.object({
  token: z.string().min(10, 'Invalid invitation token'),
});

export default function OnboardingOrganization() {
  const navigate = useNavigate();
  const { createOrganization, refreshOrganization } = useOrganization();
  
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  
  // Create org form
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  
  // Join org form
  const [inviteToken, setInviteToken] = useState('');
  const [joinError, setJoinError] = useState('');

  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
  };

  const handleNameChange = (value: string) => {
    setOrgName(value);
    if (!orgSlug || orgSlug === generateSlug(orgName)) {
      setOrgSlug(generateSlug(value));
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateErrors({});

    const result = organizationSchema.safeParse({ name: orgName, slug: orgSlug });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          errors[String(err.path[0])] = err.message;
        }
      });
      setCreateErrors(errors);
      return;
    }

    setIsCreating(true);
    try {
      const orgId = await createOrganization(orgName, orgSlug);
      if (orgId) {
        toast.success('Organization created successfully!');
        await refreshOrganization();
        navigate('/dashboard');
      } else {
        toast.error('Failed to create organization');
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error('Failed to create organization');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');

    const result = invitationSchema.safeParse({ token: inviteToken });
    if (!result.success) {
      setJoinError(result.error.errors[0]?.message || 'Invalid token');
      return;
    }

    setIsJoining(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.rpc('accept_invitation', { _token: inviteToken });

      if (error) {
        setJoinError(error.message);
        return;
      }

      const response = data as { success: boolean; error?: string; organization_id?: string };
      if (!response.success) {
        setJoinError(response.error || 'Failed to accept invitation');
        return;
      }

      toast.success('Successfully joined the organization!');
      await refreshOrganization();
      navigate('/dashboard');
    } catch (error) {
      console.error('Error joining organization:', error);
      setJoinError('Failed to join organization');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Set Up Your Organization</CardTitle>
          <CardDescription>
            Create a new organization or join an existing one to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create" className="gap-2">
                <Building2 className="h-4 w-4" />
                Create New
              </TabsTrigger>
              <TabsTrigger value="join" className="gap-2">
                <Users className="h-4 w-4" />
                Join Existing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="mt-6">
              <form onSubmit={handleCreateOrganization} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    placeholder="Acme Corporation"
                    value={orgName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    disabled={isCreating}
                  />
                  {createErrors.name && (
                    <p className="text-sm text-destructive">{createErrors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orgSlug">Organization URL</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">evalify.ai/</span>
                    <Input
                      id="orgSlug"
                      placeholder="acme-corp"
                      value={orgSlug}
                      onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      disabled={isCreating}
                    />
                  </div>
                  {createErrors.slug && (
                    <p className="text-sm text-destructive">{createErrors.slug}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Organization'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="join" className="mt-6">
              <form onSubmit={handleJoinOrganization} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteToken">Invitation Token</Label>
                  <Input
                    id="inviteToken"
                    placeholder="Paste your invitation token here"
                    value={inviteToken}
                    onChange={(e) => setInviteToken(e.target.value.trim())}
                    disabled={isJoining}
                  />
                  <p className="text-sm text-muted-foreground">
                    Ask your organization admin for an invitation link or token
                  </p>
                  {joinError && (
                    <p className="text-sm text-destructive">{joinError}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isJoining || !inviteToken}>
                  {isJoining ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    'Join Organization'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
