import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  ColumnMapping, 
  ALL_FIELDS, 
  REQUIRED_FIELDS,
  detectColumnMappings,
  mapRowToUser,
  validateUser,
  generateSampleCSV,
  ParsedRow 
} from '@/lib/userImportValidation';

interface CSVImportTabProps {
  onImportComplete: () => void;
}

export default function CSVImportTab({ onImportComplete }: CSVImportTabProps) {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    email: null,
    full_name: null,
    role: null,
    team: null,
    department: null,
    manager_email: null,
  });
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: { email: string; error: string }[] } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setImportResult(null);

    const extension = uploadedFile.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      Papa.parse(uploadedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data as Record<string, string>[];
          if (data.length > 0) {
            const detectedHeaders = Object.keys(data[0]);
            setHeaders(detectedHeaders);
            setRows(data);
            setColumnMapping(detectColumnMappings(detectedHeaders));
          }
        },
        error: (error) => {
          toast.error('Failed to parse CSV: ' + error.message);
        }
      });
    } else if (extension === 'xlsx' || extension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, { defval: '' });
          
          if (jsonData.length > 0) {
            const detectedHeaders = Object.keys(jsonData[0]);
            setHeaders(detectedHeaders);
            setRows(jsonData);
            setColumnMapping(detectColumnMappings(detectedHeaders));
          }
        } catch (err) {
          toast.error('Failed to parse Excel file');
        }
      };
      reader.readAsArrayBuffer(uploadedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  const updateMapping = (field: keyof ColumnMapping, value: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [field]: value === '_none_' ? null : value,
    }));
  };

  const validateAllRows = useCallback(() => {
    const validated: ParsedRow[] = rows.map((row, index) => {
      const mappedData = mapRowToUser(row, columnMapping);
      const validationResult = validateUser(mappedData);
      return {
        rowNumber: index + 2, // +2 because row 1 is header, data starts at row 2
        rawData: row,
        validationResult,
      };
    });
    setParsedRows(validated);
  }, [rows, columnMapping]);

  const handleImport = async () => {
    const validRows = parsedRows.filter(r => r.validationResult.isValid);
    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const usersToImport = validRows.map(r => r.validationResult.data!);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const { data, error } = await supabase.functions.invoke('bulk-import-users', {
        body: {
          users: usersToImport,
          method: 'csv',
          sendWelcomeEmails: true,
        },
      });

      clearInterval(progressInterval);
      setImportProgress(100);

      if (error) throw error;

      setImportResult({
        success: data.successCount,
        failed: data.errorCount,
        errors: data.results.filter((r: { success: boolean }) => !r.success).map((r: { email: string; error: string }) => ({ email: r.email, error: r.error })),
      });

      if (data.successCount > 0) {
        toast.success(`${data.successCount} users imported successfully`);
        onImportComplete();
      }
    } catch (err) {
      console.error('Import error:', err);
      toast.error('Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = generateSampleCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadErrorReport = () => {
    if (!importResult) return;
    const csv = ['Email,Error', ...importResult.errors.map(e => `"${e.email}","${e.error}"`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import_errors.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetUpload = () => {
    setFile(null);
    setHeaders([]);
    setRows([]);
    setParsedRows([]);
    setImportResult(null);
    setColumnMapping({
      email: null,
      full_name: null,
      role: null,
      team: null,
      department: null,
      manager_email: null,
    });
  };

  const validCount = parsedRows.filter(r => r.validationResult.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.validationResult.isValid).length;

  return (
    <div className="space-y-6">
      {/* Template Download */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={downloadTemplate} className="gap-2">
          <Download className="w-4 h-4" /> Download Template
        </Button>
      </div>

      {/* Drop Zone */}
      {!file && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">
            {isDragActive ? 'Drop the file here' : 'Drag & drop a file here, or click to select'}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Supports CSV, XLSX, and XLS files
          </p>
        </div>
      )}

      {/* File Info & Column Mapping */}
      {file && !importResult && (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{rows.length} rows detected</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={resetUpload}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Column Mapping */}
              <div className="space-y-4">
                <h4 className="font-medium">Map Columns</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {ALL_FIELDS.map(field => (
                    <div key={field} className="space-y-1">
                      <label className="text-sm font-medium flex items-center gap-1">
                        {field.replace('_', ' ')}
                        {REQUIRED_FIELDS.includes(field as typeof REQUIRED_FIELDS[number]) && (
                          <span className="text-destructive">*</span>
                        )}
                      </label>
                      <Select
                        value={columnMapping[field] || '_none_'}
                        onValueChange={(value) => updateMapping(field, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="_none_">-- Not mapped --</SelectItem>
                          {headers.map(header => (
                            <SelectItem key={header} value={header}>{header}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                <Button onClick={validateAllRows} variant="outline">
                  Validate Data
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview & Validation Results */}
          {parsedRows.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Preview (First 5 rows)</h4>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500" /> {validCount} valid
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <AlertCircle className="w-3 h-3 text-destructive" /> {invalidCount} invalid
                    </Badge>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Row</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Errors</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedRows.slice(0, 5).map((row) => {
                        const mapped = mapRowToUser(row.rawData, columnMapping);
                        return (
                          <TableRow key={row.rowNumber}>
                            <TableCell>{row.rowNumber}</TableCell>
                            <TableCell>
                              {row.validationResult.isValid ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-destructive" />
                              )}
                            </TableCell>
                            <TableCell>{mapped.email}</TableCell>
                            <TableCell>{mapped.full_name}</TableCell>
                            <TableCell>{mapped.role}</TableCell>
                            <TableCell>{mapped.team}</TableCell>
                            <TableCell className="text-sm text-destructive">
                              {row.validationResult.errors.join(', ')}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Import Progress */}
                {isImporting && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Importing users...</span>
                      <span>{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} />
                  </div>
                )}

                {/* Import Button */}
                {!isImporting && validCount > 0 && (
                  <Button onClick={handleImport} className="mt-4 gap-2">
                    <Upload className="w-4 h-4" /> Import {validCount} Users
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
              <h3 className="text-xl font-semibold">Import Complete</h3>
              <p className="text-muted-foreground">
                {importResult.success} users imported, {importResult.failed} failed
              </p>
              {importResult.failed > 0 && (
                <Button variant="outline" onClick={downloadErrorReport} className="gap-2">
                  <Download className="w-4 h-4" /> Download Error Report
                </Button>
              )}
              <Button onClick={resetUpload}>Import More Users</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
