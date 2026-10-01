import { useState } from 'react';
import { X, Lock, Mail, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ onClose }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('captain');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = isRegister
      ? await register({ name, email, password, role })
      : await login(email, password);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'An unexpected error occurred. Please try again.');
    }
    setLoading(false);
  };

  const ROLES = [
    { value: 'captain',      emoji: '🏏', label: 'Captain',      desc: 'Book grounds & host matches' },
    { value: 'ground_owner', emoji: '🏟️', label: 'Ground Owner', desc: 'List grounds & manage slots' },
    { value: 'player',       emoji: '🏃', label: 'Player',        desc: 'Browse matches & join squads' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'var(--overlay)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md rounded-2xl" style={{ background: 'var(--bg-modal)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-modal)' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {isRegister ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {isRegister ? 'Join thousands of cricket players & owners' : 'Sign in to manage your bookings & matches'}
            </p>
          </div>
          <button onClick={onClose} className="theme-toggle">
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="px-6 pb-4">
          <div className="flex rounded-xl p-1" style={{ background: 'var(--bg-muted)' }}>
            {[{ key: false, label: 'Log In' }, { key: true, label: 'Sign Up' }].map(({ key, label }) => (
              <button
                key={label}
                onClick={() => { setIsRegister(key); setError(''); }}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: isRegister === key ? 'var(--bg-card)' : 'transparent',
                  color: isRegister === key ? 'var(--brand-text)' : 'var(--text-muted)',
                  boxShadow: isRegister === key ? 'var(--shadow-card)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
            style={{ background: 'var(--red-light)', border: '1px solid var(--red-border)', color: 'var(--red-text)' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {isRegister && (
            <div>
              <label className="form-label">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3" style={{ color: 'var(--text-faint)' }} />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Virat Kohli" className="input pl-9" required />
              </div>
            </div>
          )}

          <div>
            <label className="form-label">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3" style={{ color: 'var(--text-faint)' }} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" className="input pl-9" required />
            </div>
          </div>

          <div>
            <label className="form-label">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3" style={{ color: 'var(--text-faint)' }} />
              <input type={showPassword ? 'text' : 'password'} value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" className="input pl-9 pr-10" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3" style={{ color: 'var(--text-faint)' }}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="form-label">Account Type</label>
              <div className="space-y-2">
                {ROLES.map(({ value, emoji, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all border"
                    style={{
                      background: role === value ? 'var(--brand-light)' : 'var(--bg-subtle)',
                      borderColor: role === value ? 'var(--brand-border)' : 'var(--border-color)',
                    }}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                      style={{ background: role === value ? 'var(--brand-light)' : 'var(--bg-muted)' }}>
                      {emoji}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: role === value ? 'var(--brand-text)' : 'var(--text-primary)' }}>
                        {label}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                    </div>
                    <div className="ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                      style={{
                        borderColor: role === value ? 'var(--brand)' : 'var(--border-color)',
                        background: role === value ? 'var(--brand)' : 'transparent',
                      }}>
                      {role === value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2"
            style={{ fontSize: '0.9375rem' }}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isRegister ? 'Create Account' : 'Log In to CricketConnect'}
          </button>
        </form>
      </div>
    </div>
  );
}
