import { useState, useEffect } from 'react';
import { Shield, Plus, MapPin, Loader2, TrendingUp, CalendarCheck, DollarSign, BarChart3, X } from 'lucide-react';
import { apiClient, FALLBACK_GROUNDS } from '../lib/api';
import CreateGroundModal from '../components/CreateGroundModal';

const S = {
  card:   { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '0.875rem', boxShadow: 'var(--shadow-card)' },
  subtle: { background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '0.75rem' },
  label:  { color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
  h2:     { color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.125rem' },
  muted:  { color: 'var(--text-muted)' },
};

export default function OwnerDashboardPage() {
  const [grounds, setGrounds] = useState(FALLBACK_GROUNDS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroundForSlots, setSelectedGroundForSlots] = useState(null);
  const [slotDate, setSlotDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('06:00:00');
  const [endTime, setEndTime] = useState('09:00:00');
  const [slotPrice, setSlotPrice] = useState(3500);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiClient.get('/grounds')
      .then(res => { if (res.data.success && res.data.data.grounds.length > 0) setGrounds(res.data.data.grounds); })
      .catch(() => {});
  }, []);

  const handleAddSlotToGround = async (e) => {
    e.preventDefault();
    if (!selectedGroundForSlots) return;
    setSubmitting(true);
    try {
      const payload = { slots: [{ slot_date: slotDate, start_time: startTime, end_time: endTime, price: parseInt(slotPrice, 10) }] };
      const res = await apiClient.post(`/grounds/${selectedGroundForSlots.id}/slots`, payload);
      if (res.data.success) {
        alert('✅ New slot published to the live marketplace!');
        setSelectedGroundForSlots(null);
      }
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to add slot');
    } finally {
      setSubmitting(false);
    }
  };

  const STATS = [
    { label: 'Venues Listed',     value: grounds.length, suffix: '', icon: <MapPin className="w-5 h-5" />,        note: '● Active across 3 cities', color: 'var(--brand)',        bg: 'var(--brand-light)',  textColor: 'var(--brand-text)' },
    { label: 'Slots Published',   value: 24,             suffix: '', icon: <CalendarCheck className="w-5 h-5" />, note: '8 booked today',            color: 'var(--green)',        bg: 'var(--green-light)',  textColor: 'var(--green-text)' },
    { label: 'Total Revenue',     value: '₹36,000',      suffix: '', icon: <DollarSign className="w-5 h-5" />,    note: 'Direct settlements',        color: '#7c3aed',             bg: '#f5f3ff',             textColor: '#6d28d9' },
    { label: 'Occupancy Rate',    value: '85%',          suffix: '', icon: <BarChart3 className="w-5 h-5" />,     note: '↑ High weekend demand',     color: 'var(--amber)',        bg: 'var(--amber-light)',  textColor: 'var(--amber-text)' },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Shield className="w-7 h-7" style={{ color: 'var(--brand-text)' }} />
            Ground Owner Dashboard
          </h1>
          <p className="text-sm mt-1" style={S.muted}>
            Publish venues, schedule time slots, and monitor booking activity.
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary shrink-0">
          <Plus className="w-4 h-4" />
          Add New Ground
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, icon, note, bg, textColor }) => (
          <div key={label} className="p-5 rounded-2xl space-y-3" style={S.card}>
            <div className="flex items-center justify-between">
              <p style={S.label}>{label}</p>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg, color: textColor }}>
                {icon}
              </div>
            </div>
            <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
            <p className="text-xs font-medium" style={S.muted}>{note}</p>
          </div>
        ))}
      </div>

      {/* Grounds List */}
      <div className="space-y-4">
        <h2 style={S.h2}>Your Managed Grounds</h2>
        <div className="space-y-3">
          {grounds.map(ground => (
            <div key={ground.id}
              className="p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
              style={S.card}>
              <div className="flex items-center gap-4">
                <img
                  src={ground.cover_image_url || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=200&q=80'}
                  alt={ground.name}
                  className="w-14 h-14 rounded-xl object-cover shrink-0"
                  style={{ border: '1px solid var(--border-color)' }}
                />
                <div>
                  <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{ground.name}</h3>
                  <div className="flex items-center gap-3 text-xs mt-1" style={S.muted}>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" style={{ color: 'var(--brand-text)' }} />
                      {ground.city}
                    </span>
                    <span>·</span>
                    <span>Base: ₹{ground.starting_price || 3500}/slot</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(ground.amenities || ['Floodlights', 'Turf']).slice(0, 3).map(a => (
                      <span key={a} className="px-2 py-0.5 rounded-md text-[10px] font-medium"
                        style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: 'var(--green-light)', color: 'var(--green-text)', border: '1px solid var(--green-border)' }}>
                  ● Active
                </span>
                <button
                  onClick={() => setSelectedGroundForSlots(ground)}
                  className="btn-secondary text-xs py-1.5"
                  style={{ color: 'var(--brand-text)', borderColor: 'var(--brand-border)' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Slots
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Slot Modal */}
      {selectedGroundForSlots && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'var(--overlay)', backdropFilter: 'blur(6px)' }}>
          <div className="relative w-full max-w-md rounded-2xl p-6 sm:p-8" style={{ background: 'var(--bg-modal)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-modal)' }}>
            <button onClick={() => setSelectedGroundForSlots(null)}
              className="absolute top-4 right-4 theme-toggle">
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Add Slot — {selectedGroundForSlots.name}
            </h3>
            <p className="text-sm mt-1" style={S.muted}>Publish a new time slot to the booking marketplace.</p>

            <form onSubmit={handleAddSlotToGround} className="space-y-4 mt-6">
              <div>
                <label className="form-label">Slot Date</label>
                <input type="date" value={slotDate} onChange={(e) => setSlotDate(e.target.value)} className="input" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Start Time</label>
                  <input type="time" step="1" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input" required />
                </div>
                <div>
                  <label className="form-label">End Time</label>
                  <input type="time" step="1" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input" required />
                </div>
              </div>
              <div>
                <label className="form-label">Price (₹)</label>
                <input type="number" min="0" step="100" value={slotPrice} onChange={(e) => setSlotPrice(e.target.value)} className="input" required />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button type="button" onClick={() => setSelectedGroundForSlots(null)} className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Publish Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateGroundModal
          onClose={() => setShowCreateModal(false)}
          onGroundCreated={(created) => setGrounds(prev => [created, ...prev])}
        />
      )}
    </div>
  );
}
