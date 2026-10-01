import { Router } from 'express';
import { groundsController } from './grounds.controller.js';
import { validate } from '../../middleware/validate.js';
import { 
  createGroundSchema, 
  bulkAddSlotsSchema, 
  filterGroundsQuerySchema 
} from './grounds.schemas.js';

import { verifyToken } from '../../middleware/verifyToken.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

// Browse & search grounds (public)
router.get('/', validate(filterGroundsQuerySchema, 'query'), groundsController.listGrounds);

// Ground detail + slots (public)
router.get('/:id', groundsController.getGroundById);

// Get slots for a specific ground (public)
router.get('/:id/slots', groundsController.getSlots);

// Create a ground (Protected: Ground Owner or Admin only)
router.post(
  '/',
  verifyToken,
  requireRole(['ground_owner', 'admin']),
  validate(createGroundSchema, 'body'),
  groundsController.createGround
);

// Bulk-add slots to a ground (Protected: Ground Owner or Admin only)
router.post(
  '/:id/slots',
  verifyToken,
  requireRole(['ground_owner', 'admin']),
  validate(bulkAddSlotsSchema, 'body'),
  groundsController.bulkAddSlots
);

export default router;
