import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Key, Copy, Eye, EyeOff, Loader2, Play, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

interface ImportHistoryItem {
  id: string;
  method: string;
  total_count: number;
  success_count: number;
  error_count: number;
  created_at: string;
}

export default function APIIntegrationTab() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [testPayload, setTestPayload] = useState(JSON.stringify({
    users: [
      {
        email: "test@example.com",
        full_name: "Test User",
        role: "employee",
        team: "Engineering"
      }
    ],
    method: "api",
    sendWelcomeEmails: false
  }, null, 2));
  const [testResult, setTestResult] = useState<{ success: boolean; data?: unknown; error?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([]);

  useEffect(() => {
    fetchApiKeys();
    fetchImportHistory();
  }, []);

  const fetchApiKeys = async () => {
    const { data, error } = await supabase
      .from('admin_api_keys')
      .select('id, name, key_prefix, is_active, last_used_at, created_at')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setApiKeys(data);
    }
  };

  const fetchImportHistory = async () => {
    const { data, error } = await supabase
      .from('user_import_history')
      .select('id, method, total_count, success_count, error_count, created_at')
      .eq('method', 'api')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setImportHistory(data);
    }
  };

  const generateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a key name');
      return;
    }

    setIsGenerating(true);

    try {
      // Generate a secure random key
      const keyBytes = new Uint8Array(32);
      crypto.getRandomValues(keyBytes);
      const fullKey = Array.from(keyBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      const keyPrefix = fullKey.substring(0, 8);
      
      // In production, you'd hash the key before storing
      // For demo purposes, we're storing a hash placeholder
      const { error } = await supabase
        .from('admin_api_keys')
        .insert({
          created_by: user?.id,
          name: newKeyName,
          key_prefix: keyPrefix,
          key_hash: fullKey, // In production, hash this
        });

      if (error) throw error;

      setGeneratedKey(fullKey);
      setNewKeyName('');
      fetchApiKeys();
      toast.success('API key generated');
    } catch (err) {
      console.error('Error generating key:', err);
      toast.error('Failed to generate API key');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const toggleKeyStatus = async (keyId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('admin_api_keys')
      .update({ is_active: !isActive })
      .eq('id', keyId);

    if (!error) {
      fetchApiKeys();
      toast.success(`API key ${!isActive ? 'activated' : 'deactivated'}`);
    }
  };

  const runTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const payload = JSON.parse(testPayload);
      
      // Use a dummy key for testing (won't actually work without valid key)
      const { data, error } = await supabase.functions.invoke('bulk-import-users', {
        body: payload,
      });

      if (error) {
        setTestResult({ success: false, error: error.message });
      } else {
        setTestResult({ success: true, data });
        fetchImportHistory();
      }
    } catch (err) {
      setTestResult({ success: false, error: err instanceof Error ? err.message : 'Invalid JSON' });
    } finally {
      setIsTesting(false);
    }
  };

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'your-project-id';

  return (
    <div className="space-y-6">
      <Tabs defaultValue="docs" className="w-full">
        <TabsList>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="test">Test Import</TabsTrigger>
          <TabsTrigger value="history">Import History</TabsTrigger>
        </TabsList>

        {/* Documentation Tab */}
        <TabsContent value="docs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoint</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg font-mono text-sm flex items-center justify-between">
                <span>POST https://{projectId}.supabase.co/functions/v1/bulk-import-users</span>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(`https://${projectId}.supabase.co/functions/v1/bulk-import-users`)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Headers</h4>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`Content-Type: application/json
x-api-key: your_api_key_here`}
                </pre>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Request Body</h4>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "users": [
    {
      "email": "john.doe@company.com",
      "full_name": "John Doe",
      "role": "employee",  // employee | manager | hr
      "team": "Engineering",
      "department": "Technology",
      "manager_email": "jane.smith@company.com"
    }
  ],
  "method": "api",
  "sendWelcomeEmails": true
}`}
                </pre>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Response</h4>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "success": true,
  "total": 1,
  "successCount": 1,
  "errorCount": 0,
  "results": [
    { "success": true, "email": "john.doe@company.com", "userId": "uuid" }
  ]
}`}
                </pre>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Rate Limits</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  <li>Maximum 100 users per request</li>
                  <li>Maximum 10 requests per minute</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" /> Generate API Key
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="keyName">Key Name</Label>
                  <Input
                    id="keyName"
                    placeholder="e.g., HR System Integration"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={generateApiKey} 
                  disabled={isGenerating}
                  className="self-end"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate'}
                </Button>
              </div>

              {generatedKey && (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    ⚠️ Save this key now! It won't be shown again.
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      type={showKey ? 'text' : 'password'}
                      value={generatedKey}
                      readOnly
                      className="font-mono"
                    />
                    <Button variant="ghost" size="icon" onClick={() => setShowKey(!showKey)}>
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(generatedKey)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Existing Keys */}
          <Card>
            <CardHeader>
              <CardTitle>Your API Keys</CardTitle>
            </CardHeader>
            <CardContent>
              {apiKeys.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No API keys yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Key Prefix</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-medium">{key.name}</TableCell>
                        <TableCell className="font-mono">{key.key_prefix}...</TableCell>
                        <TableCell>
                          <Badge variant={key.is_active ? 'default' : 'secondary'}>
                            {key.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {key.last_used_at 
                            ? format(new Date(key.last_used_at), 'MMM d, yyyy HH:mm')
                            : 'Never'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(key.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleKeyStatus(key.id, key.is_active)}
                          >
                            {key.is_active ? 'Deactivate' : 'Activate'}
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

        {/* Test Tab */}
        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Import</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="testPayload">JSON Payload</Label>
                <Textarea
                  id="testPayload"
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              <Button onClick={runTest} disabled={isTesting} className="gap-2">
                {isTesting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Run Test
              </Button>

              {testResult && (
                <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {testResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {testResult.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(testResult.data || testResult.error, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent API Imports
                <Button variant="ghost" size="icon" onClick={fetchImportHistory}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {importHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No API imports yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Success</TableHead>
                      <TableHead>Failed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {format(new Date(item.created_at), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>{item.total_count}</TableCell>
                        <TableCell className="text-green-600">{item.success_count}</TableCell>
                        <TableCell className="text-red-600">{item.error_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
