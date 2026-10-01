import { matchesService } from './matches.service.js';

export const matchesController = {
  async listMatches(req, res, next) {
    try {
      const result = await matchesService.listMatches(req.query);
      res.json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  },

  async getMatchById(req, res, next) {
    try {
      const { id } = req.params;
      const match = await matchesService.getMatchById(parseInt(id, 10));
      res.json({
        success: true,
        data: match
      });
    } catch (err) {
      next(err);
    }
  },

  async createMatch(req, res, next) {
    try {
      const payload = {
        ...req.body,
        host_team_id: req.user ? req.user.id : req.body.host_team_id
      };
      const match = await matchesService.createMatch(payload);
      res.status(201).json({
        success: true,
        data: match
      });
    } catch (err) {
      next(err);
    }
  },

  async joinMatch(req, res, next) {
    try {
      const { id } = req.params;
      const playerId = req.user ? req.user.id : req.body.player_id;
      const { team } = req.body;
      const participant = await matchesService.joinMatch(parseInt(id, 10), playerId, team);
      res.status(201).json({
        success: true,
        data: participant
      });
    } catch (err) {
      next(err);
    }
  },

  async updateScore(req, res, next) {
    try {
      const { id } = req.params;
      const matchId = parseInt(id, 10);

      // Verify captain is the match host
      if (req.user && req.user.role !== 'admin') {
        const match = await matchesService.getMatchById(matchId);
        if (match.host_team_id !== req.user.id) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Only the host match captain can update the live score'
            }
          });
        }
      }

      const updatedMatch = await matchesService.updateScore(matchId, req.body);
      res.json({
        success: true,
        data: updatedMatch
      });
    } catch (err) {
      next(err);
    }
  }
};
