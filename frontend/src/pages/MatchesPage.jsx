import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Trophy, MapPin, Users, Plus, UserPlus, Edit3, Radio, Clock } from 'lucide-react';
import { apiClient, FALLBACK_MATCHES } from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from '../context/AuthContext';
import ScoreUpdateModal from '../components/ScoreUpdateModal';
import CreateMatchModal from '../components/CreateMatchModal';

export default function MatchesPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [matches, setMatches] = useState(FALLBACK_MATCHES);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [activeMatchForScore, setActiveMatchForScore] = useState(null);
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);
  const [prefilledBooking, setPrefilledBooking] = useState(null);

  useEffect(() => {
    if (location.state?.createMatchWithBooking) {
      setPrefilledBooking(location.state.createMatchWithBooking);
      setShowCreateMatchModal(true);
    }
  }, [location.state]);

  useEffect(() => {
    const socket = getSocket();
    apiClient.get('/matches')
      .then(res => {
        if (res.data.success && res.data.data.matches.length > 0) {
          const list = res.data.data.matches;
          setMatches(list);
          list.forEach(m => socket.emit('join_match', m.id));
        } else {
          FALLBACK_MATCHES.forEach(m => socket.emit('join_match', m.id));
        }
      })
      .catch(() => FALLBACK_MATCHES.forEach(m => socket.emit('join_match', m.id)));

    const handleScoreUpdate = (data) => {
      setMatches(prev => prev.map(m =>
        m.id === data.matchId ? { ...m, status: data.status, current_score: data.current_score } : m
      ));
    };
    socket.on('score_update', handleScoreUpdate);
    return () => socket.off('score_update', handleScoreUpdate);
  }, []);

  const handleJoinSquad = async (matchId, team = 'host') => {
    try {
      const res = await apiClient.post(`/matches/${matchId}/join`, { team });
      if (res.data.success) {
        alert('🎉 Successfully joined the match squad!');
        setMatches(prev => prev.map(m => m.id === matchId ? { ...m, squad_count: (m.squad_count || 0) + 1 } : m));
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || err.message || 'Failed to join squad');
    }
  };

  const filteredMatches = matches.filter(m => selectedFilter === 'all' || m.status === selectedFilter);

  const FILTER_TABS = [
    { key: 'all',       label: 'All Matches' },
    { key: 'live',      label: '● Live' },
    { key: 'scheduled', label: 'Upcoming' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-7 h-7 text-blue-600" />
            Match Center
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time ball-by-ball scores, squad rosters, and local match fixtures.
          </p>
        </div>
        {user?.role === 'captain' && (
          <button
            onClick={() => { setPrefilledBooking(null); setShowCreateMatchModal(true); }}
            className="btn-primary shrink-0"
          >
            <Plus className="w-4 h-4" />
            Host a Match
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 pb-1 overflow-x-auto border-b border-gray-200">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setSelectedFilter(tab.key)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all shrink-0 mb-[-1px]"
            style={{
              background:   selectedFilter === tab.key ? '#1d4ed8' : 'transparent',
              color:        selectedFilter === tab.key ? '#ffffff' : '#6b7280',
              borderBottom: selectedFilter === tab.key ? '2px solid #1d4ed8' : '2px solid transparent',
              borderRadius: '0.5rem 0.5rem 0 0',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Matches Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredMatches.map(match => {
          const isLive = match.status === 'live';
          const score  = match.current_score || { runs: 0, wickets: 0, overs: '0.0' };

          return (
            <div
              key={match.id}
              className="bg-white rounded-2xl p-5 flex flex-col justify-between gap-5 border transition-all"
              style={{
                borderColor: isLive ? '#bfdbfe' : '#e5e7eb',
                boxShadow:   isLive
                  ? '0 4px 20px rgba(29, 78, 216, 0.1)'
                  : '0 1px 3px rgba(0,0,0,0.06)',
                background:  isLive
                  ? 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)'
                  : '#ffffff',
              }}
            >
              {/* Header: Status + Score */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    {isLive ? (
                      <span className="badge badge-live flex items-center gap-1.5">
                        <span className="live-dot" style={{ width: '6px', height: '6px' }} />
                        LIVE
                      </span>
                    ) : (
                      <span className="badge"
                        style={{ background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' }}>
                        {match.status}
                      </span>
                    )}
                    <span className="text-xs font-mono font-bold text-gray-400 uppercase">{match.format}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{match.title}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    {match.ground_name || 'Ground Arena'}, {match.ground_city || 'City'}
                  </p>
                </div>

                {/* Score */}
                <div className="text-right p-3 rounded-xl bg-gray-50 border border-gray-200 shrink-0">
                  <div className="score-mono text-2xl font-bold text-blue-700">
                    {score.runs}<span className="text-gray-300">/{score.wickets}</span>
                  </div>
                  <div className="text-xs text-gray-400">{score.overs} <span>ov</span></div>
                  <div className="text-[10px] text-gray-400">RR {score.run_rate || '0.00'}</div>
                </div>
              </div>

              {/* Teams */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-2 text-sm">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Host: <strong className="text-gray-900">{match.host_captain_name || 'Captain'}</strong></span>
                  <span className="text-gray-400 text-xs font-bold">VS</span>
                  <span>Opponent: <strong className="text-gray-900">{match.guest_team || 'Opponent Squad'}</strong></span>
                </div>
                <div className="flex items-center justify-between text-gray-400 pt-2 border-t border-gray-200 text-xs">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {match.squad_count || 1} Squad Members
                  </span>
                  {match.slot_date && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {match.slot_date} at {match.start_time}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100">
                {user?.role === 'captain' && (
                  <button
                    onClick={() => setActiveMatchForScore(match)}
                    className="btn-secondary text-xs py-1.5 text-blue-700 border-blue-200 hover:bg-blue-50"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Update Score
                  </button>
                )}
                <button
                  onClick={() => handleJoinSquad(match.id, 'host')}
                  className="btn-primary text-xs py-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Join Squad
                </button>
                <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                  <Radio className="w-3 h-3 text-blue-400" />
                  <span>match_{match.id}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {activeMatchForScore && (
        <ScoreUpdateModal
          match={activeMatchForScore}
          onClose={() => setActiveMatchForScore(null)}
          onScoreUpdated={(updated) => setMatches(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m))}
        />
      )}

      {showCreateMatchModal && (
        <CreateMatchModal
          prefilledBooking={prefilledBooking}
          onClose={() => { setShowCreateMatchModal(false); setPrefilledBooking(null); }}
          onMatchCreated={(newMatch) => setMatches(prev => [newMatch, ...prev])}
        />
      )}
    </div>
  );
}
