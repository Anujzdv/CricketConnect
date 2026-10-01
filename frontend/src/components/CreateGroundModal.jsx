import { useState } from 'react';
import { X, Plus, Shield, Loader2 } from 'lucide-react';
import { apiClient } from '../lib/api';

const AVAILABLE_AMENITIES = [
  'Floodlights',
  'Pavilion',
  'Changing Rooms',
  'Drinking Water',
  'Parking',
  'Grass Pitch',
  'AstroTurf',
  'Scoreboard',
  'Cafeteria'
];

export default function CreateGroundModal({ onClose, onGroundCreated }) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState(['Floodlights', 'Pavilion', 'Drinking Water']);
  const [startingPrice, setStartingPrice] = useState(3500);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleAmenity = (amenity) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Create Ground
      const groundRes = await apiClient.post('/grounds', {
        name,
        city,
        cover_image_url: coverImageUrl || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
        amenities: selectedAmenities
      });

      if (groundRes.data.success) {
        const createdGround = groundRes.data.data;
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

        // 2. Auto-generate initial slots for today and tomorrow
        const initialSlots = [
          { slot_date: today, start_time: '06:00:00', end_time: '09:00:00', price: parseInt(startingPrice, 10) },
          { slot_date: today, start_time: '16:00:00', end_time: '19:00:00', price: parseInt(startingPrice, 10) + 500 },
          { slot_date: tomorrow, start_time: '06:00:00', end_time: '09:00:00', price: parseInt(startingPrice, 10) },
          { slot_date: tomorrow, start_time: '16:00:00', end_time: '19:00:00', price: parseInt(startingPrice, 10) + 500 }
        ];

        await apiClient.post(`/grounds/${createdGround.id}/slots`, { slots: initialSlots });

        if (onGroundCreated) onGroundCreated(createdGround);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to list ground');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-surface-850 hover:bg-surface-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-heading">List a Cricket Ground</h3>
              <p className="text-xs text-slate-400">Ground Owner venue registration & slot generator</p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Ground Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Shivaji Park International Turf"
                className="w-full px-3 py-2.5 rounded-xl bg-surface-850 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mumbai, Bengaluru"
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-850 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Base Price / Slot (₹)</label>
                <input
                  type="number"
                  min="500"
                  step="100"
                  value={startingPrice}
                  onChange={(e) => setStartingPrice(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-850 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-400 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Cover Image URL (Optional)</label>
              <input
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2.5 rounded-xl bg-surface-850 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Amenities</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AVAILABLE_AMENITIES.map(amenity => (
                  <button
                    type="button"
                    key={amenity}
                    onClick={() => toggleAmenity(amenity)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                      selectedAmenities.includes(amenity)
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-surface-850 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {selectedAmenities.includes(amenity) ? '✓ ' : '+ '}{amenity}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              ⚡ Submitting automatically generates 4 initial time slots for today and tomorrow.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-surface-850 hover:bg-surface-800 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-surface-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Create Ground & Slots</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
