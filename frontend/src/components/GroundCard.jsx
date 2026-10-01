import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Zap, CheckCircle2, Star } from 'lucide-react';

export default function GroundCard({ ground }) {
  const fallbackImage = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="bg-white rounded-2xl overflow-hidden flex flex-col border border-gray-200 hover:border-blue-200 transition-all group"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)', transition: 'box-shadow 0.2s, border-color 0.2s, transform 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Cover Image */}
      <div className="relative h-44 w-full overflow-hidden bg-gray-100">
        <img
          src={ground.cover_image_url || fallbackImage}
          alt={ground.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* City badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 backdrop-blur-sm border border-white/60 text-gray-700 shadow-sm">
          <MapPin className="w-3 h-3 text-blue-600" />
          {ground.city}
          {ground.distance != null && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
              {ground.distance} km
            </span>
          )}
        </div>
        {/* Available slots */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-green-500 text-white shadow-sm">
          <Zap className="w-3 h-3" />
          {ground.available_slots_count || '—'} Slots
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-bold text-gray-900 leading-snug group-hover:text-blue-700 transition-colors">
              {ground.name}
            </h3>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-gray-400 block">From</span>
              <span className="text-sm font-bold text-gray-900">
                ₹{parseInt(ground.starting_price || 3000, 10).toLocaleString()}
                <span className="text-xs font-normal text-gray-400">/slot</span>
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">by {ground.owner_name || 'Ground Owner'}</p>

          {/* Amenity chips */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {(ground.amenities || ['Floodlights', 'Turf', 'Pavilion']).slice(0, 4).map((amenity, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200"
              >
                {amenity}
              </span>
            ))}
            {(ground.amenities?.length || 0) > 4 && (
              <span className="px-2 py-0.5 rounded-md text-[11px] text-gray-400">
                +{ground.amenities.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
            Instant Booking
          </span>
          <Link
            to={`/grounds/${ground.id}`}
            className="btn-primary py-1.5 px-4 text-xs"
          >
            View Slots
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
