import { z } from 'zod';

export const reserveBookingSchema = z.object({
  slot_id: z.number().int().positive().optional(),
  slot_ids: z.array(z.number().int().positive()).optional(),
  amount_paid: z.number().min(0).optional().default(0),
  match_id: z.number().int().positive().optional()
}).refine(data => data.slot_id !== undefined || (data.slot_ids && data.slot_ids.length > 0), {
  message: 'Either slot_id or slot_ids must be provided'
});

export const cancelBookingSchema = z.object({
  id: z.coerce.number().int().positive()
});
