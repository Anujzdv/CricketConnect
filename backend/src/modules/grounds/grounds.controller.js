import { groundsService } from './grounds.service.js';

export const groundsController = {
  async listGrounds(req, res, next) {
    try {
      const result = await groundsService.listGrounds(req.query);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async getGroundById(req, res, next) {
    try {
      const { id } = req.params;
      const { date } = req.query;
      const ground = await groundsService.getGroundById(parseInt(id, 10), date);
      res.json({
        success: true,
        data: ground
      });
    } catch (err) {
      next(err);
    }
  },

  async createGround(req, res, next) {
    try {
      const payload = {
        ...req.body,
        owner_id: req.user ? req.user.id : req.body.owner_id
      };
      const ground = await groundsService.createGround(payload);
      res.status(201).json({
        success: true,
        data: ground
      });
    } catch (err) {
      next(err);
    }
  },

  async bulkAddSlots(req, res, next) {
    try {
      const { id } = req.params;
      const groundId = parseInt(id, 10);
      
      // If user is authenticated and not admin, ensure they own the ground
      if (req.user && req.user.role !== 'admin') {
        const ground = await groundsService.getGroundById(groundId);
        if (ground.owner_id !== req.user.id) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You can only add slots to grounds you own'
            }
          });
        }
      }

      const { slots } = req.body;
      const createdSlots = await groundsService.bulkAddSlots(groundId, slots);
      res.status(201).json({
        success: true,
        data: {
          ground_id: groundId,
          added_count: createdSlots.length,
          slots: createdSlots
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async getSlots(req, res, next) {
    try {
      const { id } = req.params;
      const { date } = req.query;
      const slots = await groundsService.getSlots(parseInt(id, 10), date);
      res.json({
        success: true,
        data: slots
      });
    } catch (err) {
      next(err);
    }
  }
};
