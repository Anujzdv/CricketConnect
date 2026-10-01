import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';
import Home from './pages/Home';
import GroundsPage from './pages/GroundsPage';
import GroundDetailPage from './pages/GroundDetailPage';
import MatchesPage from './pages/MatchesPage';
import MyBookingsPage from './pages/MyBookingsPage';
import OwnerDashboardPage from './pages/OwnerDashboardPage';
import ProfilePage from './pages/ProfilePage';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen flex flex-col pb-16 md:pb-0"
          style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}>

          <Navbar />

          <main className="flex-1 max-w-7xl mx-auto px-4 lg:px-8 py-8 w-full">
            <Routes>
              <Route path="/"                element={<Home />} />
              <Route path="/grounds"         element={<GroundsPage />} />
              <Route path="/grounds/:id"     element={<GroundDetailPage />} />
              <Route path="/matches"         element={<MatchesPage />} />
              <Route path="/my-bookings"     element={<MyBookingsPage />} />
              <Route path="/owner-dashboard" element={<OwnerDashboardPage />} />
              <Route path="/profile"         element={<ProfilePage />} />
            </Routes>
          </main>

          <MobileNav />

          {/* Footer */}
          <footer style={{ background: 'var(--bg-footer)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
            className="mt-auto px-4 lg:px-8 py-10">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-8"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <div className="text-base font-bold" style={{ color: 'var(--text-footer)' }}>
                    Cricket<span style={{ color: 'var(--brand)' }}>Connect</span>
                  </div>
                  <p className="text-sm mt-1 max-w-xs leading-relaxed" style={{ color: '#64748b' }}>
                    India's premier cricket ground booking, squad management & live scoring network.
                  </p>
                </div>
                <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium" style={{ color: '#64748b' }}>
                  <a href="/grounds" className="hover:text-white transition-colors">Find Grounds</a>
                  <a href="/matches" className="hover:text-white transition-colors">Live Matches</a>
                  <span style={{ color: '#1e293b' }}>|</span>
                  <span>Verified Turfs</span>
                  <span>Instant Booking</span>
                  <span>Match Hosting</span>
                </nav>
              </div>
              <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ color: '#334155' }}>
                <p>© 2026 CricketConnect. All rights reserved.</p>
                <div className="flex items-center gap-4">
                  <span className="cursor-pointer hover:text-gray-300 transition-colors">Privacy Policy</span>
                  <span>·</span>
                  <span className="cursor-pointer hover:text-gray-300 transition-colors">Terms of Service</span>
                  <span>·</span>
                  <span className="cursor-pointer hover:text-gray-300 transition-colors">Ground Partners</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
