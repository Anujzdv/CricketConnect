import { useState, useEffect } from 'react';
import { X, Trophy, Loader2 } from 'lucide-react';
import { apiClient, FALLBACK_GROUNDS } from '../lib/api';

export default function CreateMatchModal({ prefilledBooking, onClose, onMatchCreated }) {
  const [title, setTitle] = useState('');
  const [guestTeam, setGuestTeam] = useState('Opponent XI');
  const [format, setFormat] = useState('T20');
  const [groundId, setGroundId] = useState(prefilledBooking?.ground_id || 1);
  const [grounds, setGrounds] = useState(FALLBACK_GROUNDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch grounds for dropdown
    apiClient.get('/grounds')
      .then(res => {
        if (res.data.success && res.data.data.grounds.length > 0) {
          setGrounds(res.data.data.grounds);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        title,
        guest_team: guestTeam,
        format,
        ground_id: parseInt(groundId, 10),
        slot_id: prefilledBooking?.slot_id || null
      };

      const res = await apiClient.post('/matches', payload);
      if (res.data.success) {
        if (onMatchCreated) onMatchCreated(res.data.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-surface-850 hover:bg-surface-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-heading">Host a Cricket Match</h3>
              <p className="text-xs text-slate-400">Set up your fixture and invite squad players</p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Match Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Bandra Premier League Semifinal"
                className="w-full px-3 py-2.5 rounded-xl bg-surface-850 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Opponent / Guest Team</label>
                <input
                  type="text"
                  value={guestTeam}
                  onChange={(e) => setGuestTeam(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-850 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-850 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-400"
                >
                  <option value="T10">T10 (10 Overs)</option>
                  <option value="T20">T20 (20 Overs)</option>
                  <option value="ODI">ODI (50 Overs)</option>
                  <option value="Custom">Custom Box Cricket</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Venue</label>
              <select
                value={groundId}
                onChange={(e) => setGroundId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-850 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-400"
              >
                {grounds.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.city})
                  </option>
                ))}
              </select>
            </div>

            {prefilledBooking && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                ✅ Automatically linked with your Booking Reference #{prefilledBooking.id}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-surface-850 hover:bg-surface-800 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-surface-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                <span>Create Match Fixture</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
