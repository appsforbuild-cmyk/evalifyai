import { z } from 'zod';

export const userImportSchema = z.object({
  email: z.string().email('Invalid email format').max(255, 'Email too long'),
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  role: z.enum(['employee', 'manager', 'hr'], { errorMap: () => ({ message: 'Role must be employee, manager, or hr' }) }),
  team: z.string().max(100, 'Team name too long').optional().nullable(),
  department: z.string().max(100, 'Department name too long').optional().nullable(),
  manager_email: z.string().email('Invalid manager email').max(255, 'Manager email too long').optional().nullable(),
});

export type UserImportData = z.infer<typeof userImportSchema>;

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data?: UserImportData;
}

export interface ParsedRow {
  rowNumber: number;
  rawData: Record<string, string>;
  validationResult: ValidationResult;
}

export interface ColumnMapping {
  email: string | null;
  full_name: string | null;
  role: string | null;
  team: string | null;
  department: string | null;
  manager_email: string | null;
}

export const REQUIRED_FIELDS = ['email', 'full_name', 'role'] as const;
export const OPTIONAL_FIELDS = ['team', 'department', 'manager_email'] as const;
export const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS] as const;

export function validateUser(data: unknown): ValidationResult {
  try {
    const result = userImportSchema.parse(data);
    return { isValid: true, errors: [], data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return { isValid: false, errors: ['Unknown validation error'] };
  }
}

export function mapRowToUser(row: Record<string, string>, mapping: ColumnMapping): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  
  for (const field of ALL_FIELDS) {
    const sourceColumn = mapping[field];
    if (sourceColumn && row[sourceColumn] !== undefined) {
      const value = row[sourceColumn]?.trim();
      result[field] = value || null;
    } else {
      result[field] = null;
    }
  }
  
  return result;
}

export function detectColumnMappings(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    email: null,
    full_name: null,
    role: null,
    team: null,
    department: null,
    manager_email: null,
  };

  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

  // Email detection
  const emailPatterns = ['email', 'e-mail', 'email_address', 'emailaddress', 'mail'];
  for (const pattern of emailPatterns) {
    const idx = normalizedHeaders.findIndex(h => h.includes(pattern));
    if (idx !== -1) {
      mapping.email = headers[idx];
      break;
    }
  }

  // Full name detection
  const namePatterns = ['full_name', 'fullname', 'full name', 'name', 'employee_name', 'employeename'];
  for (const pattern of namePatterns) {
    const idx = normalizedHeaders.findIndex(h => h === pattern || h.includes(pattern));
    if (idx !== -1) {
      mapping.full_name = headers[idx];
      break;
    }
  }

  // Role detection
  const rolePatterns = ['role', 'user_role', 'userrole', 'position', 'type'];
  for (const pattern of rolePatterns) {
    const idx = normalizedHeaders.findIndex(h => h === pattern);
    if (idx !== -1) {
      mapping.role = headers[idx];
      break;
    }
  }

  // Team detection
  const teamPatterns = ['team', 'team_name', 'teamname', 'group'];
  for (const pattern of teamPatterns) {
    const idx = normalizedHeaders.findIndex(h => h === pattern);
    if (idx !== -1) {
      mapping.team = headers[idx];
      break;
    }
  }

  // Department detection
  const deptPatterns = ['department', 'dept', 'org_unit', 'orgunit', 'division'];
  for (const pattern of deptPatterns) {
    const idx = normalizedHeaders.findIndex(h => h === pattern || h.includes(pattern));
    if (idx !== -1) {
      mapping.department = headers[idx];
      break;
    }
  }

  // Manager email detection
  const managerPatterns = ['manager_email', 'manageremail', 'manager', 'reports_to', 'reportsto'];
  for (const pattern of managerPatterns) {
    const idx = normalizedHeaders.findIndex(h => h === pattern || h.includes(pattern));
    if (idx !== -1 && !mapping.email?.toLowerCase().includes(pattern)) {
      mapping.manager_email = headers[idx];
      break;
    }
  }

  return mapping;
}

export function generateSampleCSV(): string {
  const headers = ['email', 'full_name', 'role', 'team', 'department', 'manager_email'];
  const sampleRows = [
    ['john.doe@company.com', 'John Doe', 'employee', 'Engineering', 'Technology', 'jane.smith@company.com'],
    ['jane.smith@company.com', 'Jane Smith', 'manager', 'Engineering', 'Technology', ''],
    ['bob.wilson@company.com', 'Bob Wilson', 'hr', 'Human Resources', 'Operations', ''],
  ];
  
  return [headers.join(','), ...sampleRows.map(row => row.join(','))].join('\n');
}
