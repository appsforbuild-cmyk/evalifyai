import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// UUID validation regex
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Create Voice Session validation
export const createVoiceSessionSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .nullable(),
  employeeId: z
    .string()
    .regex(uuidRegex, 'Invalid employee ID format'),
});

// Question Recording schema for per-question mode
const questionRecordingSchema = z.object({
  questionId: z.string(),
  questionText: z.string(),
  audioPath: z.string().nullable(),
  transcript: z.string().nullable(),
  duration: z.number(),
  recordedAt: z.string().nullable(),
});

// Process Session validation
export const processSessionSchema = z.object({
  sessionId: z
    .string()
    .regex(uuidRegex, 'Invalid session ID format'),
  audioBase64: z
    .string()
    .max(50 * 1024 * 1024, 'Audio data too large (max 50MB)')
    .optional()
    .nullable(),
  tone: z
    .enum(['appreciative', 'developmental', 'neutral'])
    .default('neutral'),
  recordingMode: z
    .enum(['full', 'per_question'])
    .default('full'),
  questionRecordings: z
    .array(questionRecordingSchema)
    .optional()
    .nullable(),
});

// Send Feedback Notification validation
export const sendNotificationSchema = z.object({
  feedbackId: z
    .string()
    .regex(uuidRegex, 'Invalid feedback ID format'),
  employeeId: z
    .string()
    .regex(uuidRegex, 'Invalid employee ID format'),
  sessionTitle: z
    .string()
    .min(1, 'Session title is required')
    .max(200, 'Session title must be less than 200 characters'),
  managerName: z
    .string()
    .max(100, 'Manager name must be less than 100 characters')
    .optional()
    .nullable(),
});

// Compute Analytics doesn't require request body validation
// (it's triggered without parameters)

// Helper function to validate and parse request body
export async function validateRequestBody<T>(
  req: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);
    
    if (!result.success) {
      const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      return { success: false, error: `Validation failed: ${errors.join(', ')}` };
    }
    
    return { success: true, data: result.data };
  } catch (e) {
    return { success: false, error: 'Invalid JSON in request body' };
  }
}

// Type exports
export type CreateVoiceSessionInput = z.infer<typeof createVoiceSessionSchema>;
export type ProcessSessionInput = z.infer<typeof processSessionSchema>;
export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
