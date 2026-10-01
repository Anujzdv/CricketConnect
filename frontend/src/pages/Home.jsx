import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search, MapPin, Calendar, ArrowRight,
  ShieldCheck, Zap, Activity, CheckCircle2,
  TrendingUp, Users
} from 'lucide-react';
import GroundCard from '../components/GroundCard';
import { apiClient, FALLBACK_GROUNDS, FALLBACK_MATCHES } from '../lib/api';
import { getSocket } from '../lib/socket';

export default function Home() {
  const [cityQuery, setCityQuery] = useState('');
  const [dateQuery, setDateQuery] = useState('');
  const [grounds, setGrounds] = useState(FALLBACK_GROUNDS);
  const [liveMatches, setLiveMatches] = useState(FALLBACK_MATCHES);
  const navigate = useNavigate();

  useEffect(() => {
    apiClient.get('/grounds?limit=6')
      .then(res => { if (res.data.success && res.data.data.grounds.length > 0) setGrounds(res.data.data.grounds); })
      .catch(() => {});
    apiClient.get('/matches?limit=4')
      .then(res => { if (res.data.success && res.data.data.matches.length > 0) setLiveMatches(res.data.data.matches); })
      .catch(() => {});
    const socket = getSocket();
    const handleScore = (data) => setLiveMatches(prev =>
      prev.map(m => m.id === data.matchId ? { ...m, current_score: data.current_score, status: data.status } : m)
    );
    socket.on('score_update', handleScore);
    return () => socket.off('score_update', handleScore);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (cityQuery) params.set('city', cityQuery);
    if (dateQuery) params.set('date', dateQuery);
    navigate(`/grounds?${params.toString()}`);
  };

  const featuredMatch = liveMatches.find(m => m.status === 'live') || liveMatches[0];

  return (
    <div className="space-y-16 pb-16">

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl"
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #3b82f6 100%)',
          padding: 'clamp(2.5rem, 6vw, 5rem) clamp(1.5rem, 5vw, 4rem)',
        }}>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'white', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'white', transform: 'translate(-30%, 30%)' }} />

        <div className="relative max-w-3xl space-y-7">
          {/* Eyebrow */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
              <span className="live-dot" style={{ width: '6px', height: '6px', background: '#fbbf24' }} />
              Live Scoring Active
            </span>
            <span className="text-blue-200 text-xs hidden sm:inline">India's #1 Cricket Booking Platform</span>
          </div>

          {/* Headline */}
          <h1 className="font-extrabold text-white leading-tight" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
            Book Cricket Grounds.<br />
            Organize Squads.<br />
            <span className="text-yellow-300">Score Live.</span>
          </h1>

          <p className="text-blue-100 leading-relaxed" style={{ fontSize: 'clamp(0.95rem, 2vw, 1.1rem)', maxWidth: '36rem' }}>
            The complete platform for captains, ground owners, and players — find verified grounds, manage teams, and stream ball-by-ball scores.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch}
            className="flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-2xl shadow-2xl"
            style={{ maxWidth: '600px' }}>
            <div className="flex flex-1 items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <input
                type="text"
                placeholder="City — Mumbai, Bengaluru…"
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
                className="bg-transparent text-sm text-gray-900 focus:outline-none w-full placeholder-gray-400"
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <input
                type="date"
                value={dateQuery}
                onChange={(e) => setDateQuery(e.target.value)}
                className="bg-transparent text-sm text-gray-600 focus:outline-none"
              />
            </div>
            <button type="submit"
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shrink-0"
              style={{ background: '#1d4ed8', color: 'white', boxShadow: '0 4px 14px rgba(29,78,216,0.4)' }}>
              <Search className="w-4 h-4" />
              Find Slots
            </button>
          </form>

          {/* Popular cities */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-blue-200 text-xs">Popular:</span>
            {['Mumbai', 'Bengaluru', 'Delhi', 'Chennai', 'Hyderabad'].map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => { setCityQuery(city); navigate(`/grounds?city=${city}`); }}
                className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Stats ribbon */}
        <div className="relative mt-10 flex flex-wrap gap-6">
          {[
            { icon: <MapPin className="w-4 h-4" />, value: '200+', label: 'Verified Grounds' },
            { icon: <Users className="w-4 h-4" />, value: '5,000+', label: 'Active Players' },
            { icon: <TrendingUp className="w-4 h-4" />, value: '10,000+', label: 'Matches Hosted' },
          ].map(({ icon, value, label }) => (
            <div key={label} className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.9)' }}>
              <div className="p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.15)' }}>
                {icon}
              </div>
              <div>
                <p className="text-base font-bold leading-tight">{value}</p>
                <p className="text-[11px] text-blue-200">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── LIVE MATCH SPOTLIGHT ────────────────────────────── */}
      {featuredMatch && (
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="badge badge-live flex items-center gap-1.5">
                  <span className="live-dot" style={{ width: '6px', height: '6px' }} />
                  {featuredMatch.status === 'live' ? 'LIVE' : 'Match Spotlight'}
                </span>
                <span className="text-xs font-mono font-bold text-gray-400 uppercase">{featuredMatch.format}</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">{featuredMatch.title}</h2>
              <p className="text-sm text-gray-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                {featuredMatch.ground_name || 'Ground Arena'}, {featuredMatch.ground_city || 'City'}
                &nbsp;·&nbsp; by {featuredMatch.host_captain_name}
              </p>
            </div>

            <div className="flex items-center gap-6 p-5 rounded-2xl bg-gray-50 border border-gray-200 w-full lg:w-auto justify-between lg:justify-start">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Score</p>
                <p className="score-mono text-3xl font-bold text-blue-700">
                  {featuredMatch.current_score?.runs || 0}
                  <span className="text-gray-300">/{featuredMatch.current_score?.wickets || 0}</span>
                </p>
              </div>
              <div className="border-l border-gray-200 pl-6">
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Overs</p>
                <p className="score-mono text-2xl font-bold text-gray-800">
                  {featuredMatch.current_score?.overs || '0.0'}
                  <span className="text-sm font-sans font-normal text-gray-400 ml-1">ov</span>
                </p>
                <p className="text-xs text-gray-400">RR {featuredMatch.current_score?.run_rate || '0.00'}</p>
              </div>
              <Link
                to="/matches"
                className="btn-primary hidden sm:flex ml-4"
              >
                Follow Live <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── FEATURED VENUES ─────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="section-label">Featured Venues</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">Popular Cricket Grounds</h2>
            <p className="text-sm text-gray-500 mt-1">Verified venues with instant slot booking</p>
          </div>
          <Link to="/grounds" className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {grounds.slice(0, 3).map((ground) => (
            <GroundCard key={ground.id} ground={ground} />
          ))}
        </div>
      </section>

      {/* ── WHY CRICKETCONNECT ───────────────────────────────── */}
      <section className="rounded-3xl bg-gray-50 border border-gray-200 p-8 sm:p-10 space-y-8">
        <div>
          <p className="section-label">Why CricketConnect</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
            Built for every cricket moment
          </h2>
          <p className="text-gray-500 text-sm mt-2 max-w-xl">
            From weekend gully games to organized tournaments — we make booking, scoring, and squad management seamless.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <ShieldCheck className="w-5 h-5" />, color: '#1d4ed8', bg: '#dbeafe', title: 'Guaranteed Reservations', desc: 'Slots are locked the instant you confirm. Zero double-bookings, ever.' },
            { icon: <Zap className="w-5 h-5" />,          color: '#7c3aed', bg: '#ede9fe', title: 'Live Digital Scoring',   desc: 'Ball-by-ball scorecards your fans can follow from any device in real time.' },
            { icon: <CheckCircle2 className="w-5 h-5" />, color: '#059669', bg: '#d1fae5', title: 'Verified Turfs',         desc: 'Every ground profile shows pitch type, floodlights, parking & amenities.' },
            { icon: <Activity className="w-5 h-5" />,     color: '#d97706', bg: '#fef3c7', title: 'Squad Management',       desc: 'Host fixtures, invite opponent teams, and find open-roster players.' },
          ].map(({ icon, color, bg, title, desc }) => (
            <div
              key={title}
              className="p-5 rounded-xl bg-white border border-gray-200 space-y-3 hover:border-blue-200 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg, color }}>
                {icon}
              </div>
              <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
