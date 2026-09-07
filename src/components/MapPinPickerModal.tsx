import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  X,
  Search,
  MapPin,
  Navigation,
  Loader2,
  Check,
  Sparkles,
  Compass,
} from 'lucide-react';
import {
  reverseGeocodeCoordinates,
  searchIndiaAddress,
  type DetectedAddress,
} from '../utils/geolocation';

interface MapPinPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmAddress: (address: DetectedAddress) => void;
  initialCoords?: { lat: number; lon: number };
  initialPostalCode?: string;
  theme?: 'noir' | 'alabaster';
}

export const MapPinPickerModal: React.FC<MapPinPickerModalProps> = ({
  isOpen,
  onClose,
  onConfirmAddress,
  initialCoords,
  initialPostalCode,
  theme = 'noir',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Default to Mumbai or provided initial coords
  const defaultLat = initialCoords?.lat || 19.0760;
  const defaultLon = initialCoords?.lon || 72.8777;

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Current Pinned Location details
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<DetectedAddress>({
    address: 'Position the pin over your residence',
    apartment: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: initialPostalCode || '',
    country: 'India',
    source: 'gps',
  });

  // Editable postal code override
  const [editablePinCode, setEditablePinCode] = useState(initialPostalCode || '');
  const [isGpsLocating, setIsGpsLocating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Initialize and teardown Leaflet map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Destroy existing instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLon],
      zoom: initialCoords ? 16 : 14,
      zoomControl: false,
    });

    mapInstanceRef.current = map;

    // CartoDB tiles for dark luxury aesthetic
    const tileUrl = theme === 'alabaster'
      ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
    }).addTo(map);

    // Initial reverse geocode
    geocodeCenter(map.getCenter());

    // Map Event Listeners
    map.on('movestart', () => {
      setIsDragging(true);
    });

    map.on('moveend', () => {
      setIsDragging(false);
      geocodeCenter(map.getCenter());
    });

    // Invalidate size after modal animation completes
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, theme]);

  // Debounced reverse geocoding of the map's center
  const geocodeTimeoutRef = useRef<any>(null);

  const geocodeCenter = (center: L.LatLng) => {
    if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);

    setIsGeocoding(true);
    geocodeTimeoutRef.current = setTimeout(async () => {
      const resolved = await reverseGeocodeCoordinates(center.lat, center.lng);
      setIsGeocoding(false);

      if (resolved) {
        setCurrentAddress(resolved);
        if (resolved.postalCode) {
          setEditablePinCode(resolved.postalCode);
        }
      }
    }, 450);
  };

  // Search Address autocomplete
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchIndiaAddress(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
      setShowSearchResults(results.length > 0);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSearchResult = (result: any) => {
    setShowSearchResults(false);
    setSearchQuery(result.displayName);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([result.lat, result.lon], 17, {
        duration: 1.2,
      });
    }

    if (result.postcode) {
      setEditablePinCode(result.postcode);
    }
  };

  // Locate user with device GPS
  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setIsGpsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGpsLocating(false);
        const { latitude, longitude } = pos.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 17, {
            duration: 1.2,
          });
        }
      },
      (err) => {
        setIsGpsLocating(false);
        console.warn('Geolocation failed:', err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Confirm Pinned Location
  const handleConfirm = () => {
    const finalPin = editablePinCode.trim() || currentAddress.postalCode;
    const finalAddress: DetectedAddress = {
      ...currentAddress,
      postalCode: finalPin,
      source: 'gps',
      displayName: `${currentAddress.address}, ${currentAddress.city} - ${finalPin}`,
    };

    onConfirmAddress(finalAddress);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Pinpoint Delivery Address"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className={`relative w-full max-w-3xl h-full sm:h-[88vh] max-h-[780px] rounded-none sm:rounded-3xl border shadow-2xl flex flex-col z-10 overflow-hidden animate-scale-up ${
          theme === 'alabaster'
            ? 'bg-[#faf9f5] border-stone-300 text-stone-900'
            : 'bg-[#0e0e12] border-white/15 text-stone-100'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
            theme === 'alabaster' ? 'bg-white border-stone-200' : 'bg-[#08080a] border-white/10'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Compass className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-brand tracking-[0.25em] text-xs font-semibold uppercase">
                  ATELIER LOCATION PIN
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Exact Coordinates
                </span>
              </div>
              <p className="text-[11px] text-stone-400 font-light mt-0.5">
                Drag the map to position the gold pin on your exact gate or residence.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close Map"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar Overlay */}
        <div className="relative p-3.5 sm:px-5 border-b border-white/10 bg-white/[0.02] shrink-0">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-amber-400/80 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
              placeholder="Search locality, apartment, landmark, or street in India..."
              className="w-full bg-white/[0.04] border border-white/15 focus:border-amber-500/60 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder:text-stone-500 focus:outline-none transition-all"
            />
            {isSearching ? (
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin absolute right-3.5" />
            ) : searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="absolute right-3.5 text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>

          {/* Autocomplete Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute left-3.5 right-3.5 top-full mt-1.5 bg-[#141418] border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-30 max-h-56 overflow-y-auto divide-y divide-white/5 animate-fade-in">
              {searchResults.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSearchResult(item)}
                  className="p-3 hover:bg-white/[0.06] transition-colors cursor-pointer flex items-start space-x-2.5 text-xs"
                >
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium truncate">{item.displayName.split(',')[0]}</p>
                    <p className="text-[10px] text-stone-400 truncate mt-0.5">{item.displayName}</p>
                  </div>
                  {item.postcode && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 shrink-0">
                      {item.postcode}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map Stage */}
        <div className="relative flex-1 w-full overflow-hidden bg-stone-900">
          {/* Leaflet Map Div */}
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Center Fixed Luxury Pin */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
            <div className="relative -translate-y-6 flex flex-col items-center">
              {/* Pin Tooltip Bubble */}
              <div
                className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold whitespace-nowrap shadow-xl border mb-1 transition-all duration-200 ${
                  isDragging
                    ? 'scale-90 opacity-60 bg-black/80 text-stone-300 border-white/20'
                    : 'scale-100 opacity-100 bg-amber-500 text-black border-amber-300'
                }`}
              >
                {isDragging ? 'Dragging Pin...' : isGeocoding ? 'Resolving Address...' : 'Delivery Destination'}
              </div>

              {/* Gold Luxury Pin Icon */}
              <div
                className={`transition-transform duration-200 ${
                  isDragging ? '-translate-y-2 scale-110' : 'translate-y-0 scale-100'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-400/50 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.6)]">
                  <MapPin className="w-7 h-7 text-amber-400 fill-amber-400 drop-shadow-md" />
                </div>
              </div>

              {/* Pin Base Shadow / Ripple */}
              <div
                className={`w-4 h-1.5 rounded-full bg-black/70 blur-[1px] mt-0.5 transition-all duration-200 ${
                  isDragging ? 'scale-75 opacity-40' : 'scale-100 opacity-80'
                }`}
              />
            </div>
          </div>

          {/* Locate Me GPS Button (Floating on Map) */}
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isGpsLocating}
            className="absolute bottom-5 right-5 z-20 p-3 rounded-2xl bg-black/80 hover:bg-black text-amber-400 border border-white/20 shadow-2xl backdrop-blur-md transition-all cursor-pointer disabled:opacity-50 active:scale-95 flex items-center space-x-2 text-xs font-mono"
            title="Pan to device GPS position"
          >
            {isGpsLocating ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <Navigation className="w-4 h-4 fill-amber-400" />
            )}
            <span className="hidden sm:inline">My GPS</span>
          </button>
        </div>

        {/* Bottom Location Confirmation Sheet */}
        <div
          className={`p-4 sm:p-5 border-t shrink-0 space-y-3.5 ${
            theme === 'alabaster' ? 'bg-white border-stone-200' : 'bg-[#08080a] border-white/10'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Resolved Address Details */}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-semibold">
                  Pinned Location Address
                </span>
                {isGeocoding && (
                  <span className="text-[9px] text-stone-400 flex items-center space-x-1">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    <span>Detecting exact street...</span>
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-white truncate leading-snug">
                {currentAddress.address || 'Locating exact address...'}
              </p>
              <p className="text-xs text-stone-400 truncate">
                {currentAddress.city ? `${currentAddress.city}, ${currentAddress.state}` : 'India'}
              </p>
            </div>

            {/* Editable PIN Code Box */}
            <div className="shrink-0 flex items-center space-x-2 bg-white/[0.04] border border-white/15 rounded-xl px-3 py-2">
              <div className="text-right">
                <span className="block text-[9px] uppercase font-mono tracking-wider text-stone-400">
                  Postal PIN Code *
                </span>
                <input
                  type="text"
                  maxLength={6}
                  value={editablePinCode}
                  onChange={(e) => setEditablePinCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-digits"
                  className="w-24 font-mono font-bold text-sm text-amber-400 bg-transparent text-right focus:outline-none placeholder:text-stone-600"
                />
              </div>
              {editablePinCode.length === 6 && (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 px-4 rounded-xl border border-white/15 hover:bg-white/5 text-stone-400 hover:text-white text-xs font-sans uppercase tracking-[0.15em] font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isGeocoding}
              className="w-2/3 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-semibold text-xs font-sans uppercase tracking-[0.15em] shadow-xl shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Confirm & Apply Location</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
