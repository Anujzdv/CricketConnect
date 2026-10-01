import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { registerSchema, loginSchema } from './auth.schemas.js';

const router = Router();

// POST /api/auth/register
router.post('/register', validate(registerSchema, 'body'), authController.register);

// POST /api/auth/login
router.post('/login', validate(loginSchema, 'body'), authController.login);

export default router;
