import { z } from 'zod';

// Auth validation schemas
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters'),
});

export const signupSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters'),
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
});

// Goal validation schema
export const goalSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .or(z.literal('')),
  category: z.enum(['general', 'technical', 'leadership', 'communication', 'project'], {
    required_error: 'Category is required',
  }),
  due_date: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'completed', 'on-hold', 'cancelled']).optional(),
  progress: z.number().min(0).max(100).optional(),
});

// Quick Feedback validation schema
export const quickFeedbackSchema = z.object({
  employee_id: z
    .string()
    .min(1, 'Please select an employee')
    .uuid('Invalid employee selection'),
  feedback_text: z
    .string()
    .min(1, 'Feedback text is required')
    .max(5000, 'Feedback must be less than 5000 characters'),
  feedback_type: z.enum(['quick', 'praise', 'suggestion'], {
    required_error: 'Feedback type is required',
  }),
});

// Types derived from schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type GoalInput = z.infer<typeof goalSchema>;
export type QuickFeedbackInput = z.infer<typeof quickFeedbackSchema>;
