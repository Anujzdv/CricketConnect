import { Link, useLocation } from 'react-router-dom';
import { Search, Trophy, CalendarCheck, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MobileNav() {
  const location = useLocation();
  const { user } = useAuth();
  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: '/grounds', Icon: Search,       label: 'Grounds' },
    { to: '/matches', Icon: Trophy,       label: 'Matches' },
    {
      to: user?.role === 'ground_owner' ? '/owner-dashboard' : '/my-bookings',
      Icon: user?.role === 'ground_owner' ? Shield : CalendarCheck,
      label: user?.role === 'ground_owner' ? 'Dashboard' : 'Bookings',
    },
  ];

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-white"
      style={{
        borderTop: '1px solid #e5e7eb',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
        height: '60px',
      }}
    >
      {navLinks.map(({ to, Icon, label }) => (
        <Link
          key={to}
          to={to}
          className="flex flex-col items-center gap-0.5 px-4 h-full justify-center text-[10px] font-semibold transition-all"
          style={{ color: isActive(to) ? '#1d4ed8' : '#9ca3af' }}
        >
          <Icon className="w-5 h-5" style={{ strokeWidth: isActive(to) ? 2.5 : 2 }} />
          <span>{label}</span>
          {isActive(to) && (
            <span className="absolute bottom-0 w-8 h-0.5 rounded-t-full bg-blue-600" />
          )}
        </Link>
      ))}

      {user && (
        <Link
          to="/profile"
          className="flex flex-col items-center gap-0.5 px-4 h-full justify-center text-[10px] font-semibold transition-all"
          style={{ color: isActive('/profile') ? '#1d4ed8' : '#9ca3af' }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #1e3a8a)' }}
          >
            {user.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <span>Profile</span>
        </Link>
      )}
    </div>
  );
}
