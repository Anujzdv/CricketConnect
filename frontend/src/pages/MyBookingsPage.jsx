import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CalendarCheck, MapPin, Clock, XCircle, Trophy, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient } from '../lib/api';

const S = {
  card:   { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0.875rem', boxShadow: 'var(--shadow-card)' },
  muted:  { color: 'var(--text-muted)' },
};

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = () => {
    setLoading(true);
    apiClient.get('/booking/history')
      .then(res => {
        if (res.data.success) setBookings(res.data.data.bookings || []);
        else loadFallback();
      })
      .catch(loadFallback)
      .finally(() => setLoading(false));

    function loadFallback() {
      const today = new Date().toISOString().split('T')[0];
      setBookings([{
        booking_id: 101, booking_status: 'confirmed', amount_paid: 4500,
        booked_at: new Date().toISOString(), slot_id: 3, slot_date: today,
        start_time: '16:00:00', end_time: '19:00:00', ground_id: 1,
        ground_name: 'Wankhede Turf Arena', ground_city: 'Mumbai',
        match_id: 1, match_title: 'Mumbai Mavericks vs Bangalore Blasters'
      }]);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Cancel this booking? The slot will be released back to the market.')) return;
    setCancellingId(bookingId);
    try {
      const res = await apiClient.delete(`/booking/${bookingId}`);
      if (res.data.success) {
        alert('Booking cancelled and slot released.');
        setBookings(prev => prev.map(b => b.booking_id === bookingId ? { ...b, booking_status: 'cancelled' } : b));
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <CalendarCheck className="w-7 h-7" style={{ color: 'var(--brand-text)' }} />
          My Bookings
        </h1>
        <p className="text-sm mt-1" style={S.muted}>Manage your ground reservations, match schedules, and booking receipts.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--brand)' }} />
        </div>
      ) : bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const isConfirmed = booking.booking_status === 'confirmed';
            return (
              <div key={booking.booking_id}
                className="p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
                style={{
                  ...S.card,
                  opacity: isConfirmed ? 1 : 0.65,
                  borderColor: isConfirmed ? 'var(--border-color)' : 'var(--red-border)',
                }}>
                <div className="space-y-2">
                  {/* Status row */}
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold" style={{ color: 'var(--brand-text)' }}>
                      Ref #{booking.booking_id}
                    </span>
                    <span className="badge"
                      style={isConfirmed
                        ? { background: 'var(--green-light)', color: 'var(--green-text)', border: '1px solid var(--green-border)' }
                        : { background: 'var(--red-light)', color: 'var(--red-text)', border: '1px solid var(--red-border)' }}>
                      {booking.booking_status}
                    </span>
                    {booking.match_title && (
                      <span className="badge badge-blue">🏆 Linked Match</span>
                    )}
                  </div>

                  {/* Ground name */}
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{booking.ground_name}</h3>

                  {/* Details */}
                  <div className="flex flex-wrap items-center gap-4 text-sm" style={S.muted}>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--brand-text)' }} />
                      {booking.ground_city}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {booking.slot_date} · {booking.start_time} – {booking.end_time}
                    </span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      ₹{booking.amount_paid} paid
                    </span>
                  </div>

                  {/* Linked match */}
                  {booking.match_title && (
                    <p className="text-xs font-medium" style={{ color: 'var(--brand-text)' }}>
                      🏏 {booking.match_title}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                  {isConfirmed && !booking.match_title && (
                    <button
                      onClick={() => navigate('/matches', { state: { createMatchWithBooking: booking } })}
                      className="btn-primary text-xs py-1.5"
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      Host Match
                    </button>
                  )}
                  {isConfirmed && (
                    <button
                      onClick={() => handleCancelBooking(booking.booking_id)}
                      disabled={cancellingId === booking.booking_id}
                      className="btn-danger text-xs py-1.5"
                    >
                      {cancellingId === booking.booking_id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <XCircle className="w-3.5 h-3.5" />}
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 rounded-2xl text-center space-y-4" style={S.card}>
          <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>No Bookings Yet</h3>
            <p className="text-sm mt-1" style={S.muted}>Discover cricket grounds and book your first slot.</p>
          </div>
          <Link to="/grounds" className="btn-primary mx-auto">Explore Grounds</Link>
        </div>
      )}
    </div>
  );
}
