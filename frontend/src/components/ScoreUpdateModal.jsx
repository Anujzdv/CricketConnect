import { useState } from 'react';
import { X, Trophy, Activity, Loader2 } from 'lucide-react';
import { apiClient } from '../lib/api';

export default function ScoreUpdateModal({ match, onClose, onScoreUpdated }) {
  const [runs, setRuns] = useState(match.current_score?.runs || 0);
  const [wickets, setWickets] = useState(match.current_score?.wickets || 0);
  const [overs, setOvers] = useState(match.current_score?.overs || '0.0');
  const [target, setTarget] = useState(match.current_score?.target || '');
  const [status, setStatus] = useState(match.status || 'live');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        runs: parseInt(runs, 10),
        wickets: parseInt(wickets, 10),
        overs: overs.trim(),
        target: target ? parseInt(target, 10) : null,
        status
      };

      const res = await apiClient.patch(`/matches/${match.id}/score`, payload);
      if (res.data.success) {
        if (onScoreUpdated) onScoreUpdated(res.data.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to update score');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md glass-panel rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-surface-850 hover:bg-surface-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-heading">Update Live Score</h3>
              <p className="text-xs text-slate-400 truncate max-w-[240px]">{match.title}</p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Runs</label>
                <input
                  type="number"
                  min="0"
                  value={runs}
                  onChange={(e) => setRuns(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-850 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Wickets (0-10)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={wickets}
                  onChange={(e) => setWickets(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-850 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400 font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Overs (e.g. 14.3)</label>
                <input
                  type="text"
                  value={overs}
                  onChange={(e) => setOvers(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-850 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400 font-mono"
                  placeholder="0.0"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target (Optional)</label>
                <input
                  type="number"
                  min="1"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-850 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400 font-mono"
                  placeholder="e.g. 175"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Match Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-850 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
              >
                <option value="scheduled">Scheduled</option>
                <option value="live">Live (Broadcasting)</option>
                <option value="completed">Completed</option>
                <option value="abandoned">Abandoned</option>
              </select>
            </div>

            <p className="text-[11px] text-slate-400">
              ⚡ Pushing this update will instantly refresh the live match scoreboard for all teammates and fans.
            </p>

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
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-surface-950 text-xs font-bold transition-all shadow-lg shadow-cyan-500/20"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                <span>Broadcast Score</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
