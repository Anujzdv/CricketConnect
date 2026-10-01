import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  createGroundSchema, 
  bulkAddSlotsSchema, 
  filterGroundsQuerySchema 
} from '../src/modules/grounds/grounds.schemas.js';
import { 
  createMatchSchema, 
  joinMatchSchema, 
  updateScoreSchema 
} from '../src/modules/matches/matches.schemas.js';

describe('Phase 4 Core Features: Schemas & Validation', () => {
  describe('Ground Schemas', () => {
    it('validates a correct ground creation payload', () => {
      const payload = {
        owner_id: 1,
        name: 'Eden Gardens Arena',
        city: 'Kolkata',
        latitude: 22.5646,
        longitude: 88.3433,
        cover_image_url: 'https://example.com/eden.jpg',
        amenities: ['Floodlights', 'Pavilion']
      };
      const parsed = createGroundSchema.parse(payload);
      assert.strictEqual(parsed.name, 'Eden Gardens Arena');
      assert.strictEqual(parsed.city, 'Kolkata');
      assert.strictEqual(parsed.amenities.length, 2);
    });

    it('rejects ground with too short name', () => {
      assert.throws(() => {
        createGroundSchema.parse({
          owner_id: 1,
          name: 'ab',
          city: 'Mumbai'
        });
      }, /at least 3 characters/);
    });

    it('validates bulk slot addition schema', () => {
      const slotsPayload = {
        slots: [
          {
            slot_date: '2026-10-05',
            start_time: '06:00:00',
            end_time: '09:00:00',
            price: 3500
          },
          {
            slot_date: '2026-10-05',
            start_time: '16:00:00',
            end_time: '19:00:00',
            price: 4500
          }
        ]
      };
      const parsed = bulkAddSlotsSchema.parse(slotsPayload);
      assert.strictEqual(parsed.slots.length, 2);
    });

    it('parses filter query params with defaults', () => {
      const query = { city: 'Mumbai', page: '2', limit: '20' };
      const parsed = filterGroundsQuerySchema.parse(query);
      assert.strictEqual(parsed.city, 'Mumbai');
      assert.strictEqual(parsed.page, 2);
      assert.strictEqual(parsed.limit, 20);
    });
  });

  describe('Match Schemas & Scoring', () => {
    it('validates match creation payload', () => {
      const payload = {
        title: 'Super League Final',
        host_team_id: 2,
        guest_team: 'Kolkata Knights',
        ground_id: 1,
        format: 'T20'
      };
      const parsed = createMatchSchema.parse(payload);
      assert.strictEqual(parsed.title, 'Super League Final');
      assert.strictEqual(parsed.format, 'T20');
      assert.strictEqual(parsed.guest_team, 'Kolkata Knights');
    });

    it('validates join match squad payload', () => {
      const payload = {
        player_id: 3,
        team: 'guest'
      };
      const parsed = joinMatchSchema.parse(payload);
      assert.strictEqual(parsed.player_id, 3);
      assert.strictEqual(parsed.team, 'guest');
    });

    it('validates score update payload with overs regex', () => {
      const score = {
        runs: 168,
        wickets: 4,
        overs: '18.4',
        target: 180,
        innings: 2
      };
      const parsed = updateScoreSchema.parse(score);
      assert.strictEqual(parsed.runs, 168);
      assert.strictEqual(parsed.wickets, 4);
      assert.strictEqual(parsed.overs, '18.4');
    });

    it('rejects invalid overs format (e.g. 18.8)', () => {
      assert.throws(() => {
        updateScoreSchema.parse({
          runs: 100,
          wickets: 2,
          overs: '18.8' // In cricket, only 0-6 balls per over
        });
      }, /valid cricket overs/);
    });

    it('rejects wickets greater than 10', () => {
      assert.throws(() => {
        updateScoreSchema.parse({
          runs: 100,
          wickets: 11,
          overs: '10.0'
        });
      }, /between 0 and 10/);
    });
  });
});
