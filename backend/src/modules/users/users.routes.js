import { Router } from 'express';
import { usersController } from './users.controller.js';
import { verifyToken } from '../../middleware/verifyToken.js';
import { validate } from '../../middleware/validate.js';
import { updateProfileSchema } from '../auth/auth.schemas.js';

const router = Router();

// Protected profile routes
router.get('/me', verifyToken, usersController.getMe);
router.put('/me', verifyToken, validate(updateProfileSchema, 'body'), usersController.updateMe);

export default router;
