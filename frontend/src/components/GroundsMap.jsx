import { useEffect, useRef, useState } from 'react';
import { Map, Marker, Popup, NavigationControl, LngLatBounds, setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Locate, Loader2, Layers } from 'lucide-react';

// Vite worker setup for MapLibre
try {
  setWorkerUrl(workerUrl);
} catch {
  // already configured
}

export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;
  return dist < 10 ? dist.toFixed(1) : Math.round(dist);
}

const MAP_STYLES = {
  fiord: { label: 'Fiord', url: 'https://tiles.openfreemap.org/styles/fiord' },
  dark: { label: 'Dark', url: 'https://tiles.openfreemap.org/styles/dark' },
  liberty: { label: 'Liberty', url: 'https://tiles.openfreemap.org/styles/liberty' },
  bright: { label: 'Bright', url: 'https://tiles.openfreemap.org/styles/bright' }
};

export default function GroundsMap({
  grounds = [],
  selectedGroundId = null,
  onSelectGround,
  userLocation,
  onUserLocationFound,
  className = 'h-[500px] w-full rounded-3xl overflow-hidden'
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);

  const [currentStyle, setCurrentStyle] = useState('fiord');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  // Initialize MapLibre with OpenFreeMap vector style
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default center in Mumbai/India
    const defaultLng = 72.8258;
    const defaultLat = 18.9389;

    const map = new Map({
      container: mapContainerRef.current,
      style: MAP_STYLES[currentStyle].url,
      center: [defaultLng, defaultLat],
      zoom: 11,
      attributionControl: false
    });

    // Add navigation controls (zoom, pitch, compass)
    map.addControl(new NavigationControl({ showCompass: true }), 'bottom-right');

    mapInstanceRef.current = map;

    return () => {
      markersRef.current.forEach(m => m.remove());
      if (userMarkerRef.current) userMarkerRef.current.remove();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map style when user switches (dark / liberty / bright)
  const switchStyle = (styleKey) => {
    setCurrentStyle(styleKey);
    setShowStyleMenu(false);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setStyle(MAP_STYLES[styleKey].url);
    }
  };

  // Render Grounds Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const validGrounds = grounds.filter(g => g.latitude && g.longitude);
    if (validGrounds.length === 0) return;

    const bounds = new LngLatBounds();

    validGrounds.forEach(ground => {
      const lat = parseFloat(ground.latitude);
      const lng = parseFloat(ground.longitude);
      bounds.extend([lng, lat]);

      const isSelected = selectedGroundId === ground.id;
      const priceText = `₹${(ground.starting_price / 1000).toFixed(1)}k`;

      // Custom HTML Marker Element
      const el = document.createElement('div');
      el.className = 'custom-cricket-marker cursor-pointer group select-none';
      el.innerHTML = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; inset: -4px; border-radius: 9999px; background: rgba(16, 185, 129, ${isSelected ? '0.75' : '0.25'}); ${isSelected ? 'animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;' : ''}"></div>
          <div style="position: relative; display: flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 9999px; background: ${isSelected ? '#10B981' : '#0F172A'}; color: ${isSelected ? '#020617' : '#34D399'}; border: 1.5px solid #10B981; font-weight: 700; font-size: 11px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'}; transition: transform 0.2s;">
            <span>🏏</span>
            <span>${priceText}</span>
          </div>
        </div>
      `;

      // Distance from user
      const distance = userLocation
        ? calculateDistance(userLocation.lat, userLocation.lng, lat, lng)
        : null;

      // Popup Content
      const popupHtml = `
        <div style="font-family: inherit; width: 220px; color: #fff; background: #0B1120; border-radius: 14px; overflow: hidden; border: 1px solid rgba(255,255,255,0.12); box-shadow: 0 14px 30px rgba(0,0,0,0.7);">
          <img src="${ground.cover_image_url || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=400&q=80'}" style="width: 100%; height: 105px; object-fit: cover;" />
          <div style="padding: 12px;">
            <div style="font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 2px;">${ground.name}</div>
            <div style="font-size: 11px; color: #94A3B8; margin-bottom: 8px;">
              📍 ${ground.city} ${distance ? `• <strong style="color: #34D399;">${distance} km away</strong>` : ''}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 11px;">
              <span style="color: #94A3B8;">Slots: <strong style="color: #10B981;">${ground.available_slots_count || 3} available</strong></span>
              <span style="font-weight: 800; color: #34D399; font-size: 13px;">₹${ground.starting_price}</span>
            </div>
            <a href="/grounds/${ground.id}" style="display: block; text-align: center; background: #10B981; color: #020617; font-weight: 700; font-size: 11px; padding: 7px 0; border-radius: 8px; text-decoration: none;">
              Reserve Pitch Slot
            </a>
          </div>
        </div>
      `;

      const popup = new Popup({ offset: 25, closeButton: false })
        .setHTML(popupHtml);

      const marker = new Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener('click', () => {
        if (onSelectGround) onSelectGround(ground);
      });

      markersRef.current.push(marker);
    });

    // Auto-fit bounds if grounds loaded and no user override
    if (!userLocation && validGrounds.length > 0) {
      map.fitBounds(bounds, { padding: 50, maxZoom: 13, duration: 1000 });
    }
  }, [grounds, selectedGroundId, userLocation]);

  // Handle User Location Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation) {
      if (userMarkerRef.current) userMarkerRef.current.remove();

      const userEl = document.createElement('div');
      userEl.innerHTML = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 32px; height: 32px; border-radius: 9999px; background: #38BDF8; opacity: 0.6; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 16px; height: 16px; border-radius: 9999px; background: #0284C7; border: 2.5px solid #FFFFFF; box-shadow: 0 0 12px #38BDF8;"></div>
        </div>
      `;

      const userPopup = new Popup({ offset: 15, closeButton: false })
        .setHTML('<div style="font-size:11px; font-weight:700; color:#fff; background:#0B1120; padding:5px 9px; border-radius:6px; border:1px solid rgba(255,255,255,0.1);">📍 Your Current Location</div>');

      userMarkerRef.current = new Marker({ element: userEl })
        .setLngLat([userLocation.lng, userLocation.lat])
        .setPopup(userPopup)
        .addTo(map);

      map.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 12.5, duration: 1500 });
    }
  }, [userLocation]);

  // Geolocation trigger
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        if (onUserLocationFound) onUserLocationFound(coords);
      },
      (err) => {
        setIsLocating(false);
        // Fallback to Mumbai cricket center
        const fallbackCoords = { lat: 18.9389, lng: 72.8258 };
        setLocationError('GPS permission denied. Showing city center.');
        if (onUserLocationFound) onUserLocationFound(fallbackCoords);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  return (
    <div className={`relative ${className} border border-white/10 shadow-2xl bg-surface-950`}>
      {/* MapLibre DOM Element */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Controls Bar */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        <button
          onClick={handleLocateMe}
          disabled={isLocating}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-900/90 hover:bg-surface-850 text-white border border-white/15 backdrop-blur-md text-xs font-semibold shadow-xl transition-all"
        >
          {isLocating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
          ) : (
            <Locate className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span>{isLocating ? 'Locating...' : 'Find Grounds Near Me'}</span>
        </button>

        {/* Map Style Selector (OpenFreeMap Styles) */}
        <div className="relative">
          <button
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-900/90 hover:bg-surface-850 text-slate-300 border border-white/15 backdrop-blur-md text-xs font-medium shadow-xl transition-all"
            title="Switch OpenFreeMap style"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span className="capitalize">{MAP_STYLES[currentStyle].label}</span>
          </button>

          {showStyleMenu && (
            <div className="absolute left-0 mt-2 w-32 rounded-xl glass-panel p-1.5 shadow-2xl border border-white/10 z-20 animate-in fade-in">
              {Object.entries(MAP_STYLES).map(([key, style]) => (
                <button
                  key={key}
                  onClick={() => switchStyle(key)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    currentStyle === key
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                      : 'text-slate-300 hover:bg-surface-800'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {userLocation && (
          <div className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-medium backdrop-blur-md flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>Sorted by Proximity</span>
          </div>
        )}

        {locationError && (
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs backdrop-blur-md">
            {locationError}
          </div>
        )}
      </div>

      {/* Attribution Badge (OpenFreeMap + OpenStreetMap) */}
      <div className="absolute bottom-3 left-4 z-10 px-2.5 py-1 rounded-lg bg-surface-950/80 border border-white/10 backdrop-blur-md text-[10px] text-slate-400 flex items-center gap-2">
        <a 
          href="https://openfreemap.org" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-emerald-400 hover:underline font-semibold"
        >
          OpenFreeMap
        </a>
        <span>•</span>
        <span>© OpenStreetMap</span>
      </div>
    </div>
  );
}
