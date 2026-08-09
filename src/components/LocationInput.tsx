// src/components/LocationInput.tsx
import React, { useState } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';

interface LocationInputProps {
  onLocationSelect: (location: { latitude: number; longitude: number; address: string }) => void;
}

export function LocationInput({ onLocationSelect }: LocationInputProps) {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Get browser Geolocation (Latitude & Longitude)
  const handleGetBrowserLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // Reverse geocode using OpenStreetMap Nominatim (Free, no API key required)
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          const displayAddress = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          setAddress(displayAddress);
          onLocationSelect({ latitude: lat, longitude: lng, address: displayAddress });
        } catch {
          onLocationSelect({ latitude: lat, longitude: lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        setError(`Location access denied: ${err.message}`);
      }
    );
  };

  // 2. Geocode manually typed address string
  const handleManualSearch = async () => {
    if (!address.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await res.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        onLocationSelect({ latitude: lat, longitude: lng, address: data[0].display_name });
      } else {
        setError('Location not found. Please try a different address.');
      }
    } catch {
      setError('Failed to look up address location.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-slate">Your location</span>

      <div className="flex gap-2">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
          placeholder="Enter address, street, or city…"
          className="w-full rounded-2xl bg-white border border-midnight/10 px-4 py-3.5 text-midnight placeholder:text-slate/50 focus:outline-none focus:border-gold focus:ring-4 focus:ring-gold/10 transition-shadow"
        />
        <button
          type="button"
          onClick={handleManualSearch}
          disabled={loading}
          aria-label="Search address"
          className="shrink-0 grid place-items-center rounded-2xl bg-gold text-midnight px-4 hover:bg-gold-light active:scale-[0.98] transition-all disabled:opacity-45 disabled:pointer-events-none"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </button>
      </div>

      <button
        type="button"
        onClick={handleGetBrowserLocation}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-pill bg-midnight text-white font-bold py-3.5 px-6 hover:bg-deep-blue active:scale-[0.99] transition-all disabled:opacity-45 disabled:pointer-events-none"
      >
        <MapPin className="w-4 h-4" /> Use current location
      </button>

      {loading && <p className="text-sm text-slate">Detecting location…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}