import { Router } from 'express';
import { bookingController } from './booking.controller.js';
import { verifyToken } from '../../middleware/verifyToken.js';
import { requireRole } from '../../middleware/requireRole.js';
import { validate } from '../../middleware/validate.js';
import { reserveBookingSchema } from './booking.schemas.js';

const router = Router();

// All booking routes require authentication
router.use(verifyToken);

// The Concurrency-Critical Path: Reserve a ground slot (Captain or Admin only)
router.post(
  '/reserve',
  requireRole(['captain', 'admin']),
  validate(reserveBookingSchema, 'body'),
  bookingController.reserve
);

// Booking cancellation (soft delete, releases slot back to available)
router.delete(
  '/:id',
  requireRole(['captain', 'admin']),
  bookingController.cancelBooking
);

// Captain's booking history
router.get(
  '/history',
  requireRole(['captain', 'admin']),
  bookingController.getHistory
);

export default router;
