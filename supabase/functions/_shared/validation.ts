import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

export const StartSessionSchema = z.object({
  projectId: z.string().uuid('Invalid project ID format'),
  prompt: z.string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(5000, 'Prompt must be less than 5000 characters')
})

export const ContinueCodingSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID format'),
  prompt: z.string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(5000, 'Prompt must be less than 5000 characters')
})

export const GetSessionStatusSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID format')
})
