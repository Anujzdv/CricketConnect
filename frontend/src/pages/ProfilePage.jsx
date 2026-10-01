import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Shield, CalendarCheck, Trophy, CheckCircle2, AlertCircle, Loader2, MapPin, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/api';

const S = {
  card:   { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0.875rem', boxShadow: 'var(--shadow-card)', transition: 'background 0.25s' },
  subtle: { background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '0.75rem' },
  label:  { color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.375rem', display: 'block' },
  value:  { color: 'var(--text-primary)', fontWeight: 600 },
  muted:  { color: 'var(--text-muted)' },
  h2:     { color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.125rem' },
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setName(user.name || '');
    apiClient.get('/users/me')
      .then(res => {
        if (res.data.success) { setProfileData(res.data.data); setName(res.data.data.name); }
      })
      .catch(() => {
        setProfileData({
          ...user,
          stats: user.role === 'captain'
            ? { bookings_count: 3, matches_hosted_count: 2 }
            : user.role === 'ground_owner'
            ? { grounds_count: 3, slots_count: 24 }
            : { matches_joined_count: 4 }
        });
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setFeedback({ type: '', message: '' });
    try {
      const payload = { name };
      if (password.trim()) payload.password = password.trim();
      const res = await apiClient.put('/users/me', payload);
      if (res.data.success) {
        setFeedback({ type: 'success', message: '✓ Profile updated successfully!' });
        setPassword('');
        const updated = { ...user, name: res.data.data.name };
        localStorage.setItem('cricketconnect_user', JSON.stringify(updated));
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.error?.message || 'Failed to update profile.' });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-2xl text-center space-y-4" style={S.card}>
        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Not Logged In</h2>
        <p className="text-sm" style={S.muted}>Please log in to view and manage your profile.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand)' }} />
      </div>
    );
  }

  const stats = profileData?.stats || {};

  const roleBadgeStyle = user.role === 'captain'
    ? { background: 'var(--brand-light)', color: 'var(--brand-text)', border: '1px solid var(--brand-border)' }
    : user.role === 'ground_owner'
    ? { background: 'var(--amber-light)', color: 'var(--amber-text)', border: '1px solid var(--amber-border)' }
    : { background: 'var(--green-light)', color: 'var(--green-text)', border: '1px solid var(--green-border)' };

  return (
    <div className="space-y-6 pb-12 max-w-3xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>My Profile</h1>
        <p className="text-sm mt-1" style={S.muted}>Manage your account information and preferences.</p>
      </div>

      {/* Profile Card */}
      <div className="p-6 rounded-2xl space-y-5" style={S.card}>
        {/* Avatar + Basic Info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--brand-dark), var(--brand))' }}>
            {user.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{profileData?.name || user.name}</h2>
              {user.isDemo && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: 'var(--amber-light)', color: 'var(--amber-text)' }}>DEMO</span>
              )}
            </div>
            <p className="text-sm mt-0.5" style={S.muted}>{user.email}</p>
            <div className="mt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={roleBadgeStyle}>
                {user.role === 'captain' ? '🏏 Captain' : user.role === 'ground_owner' ? '🏟️ Ground Owner' : '🏃 Player'}
              </span>
            </div>
          </div>
        </div>

        <hr style={{ borderColor: 'var(--border-color)' }} />

        {/* Info Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl space-y-1" style={S.subtle}>
            <p style={S.label}>Full Name</p>
            <p className="font-semibold" style={S.value}>{profileData?.name || user.name}</p>
          </div>
          <div className="p-4 rounded-xl space-y-1" style={S.subtle}>
            <p style={S.label}>Email Address</p>
            <p className="font-semibold" style={S.value}>{user.email}</p>
          </div>
          <div className="p-4 rounded-xl space-y-1" style={S.subtle}>
            <p style={S.label}>Account Role</p>
            <p className="font-semibold capitalize" style={S.value}>
              {user.role?.replace('_', ' ')}
            </p>
          </div>
          <div className="p-4 rounded-xl space-y-1" style={S.subtle}>
            <p style={S.label}>Account Status</p>
            <p className="font-semibold flex items-center gap-1.5" style={{ color: 'var(--green-text)' }}>
              <CheckCircle2 className="w-4 h-4" /> Active
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {Object.keys(stats).length > 0 && (
        <div className="p-6 rounded-2xl space-y-4" style={S.card}>
          <h2 style={S.h2}>Activity Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {user.role === 'captain' && [
              { label: 'Grounds Booked', value: stats.bookings_count ?? 3, icon: <CalendarCheck className="w-5 h-5" /> },
              { label: 'Matches Hosted', value: stats.matches_hosted_count ?? 2, icon: <Trophy className="w-5 h-5" /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="p-4 rounded-xl text-center space-y-2" style={S.subtle}>
                <div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center"
                  style={{ background: 'var(--brand-light)', color: 'var(--brand-text)' }}>
                  {icon}
                </div>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
                <p className="text-xs font-medium" style={S.muted}>{label}</p>
              </div>
            ))}

            {user.role === 'ground_owner' && [
              { label: 'Grounds Listed', value: stats.grounds_count ?? 3, icon: <MapPin className="w-5 h-5" /> },
              { label: 'Slots Published', value: stats.slots_count ?? 24, icon: <CalendarCheck className="w-5 h-5" /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="p-4 rounded-xl text-center space-y-2" style={S.subtle}>
                <div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center"
                  style={{ background: 'var(--amber-light)', color: 'var(--amber-text)' }}>
                  {icon}
                </div>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
                <p className="text-xs font-medium" style={S.muted}>{label}</p>
              </div>
            ))}

            {user.role === 'player' && (
              <div className="p-4 rounded-xl text-center space-y-2" style={S.subtle}>
                <div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center"
                  style={{ background: 'var(--green-light)', color: 'var(--green-text)' }}>
                  <Trophy className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.matches_joined_count ?? 4}</p>
                <p className="text-xs font-medium" style={S.muted}>Matches Joined</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Profile Form */}
      {!user.isDemo && (
        <div className="p-6 rounded-2xl space-y-5" style={S.card}>
          <div>
            <h2 style={S.h2}>Edit Profile</h2>
            <p className="text-sm mt-0.5" style={S.muted}>Update your name or change your password.</p>
          </div>

          {feedback.message && (
            <div className="px-4 py-3 rounded-xl text-sm flex items-center gap-2"
              style={{
                background: feedback.type === 'success' ? 'var(--green-light)' : 'var(--red-light)',
                border: `1px solid ${feedback.type === 'success' ? 'var(--green-border)' : 'var(--red-border)'}`,
                color: feedback.type === 'success' ? 'var(--green-text)' : 'var(--red-text)',
              }}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {feedback.message}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="form-label">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3" style={{ color: 'var(--text-faint)' }} />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name" className="input pl-9" required />
              </div>
            </div>

            <div>
              <label className="form-label">New Password <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(leave blank to keep current)</span></label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3" style={{ color: 'var(--text-faint)' }} />
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" className="input pl-9 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3" style={{ color: 'var(--text-faint)' }}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button type="submit" disabled={isUpdating} className="btn-primary">
                {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
              <button type="button" onClick={() => { setName(user.name); setPassword(''); setFeedback({ type: '', message: '' }); }}
                className="btn-secondary">
                Reset
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quick Links */}
      <div className="p-6 rounded-2xl space-y-3" style={S.card}>
        <h2 style={S.h2}>Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { to: '/grounds',   icon: <MapPin className="w-4 h-4" />,         label: 'Explore Grounds',    show: true },
            { to: '/matches',   icon: <Trophy className="w-4 h-4" />,         label: 'Live Match Center',  show: true },
            { to: '/my-bookings', icon: <CalendarCheck className="w-4 h-4" />, label: 'My Bookings',       show: user?.role === 'captain' },
            { to: '/owner-dashboard', icon: <Shield className="w-4 h-4" />,   label: 'Owner Dashboard',   show: user?.role === 'ground_owner' },
          ].filter(l => l.show).map(({ to, icon, label }) => (
            <Link key={to} to={to}
              className="flex items-center justify-between px-4 py-3 rounded-xl border transition-all"
              style={{ background: 'var(--bg-subtle)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-border)'; e.currentTarget.style.color = 'var(--brand-text)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                {icon} {label}
              </span>
              <ArrowRight className="w-4 h-4 opacity-50" />
            </Link>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="p-6 rounded-2xl space-y-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--red-border)', borderRadius: '0.875rem' }}>
        <h2 className="text-base font-bold" style={{ color: 'var(--red-text)' }}>Sign Out</h2>
        <p className="text-sm" style={S.muted}>You will be signed out of this device.</p>
        <button onClick={logout} className="btn-danger">
          Sign Out of CricketConnect
        </button>
      </div>
    </div>
  );
}
