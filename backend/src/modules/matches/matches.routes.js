import { Router } from 'express';
import { matchesController } from './matches.controller.js';
import { validate } from '../../middleware/validate.js';
import { 
  createMatchSchema, 
  joinMatchSchema, 
  updateScoreSchema, 
  listMatchesQuerySchema 
} from './matches.schemas.js';

import { verifyToken } from '../../middleware/verifyToken.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

// Browse & filter matches (public)
router.get('/', validate(listMatchesQuerySchema, 'query'), matchesController.listMatches);

// Match details + squad roster (public)
router.get('/:id', matchesController.getMatchById);

// Create match (Captain or Admin only)
router.post(
  '/',
  verifyToken,
  requireRole(['captain', 'admin']),
  validate(createMatchSchema, 'body'),
  matchesController.createMatch
);

// Join match squad (Authenticated Player, Captain, etc.)
router.post(
  '/:id/join',
  verifyToken,
  validate(joinMatchSchema, 'body'),
  matchesController.joinMatch
);

// Update match score (Host Captain or Admin only)
router.patch(
  '/:id/score',
  verifyToken,
  requireRole(['captain', 'admin']),
  validate(updateScoreSchema, 'body'),
  matchesController.updateScore
);

export default router;
