import { authService } from './auth.service.js';

export const authController = {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
};
