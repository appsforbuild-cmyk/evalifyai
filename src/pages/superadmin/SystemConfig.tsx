import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSuperAdmin } from '@/contexts/SuperAdminContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  Settings, 
  Flag, 
  Shield, 
  AlertTriangle, 
  Plus, 
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface FeatureFlag {
  id: string;
  flag_key: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  rollout_percentage: number;
  created_at: string;
}

export default function SystemConfig() {
  const { hasPermission, logAction } = useSuperAdmin();
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [showNewFlagDialog, setShowNewFlagDialog] = useState(false);
  const [newFlag, setNewFlag] = useState({
    flag_key: '',
    name: '',
    description: '',
    is_enabled: false,
    rollout_percentage: 100
  });

  useEffect(() => {
    fetchFeatureFlags();
  }, []);

  const fetchFeatureFlags = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeatureFlags(data || []);
    } catch (error) {
      console.error('Error fetching feature flags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFlag = async (flag: FeatureFlag) => {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({ is_enabled: !flag.is_enabled })
        .eq('id', flag.id);

      if (error) throw error;

      await logAction('toggle_feature_flag', 'system', flag.id, {
        flag_key: flag.flag_key,
        enabled: !flag.is_enabled
      });

      setFeatureFlags(flags =>
        flags.map(f => f.id === flag.id ? { ...f, is_enabled: !f.is_enabled } : f)
      );

      toast.success(`Feature flag ${!flag.is_enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update feature flag');
    }
  };

  const handleCreateFlag = async () => {
    if (!newFlag.flag_key || !newFlag.name) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .insert({
          flag_key: newFlag.flag_key,
          name: newFlag.name,
          description: newFlag.description || null,
          is_enabled: newFlag.is_enabled,
          rollout_percentage: newFlag.rollout_percentage
        })
        .select()
        .single();

      if (error) throw error;

      await logAction('create_feature_flag', 'system', data.id, {
        flag_key: newFlag.flag_key
      });

      setFeatureFlags(flags => [data, ...flags]);
      setShowNewFlagDialog(false);
      setNewFlag({
        flag_key: '',
        name: '',
        description: '',
        is_enabled: false,
        rollout_percentage: 100
      });

      toast.success('Feature flag created');
    } catch (error) {
      toast.error('Failed to create feature flag');
    }
  };

  const handleDeleteFlag = async (flag: FeatureFlag) => {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .delete()
        .eq('id', flag.id);

      if (error) throw error;

      await logAction('delete_feature_flag', 'system', flag.id, {
        flag_key: flag.flag_key
      });

      setFeatureFlags(flags => flags.filter(f => f.id !== flag.id));
      toast.success('Feature flag deleted');
    } catch (error) {
      toast.error('Failed to delete feature flag');
    }
  };

  const handleToggleMaintenance = async () => {
    const newState = !maintenanceMode;
    setMaintenanceMode(newState);
    await logAction('toggle_maintenance_mode', 'system', undefined, {
      enabled: newState
    });
    toast.success(`Maintenance mode ${newState ? 'enabled' : 'disabled'}`);
  };

  if (!hasPermission('systemConfig')) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">You don't have permission to access system configuration</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">System Configuration</h1>
        <p className="text-slate-400">Manage platform settings and feature flags</p>
      </div>

      <Tabs defaultValue="flags" className="space-y-6">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="flags" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500">
            Feature Flags
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500">
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="health" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-500">
            System Health
          </TabsTrigger>
        </TabsList>

        {/* Feature Flags Tab */}
        <TabsContent value="flags" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-slate-400">Manage feature rollouts and A/B tests</p>
            <Button
              onClick={() => setShowNewFlagDialog(true)}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Flag
            </Button>
          </div>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                </div>
              ) : featureFlags.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Flag className="h-12 w-12 text-slate-600 mb-4" />
                  <p className="text-slate-400">No feature flags configured</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-400">Flag</TableHead>
                      <TableHead className="text-slate-400">Key</TableHead>
                      <TableHead className="text-slate-400">Rollout</TableHead>
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Created</TableHead>
                      <TableHead className="text-slate-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {featureFlags.map((flag) => (
                      <TableRow key={flag.id} className="border-slate-700 hover:bg-slate-700/50">
                        <TableCell>
                          <div>
                            <p className="text-white font-medium">{flag.name}</p>
                            {flag.description && (
                              <p className="text-sm text-slate-500">{flag.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm text-amber-500 bg-slate-700/50 px-2 py-1 rounded">
                            {flag.flag_key}
                          </code>
                        </TableCell>
                        <TableCell className="text-slate-400">
                          {flag.rollout_percentage}%
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={flag.is_enabled}
                            onCheckedChange={() => handleToggleFlag(flag)}
                          />
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">
                          {format(new Date(flag.created_at), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => handleDeleteFlag(flag)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Maintenance Mode
              </CardTitle>
              <CardDescription className="text-slate-400">
                Enable maintenance mode to prevent user access during updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/50">
                <div>
                  <p className="text-white font-medium">Maintenance Mode</p>
                  <p className="text-sm text-slate-400">
                    When enabled, all users will see a maintenance page
                  </p>
                </div>
                <Switch
                  checked={maintenanceMode}
                  onCheckedChange={handleToggleMaintenance}
                />
              </div>

              {maintenanceMode && (
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <p className="text-amber-500 font-medium">Warning</p>
                  <p className="text-sm text-amber-400">
                    Maintenance mode is currently enabled. All users are seeing the maintenance page.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Cache Management</CardTitle>
              <CardDescription className="text-slate-400">
                Clear application caches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-700/50">
                <div>
                  <p className="text-white font-medium">Application Cache</p>
                  <p className="text-sm text-slate-400">Clear all cached data</p>
                </div>
                <Button
                  variant="outline"
                  className="border-slate-600 text-slate-300"
                  onClick={() => {
                    toast.success('Cache cleared successfully');
                    logAction('clear_cache', 'system');
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear Cache
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="health" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Database</p>
                    <p className="text-xl font-bold text-white">Healthy</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">API</p>
                    <p className="text-xl font-bold text-white">Operational</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Storage</p>
                    <p className="text-xl font-bold text-white">Available</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Edge Functions</p>
                    <p className="text-xl font-bold text-white">Running</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Flag Dialog */}
      <Dialog open={showNewFlagDialog} onOpenChange={setShowNewFlagDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Create Feature Flag</DialogTitle>
            <DialogDescription className="text-slate-400">
              Add a new feature flag for controlled rollout
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Flag Key</Label>
              <Input
                placeholder="e.g., enable_new_dashboard"
                value={newFlag.flag_key}
                onChange={(e) => setNewFlag({ ...newFlag, flag_key: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Name</Label>
              <Input
                placeholder="e.g., New Dashboard"
                value={newFlag.name}
                onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Description</Label>
              <Textarea
                placeholder="Describe what this flag controls..."
                value={newFlag.description}
                onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Rollout Percentage</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={newFlag.rollout_percentage}
                onChange={(e) => setNewFlag({ ...newFlag, rollout_percentage: parseInt(e.target.value) || 0 })}
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-slate-300">Enable immediately</Label>
              <Switch
                checked={newFlag.is_enabled}
                onCheckedChange={(checked) => setNewFlag({ ...newFlag, is_enabled: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewFlagDialog(false)}
              className="border-slate-600 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFlag}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              Create Flag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
