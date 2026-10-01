import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, SlidersHorizontal, RotateCcw, AlertCircle, Map, LayoutGrid, Locate } from 'lucide-react';
import GroundCard from '../components/GroundCard';
import GroundsMap, { calculateDistance } from '../components/GroundsMap';
import { apiClient, FALLBACK_GROUNDS } from '../lib/api';

const CITIES = ['All', 'Mumbai', 'Bengaluru', 'Delhi'];
const AMENITIES = ['Floodlights', 'Pavilion', 'AstroTurf', 'Grass Pitch', 'Parking'];

export default function GroundsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [grounds, setGrounds] = useState(FALLBACK_GROUNDS);
  const [viewMode, setViewMode] = useState('grid');
  const [userLocation, setUserLocation] = useState(null);
  const [selectedGroundId, setSelectedGroundId] = useState(null);

  const cityParam    = searchParams.get('city') || 'All';
  const amenityParam = searchParams.get('amenity') || '';
  const searchInput  = searchParams.get('search') || '';

  const [selectedCity,    setSelectedCity]    = useState(cityParam);
  const [selectedAmenity, setSelectedAmenity] = useState(amenityParam);
  const [searchTerm,      setSearchTerm]      = useState(searchInput);

  useEffect(() => {
    const params = {};
    if (selectedCity && selectedCity !== 'All') params.city = selectedCity;
    if (selectedAmenity) params.amenity = selectedAmenity;

    apiClient.get('/grounds', { params })
      .then(res => {
        let list = (res.data.success && res.data.data.grounds.length > 0)
          ? res.data.data.grounds
          : [...FALLBACK_GROUNDS];
        if (selectedCity && selectedCity !== 'All') list = list.filter(g => g.city.toLowerCase() === selectedCity.toLowerCase());
        if (selectedAmenity) list = list.filter(g => g.amenities?.includes(selectedAmenity));
        if (userLocation) {
          list = list.map(g => ({ ...g, distance: calculateDistance(userLocation.lat, userLocation.lng, g.latitude, g.longitude) }))
            .sort((a, b) => (parseFloat(a.distance) || 999) - (parseFloat(b.distance) || 999));
        }
        setGrounds(list);
      })
      .catch(() => {
        let filtered = [...FALLBACK_GROUNDS];
        if (selectedCity && selectedCity !== 'All') filtered = filtered.filter(g => g.city.toLowerCase() === selectedCity.toLowerCase());
        if (selectedAmenity) filtered = filtered.filter(g => g.amenities?.includes(selectedAmenity));
        if (userLocation) {
          filtered = filtered.map(g => ({ ...g, distance: calculateDistance(userLocation.lat, userLocation.lng, g.latitude, g.longitude) }))
            .sort((a, b) => (parseFloat(a.distance) || 999) - (parseFloat(b.distance) || 999));
        }
        setGrounds(filtered);
      });
  }, [selectedCity, selectedAmenity, userLocation]);

  const handleUserLocationFound = (coords) => {
    setUserLocation(coords);
    setGrounds(prev => prev
      .map(g => ({ ...g, distance: calculateDistance(coords.lat, coords.lng, g.latitude, g.longitude) }))
      .sort((a, b) => (parseFloat(a.distance) || 999) - (parseFloat(b.distance) || 999))
    );
  };

  const handleReset = () => {
    setSelectedCity('All'); setSelectedAmenity(''); setSearchTerm('');
    setUserLocation(null); setSelectedGroundId(null); setSearchParams({});
  };

  const displayedGrounds = grounds.filter(g =>
    !searchTerm || g.name.toLowerCase().includes(searchTerm.toLowerCase()) || g.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Explore Cricket Venues</h1>
        <p className="text-sm text-gray-500 mt-1">
          Browse verified cricket turf arenas, stadiums, and grounds with real-time slot availability.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200">
            <Search className="w-4 h-4 text-blue-600 shrink-0" />
            <input
              type="text"
              placeholder="Search by venue name or city…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-sm text-gray-900 focus:outline-none w-full placeholder-gray-400"
            />
          </div>
          {/* Reset */}
          {(selectedCity !== 'All' || selectedAmenity || searchTerm) && (
            <button
              onClick={handleReset}
              className="btn-secondary text-sm shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>

        {/* City Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-blue-600" /> City:
          </span>
          {CITIES.map(city => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: selectedCity === city ? '#1d4ed8' : '#f9fafb',
                color:      selectedCity === city ? '#ffffff' : '#4b5563',
                border:     selectedCity === city ? 'none' : '1px solid #e5e7eb',
                fontWeight: selectedCity === city ? '700' : '500',
              }}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Amenity Chips */}
        <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" /> Amenity:
          </span>
          {AMENITIES.map(amenity => (
            <button
              key={amenity}
              onClick={() => setSelectedAmenity(selectedAmenity === amenity ? '' : amenity)}
              className="px-2.5 py-1 rounded-lg text-xs transition-all"
              style={{
                background:  selectedAmenity === amenity ? '#dbeafe' : '#f9fafb',
                color:       selectedAmenity === amenity ? '#1e40af' : '#6b7280',
                border:      selectedAmenity === amenity ? '1px solid #93c5fd' : '1px solid #e5e7eb',
                fontWeight:  selectedAmenity === amenity ? '600' : '400',
              }}
            >
              {amenity}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header + View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
        <div className="text-gray-500">
          Showing <strong className="text-gray-900">{displayedGrounds.length}</strong> cricket grounds
          {userLocation && <span className="text-blue-600 ml-2 font-medium">· Sorted by distance</span>}
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 border border-gray-200 self-start sm:self-auto">
          {[
            { mode: 'grid', Icon: LayoutGrid, label: 'Grid' },
            { mode: 'map',  Icon: Map,         label: 'Map'  },
          ].map(({ mode, Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: viewMode === mode ? '#1d4ed8' : 'transparent',
                color:      viewMode === mode ? '#ffffff' : '#6b7280',
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="space-y-6">
          <GroundsMap
            grounds={displayedGrounds}
            selectedGroundId={selectedGroundId}
            onSelectGround={(ground) => setSelectedGroundId(ground.id)}
            userLocation={userLocation}
            onUserLocationFound={handleUserLocationFound}
            className="h-[520px] w-full rounded-2xl"
          />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              Grounds Sorted by Distance
            </h2>
            <span className="text-xs text-gray-500">Click any map marker to inspect venue</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedGrounds.map((ground) => (
              <div key={ground.id} className={selectedGroundId === ground.id ? 'ring-2 ring-blue-500 rounded-2xl' : ''}>
                <GroundCard ground={ground} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <>
          {displayedGrounds.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedGrounds.map((ground) => (
                <GroundCard key={ground.id} ground={ground} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">No Grounds Found</h3>
                <p className="text-sm text-gray-500 mt-1">Try relaxing your search terms or selecting a different city.</p>
              </div>
              <button
                onClick={handleReset}
                className="btn-secondary mx-auto"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
