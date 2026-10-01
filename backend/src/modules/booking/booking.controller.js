import { bookingService } from './booking.service.js';

export const bookingController = {
  async reserve(req, res, next) {
    try {
      const captainId = req.user.id;
      const result = await bookingService.reserve(req.body, captainId);
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async cancelBooking(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      const result = await bookingService.cancelBooking(parseInt(id, 10), userId, userRole);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async getHistory(req, res, next) {
    try {
      const captainId = req.user.id;
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '10', 10);
      const result = await bookingService.getBookingHistory(captainId, page, limit);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
};
