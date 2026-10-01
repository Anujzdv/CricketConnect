import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MapPin, 
  Clock, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  ChevronRight,
  Navigation
} from 'lucide-react';
import { apiClient, FALLBACK_GROUNDS } from '../lib/api';
import BookingModal from '../components/BookingModal';
import GroundsMap from '../components/GroundsMap';

// Fallback slots generator for demo if backend is offline
const generateMockSlots = (groundId, dateStr) => [
  { id: 101, ground_id: groundId, slot_date: dateStr, start_time: '06:00:00', end_time: '09:00:00', price: 3500, status: 'available' },
  { id: 102, ground_id: groundId, slot_date: dateStr, start_time: '09:30:00', end_time: '12:30:00', price: 4000, status: 'booked' },
  { id: 103, ground_id: groundId, slot_date: dateStr, start_time: '16:00:00', end_time: '19:00:00', price: 4500, status: 'available' },
  { id: 104, ground_id: groundId, slot_date: dateStr, start_time: '19:30:00', end_time: '22:30:00', price: 5000, status: 'available' }
];

export default function GroundDetailPage() {
  const { id } = useParams();
  const groundId = parseInt(id, 10);

  const [ground, setGround] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlotForBooking, setSelectedSlotForBooking] = useState(null);

  useEffect(() => {
    apiClient.get(`/grounds/${groundId}?date=${selectedDate}`)
      .then(res => {
        if (res.data.success) {
          setGround(res.data.data);
          setSlots(res.data.data.slots || []);
        } else {
          loadFallback();
        }
      })
      .catch(() => {
        loadFallback();
      });

    function loadFallback() {
      const fallback = FALLBACK_GROUNDS.find(g => g.id === groundId) || FALLBACK_GROUNDS[0];
      setGround(fallback);
      setSlots(generateMockSlots(groundId, selectedDate));
    }
  }, [groundId, selectedDate]);

  const handleBookingSuccess = (bookedSlotId) => {
    // Optimistically update slot status to 'booked'
    setSlots(prev => prev.map(s => s.id === bookedSlotId ? { ...s, status: 'booked' } : s));
  };

  if (!ground) {
    return (
      <div className="p-12 text-center text-slate-400">
        Loading venue details...
      </div>
    );
  }

  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfter = new Date(Date.now() + 172800000).toISOString().split('T')[0];

  return (
    <div className="space-y-8 pb-16">
      {/* Back link */}
      <Link
        to="/grounds"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Grounds</span>
      </Link>

      {/* Hero Venue Details Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-panel border border-white/10 shadow-2xl">
        <div className="relative h-64 sm:h-80 w-full overflow-hidden">
          <img
            src={ground.cover_image_url || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80'}
            alt={ground.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/60 to-transparent"></div>

          {/* City Badge */}
          <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-950/80 backdrop-blur-md border border-white/10 text-xs font-semibold text-slate-200">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>{ground.city}</span>
          </div>

          {/* Venue Title & Info */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-heading">{ground.name}</h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-2">
                <span>Managed by <strong className="text-white">{ground.owner_name || 'Ground Owner'}</strong></span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">★ 4.9 (Verified Venue)</span>
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-900/90 border border-slate-700 text-xs text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verified Cricket Turf</span>
            </div>
          </div>
        </div>

        {/* Amenities Bar */}
        <div className="p-6 bg-surface-900/80 border-t border-white/5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 mr-2">Amenities:</span>
          {(ground.amenities || ['Floodlights', 'Grass Pitch', 'Pavilion', 'Changing Rooms']).map((amenity, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-surface-850 border border-slate-800 text-xs text-slate-300"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>{amenity}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Slot Booking Section */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white font-heading flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              <span>Available Time Slots</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose a date and reserve your preferred pitch time slot with instant confirmation.
            </p>
          </div>

          {/* Quick Date Selector */}
          <div className="flex items-center gap-2">
            {[
              { label: 'Today', date: new Date().toISOString().split('T')[0] },
              { label: 'Tomorrow', date: tomorrow },
              { label: 'Day After', date: dayAfter }
            ].map(d => (
              <button
                key={d.label}
                onClick={() => setSelectedDate(d.date)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedDate === d.date
                    ? 'bg-emerald-500 text-surface-950 shadow-md shadow-emerald-500/20'
                    : 'bg-surface-850 hover:bg-surface-800 text-slate-300 border border-slate-800'
                }`}
              >
                {d.label}
              </button>
            ))}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-1 rounded-xl bg-surface-850 border border-slate-800 text-xs text-slate-300 focus:outline-none"
            />
          </div>
        </div>

        {/* Slots Grid */}
        {slots.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {slots.map((slot) => {
              const isAvailable = slot.status === 'available';

              return (
                <div
                  key={slot.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                    isAvailable
                      ? 'bg-surface-850/80 border-slate-800 hover:border-emerald-500/40 hover:bg-surface-800 shadow-md'
                      : 'bg-surface-950/40 border-slate-900 opacity-60'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-300">Slot #{slot.id}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        isAvailable
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {slot.status}
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-white pt-1">
                      {slot.start_time} - {slot.end_time}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Price</span>
                      <span className="text-base font-bold text-emerald-400 font-heading">
                        ₹{parseInt(slot.price, 10).toLocaleString()}
                      </span>
                    </div>

                    {isAvailable ? (
                      <button
                        onClick={() => setSelectedSlotForBooking(slot)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-surface-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20"
                      >
                        <span>Reserve</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Lock className="w-3 h-3" />
                        <span>Unavailable</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            No slots scheduled for this date. Check back soon or select another date.
          </div>
        )}
      </section>

      {/* Venue Location & Map Section */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white font-heading flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              <span>Venue Location & Surroundings</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Exact ground location in {ground.city}. Check driving distance and pitch access.
            </p>
          </div>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${ground.latitude || 19.076},${ground.longitude || 72.8777}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-850 hover:bg-surface-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <span>Get Driving Directions</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>

        <GroundsMap
          grounds={[ground]}
          className="h-[300px] w-full rounded-2xl"
        />
      </section>

      {/* Booking Modal */}
      {selectedSlotForBooking && (
        <BookingModal
          ground={ground}
          slot={selectedSlotForBooking}
          onClose={() => setSelectedSlotForBooking(null)}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
}
