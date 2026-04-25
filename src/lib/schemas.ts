import { z } from 'zod';

// Mirrors the DB CHECK constraints in
// supabase/migrations/20260425190000_text_length_constraints.sql.
// Both layers enforce; client surfaces the error with a clearer message.

export const reportSchema = z.object({
  reason: z.enum([
    'fake_identity',
    'pressure',
    'harassment',
    'boundary_violation',
    'unsafe_behavior',
    'other',
  ]),
  details: z.string().max(1000, 'Keep the report under 1000 characters.').optional(),
});

export const messageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty.')
    .max(4000, 'Keep messages under 4000 characters.'),
});

export const memorySchema = z.object({
  memo_text: z.string().min(1, 'Memory cannot be empty.').max(4000, 'Keep memories under 4000 characters.'),
  entry_type: z.enum([
    'good_moment',
    'milestone',
    'hard_moment',
    'repair',
    'gratitude',
    'promise',
    'date',
    'reflection',
  ]),
  visibility: z.enum(['private', 'shared']),
});

export const weeklyCheckinSchema = z.object({
  relationship_rating: z.number().int().min(1).max(5),
  relationship_note: z.string().max(2000).optional().nullable(),
  gratitude_note: z.string().max(2000).optional().nullable(),
});

export const aboutSchema = z.string().max(2000, 'Keep your bio under 2000 characters.');
export const nameSchema = z.string().min(1).max(120, 'Keep your name under 120 characters.');

export type ReportInput = z.infer<typeof reportSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type MemoryInput = z.infer<typeof memorySchema>;
export type WeeklyCheckinInput = z.infer<typeof weeklyCheckinSchema>;
