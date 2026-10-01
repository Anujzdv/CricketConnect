import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Trophy, User, LogOut, ChevronDown, UserCheck, Menu, X, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AuthModal from './AuthModal';

export default function Navbar() {
  const { user, logout, switchDemoRole } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowRoleDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => { setShowMobileMenu(false); }, [location.pathname]);

  const roleBadgeClass =
    user?.role === 'captain' ? 'badge-captain'
    : user?.role === 'ground_owner' ? 'badge-owner'
    : 'badge-player';

  const roleLabel =
    user?.role === 'captain' ? '🏏 Captain'
    : user?.role === 'ground_owner' ? '🏟️ Ground Owner'
    : '🏃 Player';

  const navLinks = [
    { to: '/grounds', label: 'Grounds & Slots' },
    { to: '/matches', label: 'Live Matches', live: true },
    ...(user?.role === 'captain' ? [{ to: '/my-bookings', label: 'My Bookings' }] : []),
    ...(user?.role === 'ground_owner' ? [{ to: '/owner-dashboard', label: 'Dashboard' }] : []),
    ...(user ? [{ to: '/profile', label: 'Profile' }] : []),
  ];

  const navStyle = {
    background: 'var(--bg-navbar)',
    borderBottom: '1px solid var(--border-color)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    transition: 'background 0.25s ease',
  };

  const linkActiveStyle = {
    background: 'var(--brand-light)',
    color: 'var(--brand-text)',
    fontWeight: 600,
  };

  const linkDefaultStyle = {
    color: 'var(--text-muted)',
  };

  const dropdownStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-modal)',
  };

  return (
    <>
      <header className="sticky top-0 z-40" style={navStyle}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--brand-dark) 0%, var(--brand) 100%)' }}>
              <Trophy style={{ width: '18px', height: '18px', color: 'white' }} />
            </div>
            <span className="text-[1.05rem] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Cricket<span style={{ color: 'var(--brand-text)' }}>Connect</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {navLinks.map(({ to, label, live }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={isActive(to) ? linkActiveStyle : linkDefaultStyle}
                onMouseEnter={e => !isActive(to) && (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => !isActive(to) && (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                {live && <span className="live-dot" style={{ width: '6px', height: '6px' }} />}
                {label}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2">

            {/* 🌙 Theme Toggle */}
            <button onClick={toggleTheme} className="theme-toggle" title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              {isDark
                ? <Sun style={{ width: '16px', height: '16px', color: '#fbbf24' }} />
                : <Moon style={{ width: '16px', height: '16px' }} />}
            </button>

            {/* Locked role badge (real user) */}
            {user && !user.isDemo && (
              <span className={`badge ${roleBadgeClass} hidden sm:inline-flex`}>{roleLabel}</span>
            )}

            {/* Demo switcher */}
            {(!user || user.isDemo) && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border"
                  style={{
                    background: user?.isDemo ? 'var(--amber-light)' : 'var(--bg-card)',
                    borderColor: user?.isDemo ? 'var(--amber-border)' : 'var(--border-color)',
                    color: user?.isDemo ? 'var(--amber-text)' : 'var(--text-muted)',
                  }}
                >
                  <UserCheck style={{ width: '16px', height: '16px' }} />
                  <span className="hidden sm:inline">
                    {user?.isDemo
                      ? `Demo: ${user.role === 'captain' ? 'Captain' : user.role === 'ground_owner' ? 'Owner' : 'Player'}`
                      : 'Try Demo'}
                  </span>
                  <ChevronDown style={{ width: '14px', height: '14px', opacity: 0.6 }} />
                </button>

                {showRoleDropdown && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl p-2 z-50 animate-fade-in" style={dropdownStyle}>
                    <p className="px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold" style={{ color: 'var(--amber-text)' }}>
                      Demo Personas
                    </p>
                    <p className="px-3 pb-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Quick tester accounts. Log in for your real account.
                    </p>
                    <hr style={{ borderColor: 'var(--border-color)', margin: '0 0 0.25rem' }} />
                    {[
                      { role: 'captain',      label: '🏏 Captain',       sub: 'Book grounds & host matches' },
                      { role: 'ground_owner', label: '🏟️ Ground Owner',  sub: 'Manage slots & ground' },
                      { role: 'player',       label: '🏃 Player',         sub: 'Browse & join squads' },
                    ].map(({ role, label, sub }) => {
                      const isSelected = user?.isDemo && user?.role === role;
                      return (
                        <button
                          key={role}
                          onClick={() => { switchDemoRole(role); setShowRoleDropdown(false); }}
                          className="w-full text-left px-3 py-2.5 rounded-lg mt-0.5 flex items-center justify-between transition-all"
                          style={{
                            background: isSelected ? 'var(--brand-light)' : 'transparent',
                            color: isSelected ? 'var(--brand-text)' : 'var(--text-secondary)',
                          }}
                          onMouseEnter={e => !isSelected && (e.currentTarget.style.background = 'var(--bg-muted)')}
                          onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'transparent')}
                        >
                          <div>
                            <p className="text-sm font-semibold">{label}</p>
                            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>
                          </div>
                          {isSelected && <span className="w-2 h-2 rounded-full" style={{ background: 'var(--brand)' }} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Auth / User */}
            {user ? (
              <div className="flex items-center gap-1.5">
                <Link to="/profile"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all group"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-border)'; e.currentTarget.style.background = 'var(--brand-light)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--brand-dark), var(--brand))' }}>
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <div className="hidden lg:flex flex-col leading-tight text-left">
                    <span className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                      {user.name}
                      {user.isDemo && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{ background: 'var(--amber-light)', color: 'var(--amber-text)' }}>DEMO</span>
                      )}
                    </span>
                    <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{user.email}</span>
                  </div>
                </Link>
                <button onClick={logout} title="Log out" className="theme-toggle"
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-light)'; e.currentTarget.style.color = 'var(--red-text)'; e.currentTarget.style.borderColor = 'var(--red-border)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}>
                  <LogOut style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="btn-primary">
                <User style={{ width: '16px', height: '16px' }} />
                Log In
              </button>
            )}

            {/* Mobile Hamburger */}
            <button
              className="md:hidden theme-toggle"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu
                ? <X style={{ width: '18px', height: '18px' }} />
                : <Menu style={{ width: '18px', height: '18px' }} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="md:hidden animate-fade-in py-2 px-4"
            style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
            {navLinks.map(({ to, label, live }) => (
              <Link key={to} to={to}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-all"
                style={isActive(to) ? linkActiveStyle : { color: 'var(--text-secondary)' }}
              >
                {live && <span className="live-dot" style={{ width: '6px', height: '6px' }} />}
                {label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
}
