import { z } from 'zod';

export const createGroundSchema = z.object({
  owner_id: z.number().int().positive().optional(),
  name: z.string().min(3, { message: 'Ground name must be at least 3 characters' }),
  city: z.string().min(2, { message: 'City is required' }),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  cover_image_url: z.string().url({ message: 'Must be a valid URL' }).optional(),
  amenities: z.array(z.string()).optional().default([])
});

const slotItemSchema = z.object({
  slot_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'slot_date must be in YYYY-MM-DD format' }),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'start_time must be HH:MM or HH:MM:SS' }),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'end_time must be HH:MM or HH:MM:SS' }),
  price: z.number().min(0, { message: 'price must be non-negative' }).default(0)
});

export const bulkAddSlotsSchema = z.object({
  slots: z.array(slotItemSchema).min(1, { message: 'At least one slot is required' })
});

export const filterGroundsQuerySchema = z.object({
  city: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  amenity: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10)
});
