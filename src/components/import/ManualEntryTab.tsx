import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { validateUser, UserImportData } from '@/lib/userImportValidation';

interface ManualEntryTabProps {
  onImportComplete: () => void;
}

interface ManualRow {
  id: string;
  email: string;
  full_name: string;
  role: 'employee' | 'manager' | 'hr' | '';
  team: string;
  department: string;
  manager_email: string;
  errors: string[];
}

const createEmptyRow = (): ManualRow => ({
  id: crypto.randomUUID(),
  email: '',
  full_name: '',
  role: '',
  team: '',
  department: '',
  manager_email: '',
  errors: [],
});

export default function ManualEntryTab({ onImportComplete }: ManualEntryTabProps) {
  const [rows, setRows] = useState<ManualRow[]>([createEmptyRow()]);
  const [isImporting, setIsImporting] = useState(false);

  const addRow = () => {
    setRows(prev => [...prev, createEmptyRow()]);
  };

  const removeRow = (id: string) => {
    if (rows.length === 1) return;
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const updateRow = (id: string, field: keyof ManualRow, value: string) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      // Validate on change
      const validation = validateUser({
        email: updated.email,
        full_name: updated.full_name,
        role: updated.role || undefined,
        team: updated.team || undefined,
        department: updated.department || undefined,
        manager_email: updated.manager_email || undefined,
      });
      return { ...updated, errors: validation.errors };
    }));
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length <= 1) return; // Not a multi-line paste

    e.preventDefault();
    
    const newRows: ManualRow[] = lines.map(line => {
      const cells = line.split('\t');
      const row: ManualRow = {
        id: crypto.randomUUID(),
        email: cells[0]?.trim() || '',
        full_name: cells[1]?.trim() || '',
        role: (['employee', 'manager', 'hr'].includes(cells[2]?.trim().toLowerCase()) 
          ? cells[2].trim().toLowerCase() as 'employee' | 'manager' | 'hr'
          : ''),
        team: cells[3]?.trim() || '',
        department: cells[4]?.trim() || '',
        manager_email: cells[5]?.trim() || '',
        errors: [],
      };
      
      const validation = validateUser({
        email: row.email,
        full_name: row.full_name,
        role: row.role || undefined,
        team: row.team || undefined,
        department: row.department || undefined,
        manager_email: row.manager_email || undefined,
      });
      row.errors = validation.errors;
      
      return row;
    });

    setRows(newRows);
    toast.success(`Pasted ${newRows.length} rows`);
  }, []);

  const handleImport = async () => {
    const validRows = rows.filter(r => {
      const validation = validateUser({
        email: r.email,
        full_name: r.full_name,
        role: r.role || undefined,
        team: r.team || undefined,
        department: r.department || undefined,
        manager_email: r.manager_email || undefined,
      });
      return validation.isValid;
    });

    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    setIsImporting(true);

    try {
      const usersToImport: UserImportData[] = validRows.map(r => ({
        email: r.email,
        full_name: r.full_name,
        role: r.role as 'employee' | 'manager' | 'hr',
        team: r.team || undefined,
        department: r.department || undefined,
        manager_email: r.manager_email || undefined,
      }));

      const { data, error } = await supabase.functions.invoke('bulk-import-users', {
        body: {
          users: usersToImport,
          method: 'manual',
          sendWelcomeEmails: true,
        },
      });

      if (error) throw error;

      toast.success(`${data.successCount} users imported successfully`);
      
      if (data.successCount > 0) {
        setRows([createEmptyRow()]);
        onImportComplete();
      }

      // Show errors for failed imports
      if (data.errorCount > 0) {
        const failedEmails = data.results
          .filter((r: { success: boolean }) => !r.success)
          .map((r: { email: string; error: string }) => `${r.email}: ${r.error}`)
          .join('\n');
        toast.error(`${data.errorCount} users failed:\n${failedEmails}`);
      }
    } catch (err) {
      console.error('Import error:', err);
      toast.error('Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = rows.filter(r => r.errors.length === 0 && r.email && r.full_name && r.role).length;

  return (
    <div className="space-y-4" onPaste={handlePaste}>
      <div className="text-sm text-muted-foreground">
        Tip: You can copy-paste data from Excel (Tab-separated values)
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Email *</TableHead>
              <TableHead className="w-[180px]">Full Name *</TableHead>
              <TableHead className="w-[120px]">Role *</TableHead>
              <TableHead className="w-[150px]">Team</TableHead>
              <TableHead className="w-[150px]">Department</TableHead>
              <TableHead className="w-[200px]">Manager Email</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="p-1">
                  <Input
                    value={row.email}
                    onChange={(e) => updateRow(row.id, 'email', e.target.value)}
                    placeholder="email@company.com"
                    className={row.errors.some(e => e.includes('email')) ? 'border-destructive' : ''}
                  />
                </TableCell>
                <TableCell className="p-1">
                  <Input
                    value={row.full_name}
                    onChange={(e) => updateRow(row.id, 'full_name', e.target.value)}
                    placeholder="John Doe"
                    className={row.errors.some(e => e.includes('name')) ? 'border-destructive' : ''}
                  />
                </TableCell>
                <TableCell className="p-1">
                  <Select
                    value={row.role}
                    onValueChange={(value) => updateRow(row.id, 'role', value)}
                  >
                    <SelectTrigger className={!row.role && row.email ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="p-1">
                  <Input
                    value={row.team}
                    onChange={(e) => updateRow(row.id, 'team', e.target.value)}
                    placeholder="Engineering"
                  />
                </TableCell>
                <TableCell className="p-1">
                  <Input
                    value={row.department}
                    onChange={(e) => updateRow(row.id, 'department', e.target.value)}
                    placeholder="Technology"
                  />
                </TableCell>
                <TableCell className="p-1">
                  <Input
                    value={row.manager_email}
                    onChange={(e) => updateRow(row.id, 'manager_email', e.target.value)}
                    placeholder="manager@company.com"
                  />
                </TableCell>
                <TableCell className="p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length === 1}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={addRow} className="gap-2">
          <Plus className="w-4 h-4" /> Add Row
        </Button>

        <Button 
          onClick={handleImport} 
          disabled={validCount === 0 || isImporting}
          className="gap-2"
        >
          {isImporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Importing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" /> Import {validCount} Users
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
