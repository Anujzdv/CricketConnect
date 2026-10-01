import { z } from 'zod';

export const createMatchSchema = z.object({
  title: z.string().min(3, { message: 'Match title must be at least 3 characters' }),
  host_team_id: z.number().int().positive().optional(),
  guest_team: z.string().optional().default('Opponent Squad'),
  ground_id: z.number().int().positive({ message: 'ground_id must be a valid ground ID' }),
  slot_id: z.number().int().positive().optional(),
  format: z.enum(['T10', 'T20', 'ODI', 'Custom']).default('T20')
});

export const joinMatchSchema = z.object({
  player_id: z.number().int().positive().optional(),
  team: z.enum(['host', 'guest']).default('host')
});

export const updateScoreSchema = z.object({
  runs: z.number().int().min(0, { message: 'runs must be >= 0' }),
  wickets: z.number().int().min(0).max(10, { message: 'wickets must be between 0 and 10' }),
  overs: z.string().regex(/^\d+(\.[0-6])?$/, { message: 'overs must be valid cricket overs (e.g. 14.2)' }),
  target: z.number().int().min(1).nullable().optional(),
  innings: z.number().int().min(1).max(2).optional().default(1),
  run_rate: z.string().optional(),
  status: z.enum(['scheduled', 'live', 'completed', 'abandoned']).optional()
});

export const listMatchesQuerySchema = z.object({
  status: z.enum(['scheduled', 'live', 'completed', 'abandoned']).optional(),
  ground_id: z.coerce.number().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10)
});
