import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  CreditCard, 
  Settings,
  UserCheck,
  KeyRound,
  Calendar,
  Ban,
  Trash2,
  Globe,
  Mail,
  MessageSquare,
  Plus,
  ExternalLink,
  Clock,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface Organization {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  plan: string;
  status: string;
  max_users: number;
  max_storage_gb: number;
  features: unknown;
  created_at: string;
  updated_at: string;
  logo_url: string | null;
  primary_color: string | null;
  billing_email: string | null;
}

interface OrganizationUser {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
  };
}

interface AdminNote {
  id: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  super_admin?: {
    email: string;
  };
}

const STATUS_COLORS = {
  trial: 'border-yellow-500/30 text-yellow-500 bg-yellow-500/10',
  active: 'border-green-500/30 text-green-500 bg-green-500/10',
  suspended: 'border-red-500/30 text-red-500 bg-red-500/10',
  cancelled: 'border-slate-500/30 text-slate-500 bg-slate-500/10'
};

export default function OrganizationDetail() {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const { startImpersonation, logAction } = useSuperAdmin();
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showImpersonateDialog, setShowImpersonateDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<OrganizationUser | null>(null);
  const [newNote, setNewNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  
  // Mock activity data
  const [activityData] = useState(
    Array.from({ length: 30 }, (_, i) => ({
      date: format(new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000), 'MMM dd'),
      users: Math.floor(Math.random() * 50) + 10
    }))
  );

  useEffect(() => {
    if (orgId) {
      fetchOrganization();
      fetchUsers();
      fetchNotes();
    }
  }, [orgId]);

  const fetchOrganization = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      if (error) throw error;
      setOrganization(data);
    } catch (error) {
      console.error('Error fetching organization:', error);
      toast.error('Failed to load organization');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_users')
        .select(`
          id,
          user_id,
          role,
          joined_at
        `)
        .eq('organization_id', orgId);

      if (error) throw error;

      // Fetch profiles for each user
      const usersWithProfiles = await Promise.all(
        (data || []).map(async (user) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', user.user_id)
            .maybeSingle();
          return { ...user, profile };
        })
      );

      setUsers(usersWithProfiles);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_notes')
        .select(`
          id,
          content,
          is_pinned,
          created_at
        `)
        .eq('organization_id', orgId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleImpersonate = async () => {
    if (!selectedUser || !organization) return;
    
    const { error } = await startImpersonation(
      selectedUser.user_id,
      organization.id,
      'Admin support'
    );

    if (error) {
      toast.error('Failed to start impersonation');
      return;
    }

    setShowImpersonateDialog(false);
    toast.success(`Now viewing as ${selectedUser.profile?.full_name || selectedUser.profile?.email}`);
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !orgId) return;
    
    setIsSavingNote(true);
    try {
      const { error } = await supabase
        .from('admin_notes')
        .insert({
          organization_id: orgId,
          content: newNote.trim()
        });

      if (error) throw error;

      await logAction('add_note', 'organization', orgId, { content: newNote.substring(0, 100) });
      setNewNote('');
      fetchNotes();
      toast.success('Note added');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleSuspend = async () => {
    if (!organization) return;
    
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ status: 'suspended' })
        .eq('id', organization.id);

      if (error) throw error;

      await logAction('suspend_organization', 'organization', organization.id);
      toast.success('Organization suspended');
      fetchOrganization();
    } catch (error) {
      toast.error('Failed to suspend organization');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Organization not found</p>
      </div>
    );
  }

  const owner = users.find(u => u.role === 'owner');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/superadmin/organizations')}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-4">
          {organization.logo_url ? (
            <img
              src={organization.logo_url}
              alt={organization.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-amber-500" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">{organization.name}</h1>
            <p className="text-slate-400">{organization.slug}</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge className={STATUS_COLORS[organization.status as keyof typeof STATUS_COLORS]}>
            {organization.status}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500">
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500">
            Users
          </TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500">
            Billing
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500">
            Activity
          </TabsTrigger>
          <TabsTrigger value="notes" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500">
            Notes
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500">
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Organization Info */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-amber-500" />
                  Organization Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400">Slug</p>
                  <p className="text-white">{organization.slug}</p>
                </div>
                {organization.domain && (
                  <div>
                    <p className="text-sm text-slate-400">Domain</p>
                    <p className="text-white flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      {organization.domain}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-slate-400">Created</p>
                  <p className="text-white">{format(new Date(organization.created_at), 'PPP')}</p>
                </div>
                {owner && (
                  <div>
                    <p className="text-sm text-slate-400">Primary Owner</p>
                    <p className="text-white">{owner.profile?.full_name || owner.profile?.email}</p>
                    <p className="text-sm text-slate-500">{owner.profile?.email}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subscription */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-amber-500" />
                  Subscription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400">Plan</p>
                  <Badge variant="outline" className="border-amber-500/30 text-amber-500">
                    {organization.plan}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Seats</p>
                  <p className="text-white">{users.length} / {organization.max_users}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Storage</p>
                  <p className="text-white">0 GB / {organization.max_storage_gb} GB</p>
                </div>
                {organization.billing_email && (
                  <div>
                    <p className="text-sm text-slate-400">Billing Email</p>
                    <p className="text-white">{organization.billing_email}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
                  onClick={() => {
                    if (owner) {
                      setSelectedUser(owner);
                      setShowImpersonateDialog(true);
                    }
                  }}
                  disabled={!owner}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Impersonate Owner
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  Reset Password
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Extend Trial
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                  onClick={handleSuspend}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Suspend Account
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-red-500/30 text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Organization
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Usage Chart */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Active Users Trend</CardTitle>
              <CardDescription className="text-slate-400">Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Organization Users</CardTitle>
              <CardDescription className="text-slate-400">
                {users.length} of {organization.max_users} seats used
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-400">Name</TableHead>
                    <TableHead className="text-slate-400">Email</TableHead>
                    <TableHead className="text-slate-400">Role</TableHead>
                    <TableHead className="text-slate-400">Joined</TableHead>
                    <TableHead className="text-slate-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="border-slate-700">
                      <TableCell className="text-white font-medium">
                        {user.profile?.full_name || 'No name'}
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {user.profile?.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-slate-600 text-slate-300">
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {format(new Date(user.joined_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-white"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowImpersonateDialog(true);
                          }}
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Billing History</CardTitle>
              <CardDescription className="text-slate-400">
                No billing data available yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-slate-400">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Billing integration coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Activity Log</CardTitle>
              <CardDescription className="text-slate-400">
                Recent organization events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { icon: Activity, text: 'Organization created', time: organization.created_at },
                  { icon: Users, text: `${users.length} users joined`, time: organization.updated_at }
                ].map((event, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                      <event.icon className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white">{event.text}</p>
                      <p className="text-xs text-slate-400">
                        {format(new Date(event.time), 'PPP')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Internal Notes</CardTitle>
              <CardDescription className="text-slate-400">
                Private notes visible only to super admins
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Add a note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
                <Button
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || isSavingNote}
                  className="bg-amber-500 hover:bg-amber-600 text-black"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                {notes.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">No notes yet</p>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 rounded-lg bg-slate-700/50 border border-slate-600"
                    >
                      <p className="text-white whitespace-pre-wrap">{note.content}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        {format(new Date(note.created_at), 'PPP p')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Settings Override</CardTitle>
              <CardDescription className="text-slate-400">
                Override organization settings and limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/50">
                  <div>
                    <p className="text-white font-medium">Max Users</p>
                    <p className="text-sm text-slate-400">Current limit: {organization.max_users}</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                    Change
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/50">
                  <div>
                    <p className="text-white font-medium">Max Storage</p>
                    <p className="text-sm text-slate-400">Current limit: {organization.max_storage_gb} GB</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                    Change
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/50">
                  <div>
                    <p className="text-white font-medium">Beta Features</p>
                    <p className="text-sm text-slate-400">Grant access to beta features</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Impersonate Dialog */}
      <Dialog open={showImpersonateDialog} onOpenChange={setShowImpersonateDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Impersonate User</DialogTitle>
            <DialogDescription className="text-slate-400">
              You are about to login as {selectedUser?.profile?.full_name || selectedUser?.profile?.email}.
              All actions will be logged for audit purposes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowImpersonateDialog(false)}
              className="border-slate-600 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImpersonate}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Start Impersonation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
